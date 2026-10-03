'use client';

import { useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Upload, Users, Megaphone, Play, Pause, RotateCcw, Image as ImageIcon,
  FileText, Clock, AlertTriangle, CheckCircle2, Info,
} from 'lucide-react';
import api from '@/lib/api';

interface ParsedLead {
  name: string;
  phone: string;
  email?: string;
}

interface DripStatus {
  id: string;
  name: string;
  status: string;
  sentCount: number;
  targetCount: number;
  pendingInWorkspace: number;
  totalSentInWorkspace: number;
  sentToday: number;
  dailyCap: number;
  estimatedDaysRemaining: number;
  businessHours: { startHour: number; endHour: number };
  lastTickAt: string | null;
  lastError: string | null;
  media: { imageUrl: string | null; documentUrl: string | null };
}

/** Parses pasted/uploaded CSV into {name, phone, email} records. */
function parseCsv(text: string): ParsedLead[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect a header row (contains "phone"/"name"/"mobile").
  const header = lines[0].toLowerCase();
  const hasHeader = /phone|mobile|name|email/.test(header);
  const cols = hasHeader ? header.split(/[,;\t]/).map((c) => c.trim()) : [];
  const idx = {
    name: cols.findIndex((c) => c.includes('name')),
    phone: cols.findIndex((c) => c.includes('phone') || c.includes('mobile') || c.includes('number')),
    email: cols.findIndex((c) => c.includes('email')),
  };

  const rows = hasHeader ? lines.slice(1) : lines;
  const out: ParsedLead[] = [];
  for (const row of rows) {
    const parts = row.split(/[,;\t]/).map((p) => p.trim());
    let name = '';
    let phone = '';
    let email = '';
    if (hasHeader) {
      name = idx.name >= 0 ? parts[idx.name] || '' : '';
      phone = idx.phone >= 0 ? parts[idx.phone] || '' : '';
      email = idx.email >= 0 ? parts[idx.email] || '' : '';
    } else {
      // No header: assume [name, phone, email] or [phone] only.
      if (parts.length === 1) {
        phone = parts[0];
      } else {
        name = parts[0];
        phone = parts[1] || '';
        email = parts[2] || '';
      }
    }
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length >= 10) {
      out.push({ name: name || 'Customer', phone: digits, email: email || undefined });
    }
  }
  return out;
}

export default function BulkSenderPanel() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  // --- CSV import state ---
  const [csvText, setCsvText] = useState('');
  const parsed = useMemo(() => parseCsv(csvText), [csvText]);

  // --- Campaign config state ---
  const [name, setName] = useState('Anandi Park broadcast');
  const [message, setMessage] = useState(
    'Namaste {{name}}! 🏡\n\nAnandi Park NA bungalow plots — limited period offer: *FREE TVS Jupiter* on booking! 🛵\n\nSite visit book karnyासाठी reply kara.',
  );
  const [imageUrl, setImageUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [dailyCap, setDailyCap] = useState(30);
  const [batchSize, setBatchSize] = useState(8);
  const [minDelaySec, setMinDelaySec] = useState(25);
  const [maxDelaySec, setMaxDelaySec] = useState(75);
  const [startHour, setStartHour] = useState(10);
  const [endHour, setEndHour] = useState(19);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // --- Imported customers count ---
  const { data: customersData } = useQuery({
    queryKey: ['customer-data-count'],
    queryFn: () => api.get('/customer-data', { params: { page: 1 } }),
    refetchInterval: 10000,
  });
  const totalCustomers = (customersData as any)?.data?.meta?.total ?? 0;

  // --- Live drip status ---
  // The API wraps every response as { success, data, timestamp }, so the real
  // payload lives under `.data`.
  const { data: statusRes } = useQuery({
    queryKey: ['drip-status', campaignId],
    queryFn: () => api.get(`/customer-data/drip/${campaignId}/status`),
    enabled: !!campaignId,
    refetchInterval: 8000,
  });
  const status: DripStatus | null = (statusRes as any)?.data ?? null;

  const importMutation = useMutation({
    mutationFn: (records: ParsedLead[]) => api.post('/customer-data/import', { records }),
    onSuccess: (res: any) => {
      const r = res?.data ?? res;
      toast.success(`Imported ${r?.imported ?? 0} leads (${r?.duplicates ?? 0} duplicates skipped)`);
      setCsvText('');
      queryClient.invalidateQueries({ queryKey: ['customer-data-count'] });
    },
    onError: () => toast.error('Import failed'),
  });

  const startMutation = useMutation({
    mutationFn: () =>
      api.post('/customer-data/drip/start', {
        name,
        message,
        imageUrl: imageUrl || undefined,
        documentUrl: documentUrl || undefined,
        dailyCap,
        batchSize,
        minDelaySec,
        maxDelaySec,
        startHour,
        endHour,
      }),
    onSuccess: (res: any) => {
      const r = res?.data ?? res;
      setCampaignId(r?.id || null);
      toast.success('Drip campaign started — messages will send slowly during business hours.');
      queryClient.invalidateQueries({ queryKey: ['drip-status'] });
    },
    onError: () => toast.error('Could not start campaign'),
  });

  const pauseMutation = useMutation({
    mutationFn: () => api.post(`/customer-data/drip/${campaignId}/pause`, {}),
    onSuccess: () => {
      toast.success('Campaign paused');
      queryClient.invalidateQueries({ queryKey: ['drip-status', campaignId] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => api.post(`/customer-data/drip/${campaignId}/resume`, {}),
    onSuccess: () => {
      toast.success('Campaign resumed');
      queryClient.invalidateQueries({ queryKey: ['drip-status', campaignId] });
    },
  });

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const pct = status && status.targetCount > 0
    ? Math.min(100, Math.round((status.totalSentInWorkspace / (status.totalSentInWorkspace + status.pendingInWorkspace || 1)) * 100))
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Ban-risk notice */}
      <div className="lg:col-span-2 flex items-start gap-3 p-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Sends are throttled on purpose to protect the number.</p>
          <p className="text-xs mt-0.5 opacity-90">
            These are cold contacts, so WhatsApp can ban bulk sends. Messages go out in small randomized
            batches during business hours up to your daily cap, so 3000 leads spread over several weeks.
            Start with a low cap and raise it only if there are no failures. Photo + PDF are sent as links
            (the bridge has no media upload).
          </p>
        </div>
      </div>

      {/* --- Step 1: Import leads --- */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4" /> 1. Import leads (CSV)</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-muted flex items-center gap-1">
            <Users className="h-3 w-3" /> {totalCustomers} in list
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste CSV or upload a file. Columns: <code>name, phone, email</code> (header optional).
          Duplicates by phone are skipped automatically.
        </p>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          rows={6}
          placeholder={'name,phone,email\nRahul,9876543210,rahul@mail.com\nSneha,9823012345,'}
          className="w-full rounded-lg border bg-background p-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#008069]"
        />
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-muted transition"
          >
            Choose file
          </button>
          <span className="text-xs text-muted-foreground">{parsed.length} valid rows detected</span>
          <button
            onClick={() => importMutation.mutate(parsed)}
            disabled={parsed.length === 0 || importMutation.isPending}
            className="ml-auto px-4 py-1.5 text-sm rounded-lg bg-[#008069] text-white hover:bg-[#006e5a] transition disabled:opacity-50"
          >
            {importMutation.isPending ? 'Importing…' : `Import ${parsed.length}`}
          </button>
        </div>
      </div>

      {/* --- Step 2: Configure message --- */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Megaphone className="h-4 w-4" /> 2. Message & media</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Campaign name"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008069]"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full rounded-lg border bg-background p-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008069]"
        />
        <p className="text-xs text-muted-foreground -mt-1">
          Use <code>{'{{name}}'}</code> to personalize. <code>*text*</code> is bold on WhatsApp.
        </p>
        <div className="relative">
          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Photo URL (https://anandipark.in/uploads/photo.jpg)"
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008069]"
          />
        </div>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
            placeholder="Brochure PDF URL (https://anandipark.in/uploads/brochure.pdf)"
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#008069]"
          />
        </div>
      </div>

      {/* --- Step 3: Throttle settings --- */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> 3. Throttle (ban-safe)</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-muted-foreground text-xs">Daily cap</span>
            <input type="number" min={1} max={200} value={dailyCap} onChange={(e) => setDailyCap(+e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#008069]" />
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground text-xs">Batch / hour</span>
            <input type="number" min={1} max={30} value={batchSize} onChange={(e) => setBatchSize(+e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#008069]" />
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground text-xs">Min gap (sec)</span>
            <input type="number" min={5} value={minDelaySec} onChange={(e) => setMinDelaySec(+e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#008069]" />
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground text-xs">Max gap (sec)</span>
            <input type="number" min={5} value={maxDelaySec} onChange={(e) => setMaxDelaySec(+e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#008069]" />
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground text-xs">Start hour (IST)</span>
            <input type="number" min={0} max={23} value={startHour} onChange={(e) => setStartHour(+e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#008069]" />
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground text-xs">End hour (IST)</span>
            <input type="number" min={1} max={24} value={endHour} onChange={(e) => setEndHour(+e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-[#008069]" />
          </label>
        </div>
        <button
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending || !message.trim()}
          className="w-full px-4 py-2.5 rounded-lg bg-[#008069] text-white font-medium hover:bg-[#006e5a] transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Play className="h-4 w-4" /> {startMutation.isPending ? 'Starting…' : 'Start drip campaign'}
        </button>
      </div>

      {/* --- Step 4: Live status --- */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Info className="h-4 w-4" /> 4. Progress</h3>
        {!status ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Start a campaign to see live progress here.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{status.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                status.status === 'sending' ? 'bg-green-100 text-green-700' :
                status.status === 'paused' ? 'bg-amber-100 text-amber-700' :
                status.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-muted'
              }`}>{status.status}</span>
            </div>

            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-[#25D366] transition-all" style={{ width: `${pct}%` }} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Sent today" value={`${status.sentToday} / ${status.dailyCap}`} />
              <Stat label="Total sent" value={status.totalSentInWorkspace} />
              <Stat label="Pending" value={status.pendingInWorkspace} />
              <Stat label="ETA" value={`~${status.estimatedDaysRemaining} days`} />
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Sends {status.businessHours.startHour}:00–{status.businessHours.endHour}:00 IST.
              {status.lastTickAt && ` Last run ${new Date(status.lastTickAt).toLocaleString('en-IN')}.`}
            </p>

            {status.lastError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Last error: {status.lastError}
              </p>
            )}
            {status.status === 'completed' && (
              <p className="text-xs text-green-700 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> All leads messaged.
              </p>
            )}

            <div className="flex gap-2 pt-1">
              {status.status === 'sending' ? (
                <button onClick={() => pauseMutation.mutate()}
                  className="flex-1 px-3 py-2 rounded-lg border text-sm hover:bg-muted transition flex items-center justify-center gap-1">
                  <Pause className="h-4 w-4" /> Pause
                </button>
              ) : status.status === 'paused' ? (
                <button onClick={() => resumeMutation.mutate()}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#008069] text-white text-sm hover:bg-[#006e5a] transition flex items-center justify-center gap-1">
                  <RotateCcw className="h-4 w-4" /> Resume
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
