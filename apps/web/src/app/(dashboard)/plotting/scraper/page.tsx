'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, Zap, Users, CheckCircle, Clock, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

// Only these two have a scraper script behind them. The rest were aspirational
// and would silently run the listings scraper instead.
const platforms = [
  {
    id: 'google_maps',
    name: 'Google Maps',
    desc: 'Property businesses & dealers with phone numbers',
    icon: '🗺️',
    ready: true,
  },
  {
    id: 'listing_sites',
    name: '99acres + MagicBricks',
    desc: 'Agents listing plots in your area',
    icon: '🏠',
    ready: true,
  },
  {
    id: 'n8n_custom',
    name: 'n8n Custom Workflow',
    desc: 'Push leads in from your own automation',
    icon: '⚡',
    ready: true,
  },
];

export default function LeadScraperPage() {
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState('google_maps');
  const [targetArea, setTargetArea] = useState('Pune');
  const [keywords, setKeywords] = useState('plots for sale, NA plots, land buy');
  const [n8nUrl, setN8nUrl] = useState('');

  const { data: jobsData } = useQuery({
    queryKey: ['scraper-jobs'],
    queryFn: () => api.get('/lead-scraper/jobs'),
    refetchInterval: 5000,
  });

  const jobs: any[] = (jobsData as any)?.data || [];
  const isScraping = jobs.some((j) => j.status === 'running');

  // While a scrape is running, poll results so rows appear as they land.
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['scraped-leads'],
    queryFn: () => api.get('/lead-scraper/leads'),
    refetchInterval: isScraping ? 5000 : false,
  });

  const { data: statsData } = useQuery({
    queryKey: ['scraper-stats'],
    queryFn: () => api.get('/lead-scraper/stats'),
    refetchInterval: isScraping ? 5000 : 30000,
  });

  const scrapeMutation = useMutation({
    mutationFn: (dto: any) => api.post('/lead-scraper/start', dto),
    onSuccess: (res: any) => {
      toast.success(res?.data?.message || 'Scrape started. Results appear below as they are found.');
      queryClient.invalidateQueries({ queryKey: ['scraper-jobs'] });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.message || err?.message || 'Failed to start scraper'),
  });

  const leads: any[] = (leadsData as any)?.data || [];
  const stats: any = (statsData as any)?.data || {};

  const handleStart = () => {
    scrapeMutation.mutate({
      platform: selectedPlatform,
      targetArea,
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      ...(n8nUrl && { n8nWebhookUrl: n8nUrl }),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Search className="h-8 w-8 text-primary" /> Lead Scraper
        </h1>
        <p className="text-muted-foreground mt-1">
          Find people interested in property in your target area — from Google Maps, JustDial, Facebook, 99acres & more
        </p>
      </div>

      {/* Totals straight from the database, so scheduled cron runs count too */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-2xl font-bold">{stats.total ?? 0}</p>
          <p className="text-xs text-muted-foreground">Total scraped</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-600">{stats.withPhone ?? 0}</p>
          <p className="text-xs text-muted-foreground">With phone</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-2xl font-bold">{stats.last24h ?? 0}</p>
          <p className="text-xs text-muted-foreground">Last 24 hours</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-2xl font-bold">{stats.last7d ?? 0}</p>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-2xl font-bold">{stats.contacted ?? 0}</p>
          <p className="text-xs text-muted-foreground">Contacted</p>
        </div>
      </div>

      {stats.lastScrapeAt && (
        <p className="text-xs text-muted-foreground">
          Newest lead added {new Date(stats.lastScrapeAt).toLocaleString()}
          {stats.byPlatform?.length > 0 && (
            <> · by source: {stats.byPlatform.map((p: any) => `${p.platform} (${p.count})`).join(', ')}</>
          )}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scraper Config */}
        <div className="lg:col-span-2 space-y-5">
          {/* Platform Selection */}
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold mb-4">Select Platform</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`p-3 border rounded-xl text-left transition hover:border-primary/40 ${
                    selectedPlatform === p.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <p className="text-sm font-medium mt-1">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="bg-card border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold">Scrape Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Target Area
                </label>
                <input
                  type="text"
                  value={targetArea}
                  onChange={(e) => setTargetArea(e.target.value)}
                  placeholder="e.g., Pune, Baner, Hinjewadi"
                  className="w-full px-4 py-2.5 border rounded-lg text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-primary" /> Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="plots for sale, NA plots, land, property"
                  className="w-full px-4 py-2.5 border rounded-lg text-sm bg-background"
                />
              </div>
            </div>

            {selectedPlatform === 'n8n_custom' && (
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" /> n8n Webhook URL
                </label>
                <input
                  type="url"
                  value={n8nUrl}
                  onChange={(e) => setN8nUrl(e.target.value)}
                  placeholder="https://your-n8n.com/webhook/xxxxx"
                  className="w-full px-4 py-2.5 border rounded-lg text-sm bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  n8n will receive the scrape config and send results back to our webhook
                </p>
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={!targetArea || scrapeMutation.isPending}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition"
            >
              {scrapeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {scrapeMutation.isPending ? 'Starting...' : `Scrape ${platforms.find((p) => p.id === selectedPlatform)?.name}`}
            </button>
          </div>

          {/* n8n Integration Info */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
            <h4 className="font-semibold text-sm flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <Zap className="h-4 w-4" /> n8n Webhook Integration
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1.5">
              External scrapers or n8n workflows can push leads to this endpoint:
            </p>
            <code className="text-xs bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded mt-2 block font-mono">
              POST /api/v1/lead-scraper/webhook/{'<'}workspaceId{'>'}
            </code>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-2">
              Body: {'{'} &quot;leads&quot;: [{'{'} &quot;name&quot;, &quot;phone&quot;, &quot;email&quot;, &quot;platform&quot;, &quot;location&quot;, &quot;intent&quot; {'}'}] {'}'}
            </p>
          </div>
        </div>

        {/* Jobs & Results */}
        <div className="space-y-5">
          {/* Active Jobs */}
          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Scrape Jobs
            </h3>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No jobs yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {jobs.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{job.platform}</p>
                      <p className="text-xs text-muted-foreground">{job.targetArea}</p>
                    </div>
                    <div className="text-right">
                      {job.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="h-3 w-3" /> {job.leadsFound} leads</span>
                      ) : job.status === 'running' ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600"><Loader2 className="h-3 w-3 animate-spin" /> Running</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-600" title={job.error || 'Failed'}>
                          <AlertCircle className="h-3 w-3" /> Failed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Failure detail, since the badge alone doesn't explain anything */}
          {jobs.filter((j) => j.status === 'failed' && j.error).length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Last failure
              </h4>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 break-words">
                {jobs.find((j) => j.status === 'failed' && j.error)?.error}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" /> Scraped Leads ({leads.length})
          </h3>
          {isScraping && (
            <span className="text-xs text-blue-600 flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scraping — this list refreshes automatically
            </span>
          )}
        </div>

        {leadsLoading ? (
          <p className="text-sm text-muted-foreground p-8 text-center">Loading…</p>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center space-y-1">
            <p className="text-sm text-muted-foreground">No scraped leads yet.</p>
            <p className="text-xs text-muted-foreground">
              Start a scrape above, or wait for the scheduled run. Results are also filed into the CRM under Leads.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Business / Name</th>
                  <th className="text-left font-medium px-4 py-2.5">Phone</th>
                  <th className="text-left font-medium px-4 py-2.5">Location</th>
                  <th className="text-left font-medium px-4 py-2.5">Source</th>
                  <th className="text-left font-medium px-4 py-2.5">Status</th>
                  <th className="text-left font-medium px-4 py-2.5">Found</th>
                  <th className="text-left font-medium px-4 py-2.5">Links</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t hover:bg-muted/30">
                    <td className="px-5 py-2.5 font-medium max-w-[240px] truncate" title={lead.name}>
                      {lead.name}
                    </td>
                    <td className="px-4 py-2.5">
                      {lead.phone ? (
                        <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                          {lead.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-[220px] truncate" title={lead.location || ''}>
                      {lead.location || '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
                        {lead.platform || 'scraped'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{lead.status}</td>
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {lead.mapsUrl && (
                          <a
                            href={lead.mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-primary"
                            aria-label={`Open ${lead.name} on Google Maps`}
                          >
                            <MapPin className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {lead.website && (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-primary"
                            aria-label={`Open website for ${lead.name}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
