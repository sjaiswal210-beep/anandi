'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, PhoneCall, Users, Clock, TrendingUp, Play, List, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const SCRIPTS = [
  { id: 'hindi', label: 'Hindi Pitch', url: 'https://raw.githubusercontent.com/sjaiswal210-beep/anandi/main/uploads/tts/answer-hindi.xml' },
  { id: 'marathi', label: 'Marathi Pitch', url: 'https://raw.githubusercontent.com/sjaiswal210-beep/anandi/main/uploads/tts/answer-marathi.xml' },
  { id: 'english', label: 'English Pitch', url: 'https://raw.githubusercontent.com/sjaiswal210-beep/anandi/main/uploads/tts/answer-english.xml' },
];

export default function CallingPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'single' | 'bulk' | 'blast'>('blast');
  const [singlePhone, setSinglePhone] = useState('');
  const [bulkNumbers, setBulkNumbers] = useState('');
  const [selectedScript, setSelectedScript] = useState(SCRIPTS[0].url);
  const [blastTag, setBlastTag] = useState('scraped');
  const [blastLimit, setBlastLimit] = useState(10);

  // Custom text-to-speech script
  const [useCustom, setUseCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customLang, setCustomLang] = useState('hi-IN');

  const { data: metricsData } = useQuery({
    queryKey: ['call-metrics'],
    queryFn: () => api.get('/ai-calling/metrics'),
  });

  const { data: recordsData, isLoading: recordsLoading } = useQuery({
    queryKey: ['call-records'],
    queryFn: () => api.get('/ai-calling/records'),
    refetchInterval: 10000,
  });

  const scriptPayload = () =>
    useCustom && customText.trim()
      ? { text: customText.trim(), language: customLang }
      : { script: selectedScript };

  const callSingle = useMutation({
    mutationFn: () => api.post('/ai-calling/call', { phone: singlePhone, ...scriptPayload() }),
    onSuccess: () => { toast.success('Call placed!'); queryClient.invalidateQueries({ queryKey: ['call-records', 'call-metrics'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Call failed'),
  });

  const callBulk = useMutation({
    mutationFn: () => {
      const numbers = bulkNumbers.split(/[\n,;]+/).map((n) => n.trim()).filter((n) => n.length >= 10);
      return api.post('/ai-calling/call-numbers', { numbers, ...scriptPayload() });
    },
    onSuccess: (res: any) => {
      const d = res?.data || res;
      toast.success(`${d.placed || 0} calls placed, ${d.failed || 0} failed`);
      queryClient.invalidateQueries({ queryKey: ['call-records', 'call-metrics'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Bulk call failed'),
  });

  const callBlast = useMutation({
    mutationFn: () => api.post('/ai-calling/blast', { ...scriptPayload(), tag: blastTag, limit: blastLimit }),
    onSuccess: (res: any) => {
      const d = res?.data || res;
      toast.success(`Blast: ${d.placed || 0} calls placed to ${d.called || 0} leads`);
      queryClient.invalidateQueries({ queryKey: ['call-records', 'call-metrics'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Blast failed'),
  });

  const metrics: any = (metricsData as any)?.data || {};
  const records: any[] = (recordsData as any)?.data?.data || [];

  const isPending = callSingle.isPending || callBulk.isPending || callBlast.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Phone className="h-8 w-8 text-orange-600" /> Voice Calling
        </h1>
        <p className="text-muted-foreground mt-1">
          TTS outbound calls to your leads — plays your recorded pitch and captures responses
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Calls', value: metrics.total || 0, icon: Phone },
          { label: 'Completed', value: metrics.completed || 0, icon: TrendingUp },
          { label: 'Connected', value: metrics.connected || 0, icon: Users },
          { label: 'Connect Rate', value: metrics.connectionRate || '0%', icon: TrendingUp },
          { label: 'Avg Duration', value: metrics.avgDuration || '0s', icon: Clock },
        ].map((m) => (
          <div key={m.label} className="bg-card border rounded-xl p-4 text-center">
            <m.icon className="h-5 w-5 mx-auto text-orange-600 mb-2" />
            <p className="text-xl font-bold">{m.value}</p>
            <p className="text-xs text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Panel */}
        <div className="lg:col-span-2 space-y-5">
          {/* Script Selection */}
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Play className="h-4 w-4 text-orange-600" /> Voice Script
              </h3>
              <div className="flex rounded-lg border p-0.5 text-xs">
                <button
                  onClick={() => setUseCustom(false)}
                  className={`px-3 py-1.5 rounded-md font-medium ${!useCustom ? 'bg-orange-600 text-white' : ''}`}
                >
                  Ready scripts
                </button>
                <button
                  onClick={() => setUseCustom(true)}
                  className={`px-3 py-1.5 rounded-md font-medium ${useCustom ? 'bg-orange-600 text-white' : ''}`}
                >
                  Custom text
                </button>
              </div>
            </div>

            {!useCustom ? (
              <>
                <div className="flex flex-wrap gap-3">
                  {SCRIPTS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedScript(s.url)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        selectedScript === s.url
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Pre-recorded audio plays when the lead picks up.
                </p>
              </>
            ) : (
              <>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={4}
                  maxLength={900}
                  placeholder="Type the message to be spoken on the call, e.g. Namaste, Anandi Park mein residential plots uplabdha hain, sirf 18 lakh se shuru. Site visit ke liye 1 dabaiye."
                  className="w-full px-4 py-3 border rounded-lg text-sm bg-background"
                />
                <div className="flex items-center justify-between mt-2">
                  <select
                    value={customLang}
                    onChange={(e) => setCustomLang(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm bg-background"
                  >
                    <option value="hi-IN">Hindi voice</option>
                    <option value="mr-IN">Marathi voice</option>
                    <option value="en-IN">English voice</option>
                  </select>
                  <span className="text-xs text-muted-foreground">{customText.length}/900</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Your text is read aloud by a voice on the call. No recording needed.
                </p>
              </>
            )}
          </div>

          {/* Tab selection */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {[
              { id: 'blast', label: 'Blast All Leads', icon: Users },
              { id: 'bulk', label: 'Custom Numbers', icon: List },
              { id: 'single', label: 'Single Call', icon: PhoneCall },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

          {/* Blast tab */}
          {tab === 'blast' && (
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold">Call All Leads</h3>
              <p className="text-sm text-muted-foreground">
                Calls all leads matching the tag filter. Skips leads marked WON or LOST.
                Calls are placed 1.5 seconds apart.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tag filter</label>
                  <input
                    type="text"
                    value={blastTag}
                    onChange={(e) => setBlastTag(e.target.value)}
                    placeholder="scraped"
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-background"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Max calls</label>
                  <input
                    type="number"
                    value={blastLimit}
                    onChange={(e) => setBlastLimit(Number(e.target.value))}
                    min={1}
                    max={100}
                    className="w-full px-4 py-2 border rounded-lg text-sm bg-background"
                  />
                </div>
              </div>
              <button
                onClick={() => callBlast.mutate()}
                disabled={isPending}
                className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {callBlast.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                {callBlast.isPending ? 'Placing calls...' : `Call up to ${blastLimit} leads`}
              </button>
            </div>
          )}

          {/* Bulk tab */}
          {tab === 'bulk' && (
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold">Call Custom Numbers</h3>
              <p className="text-sm text-muted-foreground">
                Paste phone numbers — one per line, or comma/semicolon separated.
              </p>
              <textarea
                value={bulkNumbers}
                onChange={(e) => setBulkNumbers(e.target.value)}
                rows={6}
                placeholder={"9876543210\n9123456789\n8765432100"}
                className="w-full px-4 py-3 border rounded-lg text-sm bg-background font-mono"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {bulkNumbers.split(/[\n,;]+/).filter((n) => n.trim().length >= 10).length} valid numbers
                </span>
                <button
                  onClick={() => callBulk.mutate()}
                  disabled={isPending || !bulkNumbers.trim()}
                  className="px-6 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {callBulk.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <List className="h-4 w-4" />}
                  {callBulk.isPending ? 'Calling...' : 'Call All'}
                </button>
              </div>
            </div>
          )}

          {/* Single tab */}
          {tab === 'single' && (
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold">Call One Number</h3>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  value={singlePhone}
                  onChange={(e) => setSinglePhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-4 py-2 border rounded-lg text-sm bg-background"
                />
              </div>
              <button
                onClick={() => callSingle.mutate()}
                disabled={isPending || singlePhone.length < 10}
                className="w-full py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {callSingle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneCall className="h-4 w-4" />}
                {callSingle.isPending ? 'Calling...' : 'Place Call'}
              </button>
            </div>
          )}
        </div>

        {/* Call History */}
        <div className="space-y-5">
          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Call History
            </h3>
            {recordsLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
            ) : records.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No calls yet</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {records.map((call: any) => (
                  <div key={call.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{call.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {call.duration ? `${call.duration}s` : '-'} • {call.intentDetected || 'pending'}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        call.status === 'completed' ? 'bg-green-100 text-green-700' :
                        call.status === 'connected' ? 'bg-blue-100 text-blue-700' :
                        call.status === 'initiated' ? 'bg-amber-100 text-amber-700' :
                        call.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{call.status}</span>
                    </div>
                    {call.nextAction === 'schedule_visit' && (
                      <p className="text-xs text-green-600 mt-1 font-medium">✅ Wants site visit</p>
                    )}
                    {call.transcript && (
                      <p className="text-xs text-muted-foreground mt-1 truncate" title={call.transcript}>
                        {call.transcript}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
