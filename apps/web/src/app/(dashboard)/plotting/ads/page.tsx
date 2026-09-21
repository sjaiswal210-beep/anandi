'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, IndianRupee, Target, MousePointerClick, TrendingUp, Plus, RefreshCw, Trash2, Pause, Play, Loader2, Image as ImageIcon } from 'lucide-react';
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
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [metaForm, setMetaForm] = useState<any>({
    name: '',
    adType: 'facebook',
    dailyBudget: '',
    imageUrl: '',
    caption:
      '🛵 FREE TVS Jupiter with every plot at Anandi Park, Bakori (Wagholi), Pune East! ' +
      'Open bungalow & commercial plots — clear titles, gated layout, Ring Road just 500m. ' +
      'Limited-period offer. Perfect for your dream home or investment. Enquire now for details.',
    headline: 'Free TVS Jupiter With Your Plot',
    link: 'https://anandipark.in',
    whatsappNumber: '918007107799',
    leadFormId: '',
    radiusKm: '30',
  });

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

  // Creates a real Meta lead-gen ad — ALWAYS created PAUSED on Meta.
  const createMetaMut = useMutation({
    mutationFn: () =>
      api.post('/ads/meta/create', {
        name: metaForm.name,
        adType: metaForm.adType,
        dailyBudget: Number(metaForm.dailyBudget) || 0,
        imageUrl: metaForm.imageUrl,
        caption: metaForm.caption,
        headline: metaForm.headline || undefined,
        link: metaForm.link || undefined,
        whatsappNumber: metaForm.adType === 'whatsapp' ? (metaForm.whatsappNumber || '').replace(/\D/g, '') : undefined,
        leadFormId: (metaForm.adType === 'facebook' || metaForm.adType === 'instagram') && metaForm.leadFormId?.trim() ? metaForm.leadFormId.trim() : undefined,
        radiusKm: Number(metaForm.radiusKm) || undefined,
      }),
    onSuccess: (res: any) => {
      const d = res?.data || res;
      if (d.ok) {
        toast.success('Meta campaign created — PAUSED. Review it, then Launch to start spending.');
        setShowMetaForm(false);
        setMetaForm({ name: '', dailyBudget: '', imageUrl: '', caption: '', headline: '', link: 'https://anandipark.in', radiusKm: '25' });
        qc.invalidateQueries({ queryKey: ['ads-campaigns'] });
        qc.invalidateQueries({ queryKey: ['ads-summary'] });
      } else {
        toast.error(`Meta: ${d.message || 'creation failed'}`);
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Meta create failed'),
  });

  // Launch/pause a REAL Meta campaign (hits the Marketing API), then reflect it
  // locally. Only used for campaigns that came from Meta (metadata.externalId).
  const metaStatusMut = useMutation({
    mutationFn: ({ externalId, status }: { externalId: string; status: 'ACTIVE' | 'PAUSED' }) =>
      api.post(`/ads/meta/${externalId}/status`, { status }),
    onSuccess: (res: any, vars) => {
      const d = res?.data || res;
      if (d.ok) {
        toast.success(vars.status === 'ACTIVE' ? 'Campaign launched on Meta' : 'Campaign paused on Meta');
        qc.invalidateQueries({ queryKey: ['ads-campaigns'] });
        qc.invalidateQueries({ queryKey: ['ads-summary'] });
      } else {
        toast.error(`Meta: ${d.message || 'status change failed'}`);
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Meta status failed'),
  });

  // Generates a logo'd ad creative via the social image pipeline and drops the
  // returned /uploads path into the Meta form's imageUrl.
  const genCreativeMut = useMutation({
    mutationFn: () =>
      api.post('/social-media/generate-image', {
        topic:
          metaForm.name ||
          'Anandi Park residential plots in Pune East for home buyers and investors',
        platform: metaForm.adType === 'instagram' ? 'INSTAGRAM' : 'FACEBOOK',
        headline: metaForm.headline || undefined,
        count: 1,
      }),
    onSuccess: (res: any) => {
      const d = res?.data || res;
      const url = d?.images?.[0]?.url;
      if (url) {
        setMetaForm((f: any) => ({ ...f, imageUrl: url }));
        toast.success('Creative generated (with Rich-Land logo)');
      } else {
        toast.error(d?.errors?.[0] || 'Could not generate creative');
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Creative generation failed'),
  });

  // Builds an absolute preview URL for a possibly-relative /uploads path.
  const previewUrl = (u: string) => {
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    const base = (api.defaults?.baseURL || '').replace(/\/api\/v1\/?$/, '');
    return base ? `${base}/${u.replace(/^\//, '')}` : u;
  };

  // Chooses the right toggle: real Meta call for Meta campaigns, local for manual.
  const toggleCampaign = (c: any) => {
    const externalId = c?.metadata?.externalId;
    const next = c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    if (c.platform === 'meta' && externalId) {
      metaStatusMut.mutate({ externalId, status: next });
    } else {
      toggleMut.mutate({ id: c.id, status: next });
    }
  };

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
            onClick={() => setShowMetaForm((s) => !s)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Target className="h-4 w-4" /> Create Meta Ad
          </button>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Add Campaign / Cost
          </button>
        </div>
      </div>

      {/* Create real Meta ad (created PAUSED) */}
      {showMetaForm && (
        <div className="bg-card border border-blue-200 dark:border-blue-900 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-blue-600" /> Create Meta Ad</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Creates a real campaign on Meta, <strong>always PAUSED</strong>. Nothing spends until you hit Launch (▶) in the table below.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <strong>Targeting:</strong> Pune (city + ~30 km around the project). Real-estate ads run under Meta&apos;s Housing
              category, which <strong>forbids age/gender/interest targeting</strong> — so we reach plot buyers &amp; investors through the
              creative &amp; copy, not filters. The image must resolve to a public https URL.
            </p>
          </div>
          {/* Ad type selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { k: 'facebook', label: 'Facebook Ad' },
              { k: 'instagram', label: 'Instagram Ad' },
              { k: 'whatsapp', label: 'WhatsApp (Click-to-Chat)' },
              { k: 'website', label: 'Website Traffic' },
            ].map((t) => (
              <button
                key={t.k}
                type="button"
                onClick={() => setMetaForm({ ...metaForm, adType: t.k })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  metaForm.adType === t.k ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-muted'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={metaForm.name} onChange={(e) => setMetaForm({ ...metaForm, name: e.target.value })} placeholder="Campaign name" className="px-3 py-2 border rounded-lg text-sm bg-background md:col-span-2" />
            {metaForm.adType === 'whatsapp' && (
              <input value={metaForm.whatsappNumber} onChange={(e) => setMetaForm({ ...metaForm, whatsappNumber: e.target.value })} placeholder="WhatsApp number (digits, e.g. 918007107799)" className="px-3 py-2 border rounded-lg text-sm bg-background md:col-span-2" />
            )}
            <input type="number" value={metaForm.dailyBudget} onChange={(e) => setMetaForm({ ...metaForm, dailyBudget: e.target.value })} placeholder="Daily budget ₹ (e.g. 500)" className="px-3 py-2 border rounded-lg text-sm bg-background" />
            <input type="number" value={metaForm.radiusKm} onChange={(e) => setMetaForm({ ...metaForm, radiusKm: e.target.value })} placeholder="Pune radius km (24–80)" className="px-3 py-2 border rounded-lg text-sm bg-background" />
            <div className="md:col-span-2 flex gap-2">
              <input value={metaForm.imageUrl} onChange={(e) => setMetaForm({ ...metaForm, imageUrl: e.target.value })} placeholder="Image URL (https://…), use uploaded ad, or generate →" className="flex-1 px-3 py-2 border rounded-lg text-sm bg-background" />
              <button
                type="button"
                onClick={() => setMetaForm({ ...metaForm, imageUrl: '/uploads/ads/anandi-park-ad.jpg' })}
                className="shrink-0 flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-muted"
                title="Use the uploaded Anandi Park ad creative (Ad.jpg)"
              >
                <ImageIcon className="h-4 w-4" /> Use uploaded ad
              </button>
              <button
                type="button"
                onClick={() => genCreativeMut.mutate()}
                disabled={genCreativeMut.isPending}
                className="shrink-0 flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50"
                title="Generate a logo'd ad creative with AI"
              >
                {genCreativeMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                Generate
              </button>
            </div>
            {(metaForm.adType === 'facebook' || metaForm.adType === 'instagram') && (
              <input value={metaForm.leadFormId} onChange={(e) => setMetaForm({ ...metaForm, leadFormId: e.target.value })} placeholder="Meta lead form ID (optional — native in-app form; needs leads_retrieval)" className="px-3 py-2 border rounded-lg text-sm bg-background md:col-span-2" />
            )}
            {metaForm.imageUrl && (
              <div className="md:col-span-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl(metaForm.imageUrl)} alt="Ad creative preview" className="h-40 rounded-lg border object-contain bg-muted/30" />
              </div>
            )}
            <input value={metaForm.headline} onChange={(e) => setMetaForm({ ...metaForm, headline: e.target.value })} placeholder="Headline (optional)" className="px-3 py-2 border rounded-lg text-sm bg-background" />
            <input value={metaForm.link} onChange={(e) => setMetaForm({ ...metaForm, link: e.target.value })} placeholder="Landing URL" className="px-3 py-2 border rounded-lg text-sm bg-background" />
            <textarea value={metaForm.caption} onChange={(e) => setMetaForm({ ...metaForm, caption: e.target.value })} placeholder="Ad caption / primary text" rows={3} className="px-3 py-2 border rounded-lg text-sm bg-background md:col-span-2" />
          </div>
          <button
            onClick={() => createMetaMut.mutate()}
            disabled={!metaForm.name.trim() || !metaForm.imageUrl.trim() || !metaForm.caption.trim() || !metaForm.dailyBudget || createMetaMut.isPending}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {createMetaMut.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : 'Create (Paused)'}
          </button>
        </div>
      )}

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
                            onClick={() => toggleCampaign(c)}
                            disabled={metaStatusMut.isPending}
                            className="p-1.5 hover:bg-accent rounded disabled:opacity-50"
                            aria-label={c.status === 'ACTIVE' ? 'Pause campaign' : 'Launch campaign'}
                            title={c.platform === 'meta' && c?.metadata?.externalId
                              ? (c.status === 'ACTIVE' ? 'Pause on Meta' : 'Launch on Meta (starts spending)')
                              : 'Toggle status'}
                          >
                            {c.status === 'ACTIVE' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 text-green-600" />}
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
          <strong>Meta auto-sync not connected.</strong> To create ads and pull spend automatically, set
          <code className="mx-1 font-mono">META_AD_ACCOUNT_ID</code> and a token with ads_management in the server .env.
        </div>
      )}

      {/* Platform automation status */}
      <div className="bg-card border rounded-xl p-5 text-sm">
        <h3 className="font-semibold mb-3">What can be launched from here</h3>
        <ul className="space-y-1.5 text-muted-foreground">
          <li>✅ <strong className="text-foreground">Facebook ads</strong> — created &amp; launched via &quot;Create Meta Ad&quot; (Facebook placement).</li>
          <li>✅ <strong className="text-foreground">Instagram ads</strong> — same flow, Instagram placement.</li>
          <li>✅ <strong className="text-foreground">WhatsApp ads</strong> — Click-to-WhatsApp ads that open a chat with the business number.</li>
          <li>✅ <strong className="text-foreground">Website traffic ads</strong> — drive Pune visitors to anandipark.in.</li>
          <li>⏳ <strong className="text-foreground">Google Ads</strong> — <em>manual only for now.</em> The Google Ads API needs a developer token that takes weeks of Google approval. Track Google spend with &quot;Add Campaign / Cost&quot; until then.</li>
        </ul>
        <p className="mt-3 text-xs">All Meta ads are created <strong>PAUSED</strong> and target <strong>Pune</strong>. Hit ▶ to launch. Housing rules mean audience is geo + creative, not interest filters.</p>
      </div>
    </div>
  );
}
