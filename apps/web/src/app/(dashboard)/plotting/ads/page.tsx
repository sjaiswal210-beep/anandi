'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, IndianRupee, Target, MousePointerClick, TrendingUp, Plus, RefreshCw, Trash2, Pause, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const PLATFORMS = ['meta', 'google', 'whatsapp', 'other'];
const platformLabel: Record<string, string> = {
  meta: 'Meta (FB/IG)', google: 'Google Ads', whatsapp: 'WhatsApp', other: 'Other',
};
const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');

export default function AdsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ name: '', platform: 'meta', budget: '', spent: '', leads: '', impressions: '', clicks: '', status: 'ACTIVE' });

  const { data: summaryData } = useQuery({
    queryKey: ['ads-summary'],
    queryFn: () => api.get('/ads/summary'),
    refetchInterval: 20000,
  });
  const { data: campaignsData } = useQuery({
    queryKey: ['ads-campaigns'],
    queryFn: () => api.get('/ads/campaigns'),
    refetchInterval: 20000,
  });

  const summary: any = (summaryData as any)?.data || {};
  const totals: any = summary.totals || {};
  const byPlatform: any[] = summary.byPlatform || [];
  const campaigns: any[] = (campaignsData as any)?.data || [];

  const createMut = useMutation({
    mutationFn: () =>
      api.post('/ads/campaigns', {
        name: form.name,
        platform: form.platform,
        status: form.status,
        budget: Number(form.budget) || 0,
        spent: Number(form.spent) || 0,
        metrics: {
          leads: Number(form.leads) || 0,
          impressions: Number(form.impressions) || 0,
          clicks: Number(form.clicks) || 0,
        },
      }),
    onSuccess: () => {
      toast.success('Campaign added');
      setShowForm(false);
      setForm({ name: '', platform: 'meta', budget: '', spent: '', leads: '', impressions: '', clicks: '', status: 'ACTIVE' });
      qc.invalidateQueries({ queryKey: ['ads-summary'] });
      qc.invalidateQueries({ queryKey: ['ads-campaigns'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed'),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/ads/campaigns/${id}`),
    onSuccess: () => {
      toast.success('Removed');
      qc.invalidateQueries({ queryKey: ['ads-summary'] });
      qc.invalidateQueries({ queryKey: ['ads-campaigns'] });
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/ads/campaigns/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ads-campaigns'] });
      qc.invalidateQueries({ queryKey: ['ads-summary'] });
    },
  });

  const syncMeta = useMutation({
    mutationFn: () => api.post('/ads/sync-meta', {}),
    onSuccess: (res: any) => {
      const d = res?.data || res;
      toast.success(d.error ? `Meta: ${d.error}` : `Synced ${d.synced ?? 0} Meta campaigns`);
      qc.invalidateQueries({ queryKey: ['ads-summary'] });
      qc.invalidateQueries({ queryKey: ['ads-campaigns'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Sync failed'),
  });

  const cards = [
    { label: 'Total Spend', value: inr(totals.spent), icon: IndianRupee, color: 'text-red-600' },
    { label: 'Budget', value: inr(totals.budget), icon: BarChart3, color: 'text-blue-600' },
    { label: 'Leads', value: totals.leads || 0, icon: Target, color: 'text-emerald-600' },
    { label: 'Cost / Lead', value: inr(totals.cpl), icon: TrendingUp, color: 'text-amber-600' },
    { label: 'Clicks', value: totals.clicks || 0, icon: MousePointerClick, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" /> Ads &amp; Costs
          </h1>
          <p className="text-muted-foreground mt-1">
            Track ad spend and analytics across Meta, Google and other channels
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => syncMeta.mutate()}
            disabled={syncMeta.isPending}
            className="flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {syncMeta.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync Meta
          </button>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add Campaign / Cost
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border rounded-xl p-4 text-center">
            <c.icon className={`h-5 w-5 mx-auto mb-2 ${c.color}`} />
            <p className="text-xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold">Add Campaign / Cost Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name" className="px-3 py-2 border rounded-lg text-sm bg-background md:col-span-2" />
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="px-3 py-2 border rounded-lg text-sm bg-background">
              {PLATFORMS.map((p) => <option key={p} value={p}>{platformLabel[p]}</option>)}
            </select>
            <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="Budget ₹" className="px-3 py-2 border rounded-lg text-sm bg-background" />
            <input type="number" value={form.spent} onChange={(e) => setForm({ ...form, spent: e.target.value })} placeholder="Spent ₹" className="px-3 py-2 border rounded-lg text-sm bg-background" />
            <input type="number" value={form.leads} onChange={(e) => setForm({ ...form, leads: e.target.value })} placeholder="Leads" className="px-3 py-2 border rounded-lg text-sm bg-background" />
            <input type="number" value={form.impressions} onChange={(e) => setForm({ ...form, impressions: e.target.value })} placeholder="Impressions" className="px-3 py-2 border rounded-lg text-sm bg-background" />
            <input type="number" value={form.clicks} onChange={(e) => setForm({ ...form, clicks: e.target.value })} placeholder="Clicks" className="px-3 py-2 border rounded-lg text-sm bg-background" />
          </div>
          <button
            onClick={() => createMut.mutate()}
            disabled={!form.name.trim() || createMut.isPending}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {createMut.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {/* Spend by platform */}
      {byPlatform.length > 0 && (
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Spend by Platform</h3>
          <div className="space-y-3">
            {byPlatform.map((p) => (
              <div key={p.platform} className="flex items-center justify-between border-b last:border-0 py-2">
                <span className="text-sm font-medium">{platformLabel[p.platform] || p.platform}</span>
                <div className="flex items-center gap-6 text-sm">
                  <span>{inr(p.spent)} spent</span>
                  <span className="text-muted-foreground">{p.leads} leads</span>
                  <span className="text-muted-foreground">CPL {inr(p.cpl)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaigns table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="font-semibold">Campaigns ({campaigns.length})</h3>
        </div>
        {campaigns.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No campaigns yet. Add one manually, or connect Meta and hit &quot;Sync Meta&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-2.5 font-medium">Campaign</th>
                  <th className="text-left px-4 py-2.5 font-medium">Platform</th>
                  <th className="text-left px-4 py-2.5 font-medium">Spent</th>
                  <th className="text-left px-4 py-2.5 font-medium">Leads</th>
                  <th className="text-left px-4 py-2.5 font-medium">CPL</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-5 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const m = c.metrics || {};
                  const leads = Number(m.leads || 0);
                  const spent = Number(c.spent || 0);
                  const cpl = leads > 0 ? Math.round(spent / leads) : 0;
                  return (
                    <tr key={c.id} className="border-t hover:bg-muted/30">
                      <td className="px-5 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3">{platformLabel[c.platform] || c.platform}</td>
                      <td className="px-4 py-3">{inr(spent)}</td>
                      <td className="px-4 py-3">{leads}</td>
                      <td className="px-4 py-3">{cpl ? inr(cpl) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          c.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>{c.status}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleMut.mutate({ id: c.id, status: c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' })}
                            className="p-1.5 hover:bg-accent rounded"
                            aria-label="Toggle status"
                          >
                            {c.status === 'ACTIVE' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          <button onClick={() => delMut.mutate(c.id)} className="p-1.5 hover:bg-accent rounded text-destructive" aria-label="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!summary.metaConnected && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
          <strong>Auto-sync not connected.</strong> To pull Meta ad spend automatically, set
          <code className="mx-1 font-mono">META_AD_ACCOUNT_ID</code> and a token with ads_read in the server .env.
          Google Ads and other costs can be tracked manually with &quot;Add Campaign / Cost&quot; above.
        </div>
      )}
    </div>
  );
}
