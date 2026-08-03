'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Globe, MapPin, Zap, Users, CheckCircle, Clock, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const platforms = [
  { id: 'google_maps', name: 'Google Maps', desc: 'Reviews & contacts from property businesses', icon: '🗺️' },
  { id: 'justdial', name: 'JustDial', desc: 'Real estate inquiries in target city', icon: '📞' },
  { id: 'facebook_groups', name: 'Facebook Groups', desc: 'Posts with buying intent keywords', icon: '👥' },
  { id: '99acres', name: '99acres', desc: 'Active property seekers in area', icon: '🏠' },
  { id: 'magicbricks', name: 'MagicBricks', desc: 'Buyer inquiries for similar properties', icon: '🧱' },
  { id: 'instagram', name: 'Instagram', desc: 'Engaged users on real estate content', icon: '📸' },
  { id: 'linkedin', name: 'LinkedIn', desc: 'Real estate professionals & investors', icon: '💼' },
  { id: 'n8n_custom', name: 'n8n Custom Workflow', desc: 'Your own automation workflow', icon: '⚡' },
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

  const { data: leadsData } = useQuery({
    queryKey: ['scraped-leads'],
    queryFn: () => api.get('/lead-scraper/leads'),
  });

  const scrapeMutation = useMutation({
    mutationFn: (dto: any) => api.post('/lead-scraper/start', dto),
    onSuccess: (res: any) => {
      toast.success(res?.data?.message || 'Scrape job started!');
      queryClient.invalidateQueries({ queryKey: ['scraper-jobs'] });
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['scraped-leads'] }), 5000);
    },
    onError: () => toast.error('Failed to start scraper'),
  });

  const jobs = jobsData?.data || [];
  const leads = leadsData?.data || [];

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
                        <span className="flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> Failed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scraped Leads Count */}
          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" /> Scraped Leads ({leads.length})
            </h3>
            {leads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Run a scrape to find leads</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {leads.slice(0, 15).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-2.5 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">{lead.tags?.[1] || 'scraped'}</span>
                    </div>
                  </div>
                ))}
                {leads.length > 15 && (
                  <p className="text-xs text-center text-muted-foreground">+{leads.length - 15} more in CRM</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
