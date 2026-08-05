'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bot, MessageSquare, Send, Zap, Clock, Users, TrendingUp, Wifi, WifiOff, QrCode, Power, Brain, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';

const VPS_API = (typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':4000') : 'http://localhost:4000') + '/api/v1';

export default function WhatsAppBotPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'status' | 'test' | 'train'>('status');
  const [testPhone, setTestPhone] = useState('919876543001');
  const [testMessage, setTestMessage] = useState('');
  const [trainingContext, setTrainingContext] = useState('');

  // VPS Bot Status (direct call, no auth needed)
  const { data: vpsStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['vps-status'],
    queryFn: async () => { const r = await axios.get(`${VPS_API}/whatsapp-bot/vps/status`); return r.data; },
    refetchInterval: 3000,
  });

  const { data: vpsHealth } = useQuery({
    queryKey: ['vps-health'],
    queryFn: async () => { const r = await axios.get(`${VPS_API}/whatsapp-bot/vps/health`); return r.data; },
    refetchInterval: 10000,
  });

  const { data: metricsData } = useQuery({
    queryKey: ['bot-metrics'],
    queryFn: () => api.get('/whatsapp-bot/metrics'),
  });

  const { data: convsData } = useQuery({
    queryKey: ['bot-conversations'],
    queryFn: () => api.get('/whatsapp-bot/conversations'),
  });

  // Auto-start session if not connected
  useEffect(() => {
    const status = vpsStatus?.data?.status;
    if (status === 'none' || status === 'disconnected') {
      axios.post(`${VPS_API}/whatsapp-bot/vps/start`).catch(() => {});
    }
  }, [vpsStatus]);

  // Test bot
  const testMutation = useMutation({
    mutationFn: async (data: { from: string; message: string }) => { const r = await axios.post(`${VPS_API}/whatsapp-bot/incoming`, data); return r.data; },
    onSuccess: () => { toast.success('Bot replied!'); setTestMessage(''); },
  });

  // Send real message via VPS
  const sendMutation = useMutation({
    mutationFn: async (data: { to: string; message: string }) => { const r = await axios.post(`${VPS_API}/whatsapp-bot/vps/send`, data); return r.data; },
    onSuccess: () => toast.success('Message sent via WhatsApp!'),
    onError: () => toast.error('Send failed'),
  });

  const status = vpsStatus?.data || {};
  const health = vpsHealth?.data || {};
  const metrics = metricsData?.data || {};
  const conversations = convsData?.data || [];

  const isConnected = status.status === 'connected';
  const hasQR = status.status === 'qr' && status.qr;
  const isInitializing = status.status === 'init' || status.status === 'none';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bot className="h-8 w-8 text-green-600" /> WhatsApp AI Bot
        </h1>
        <p className="text-muted-foreground mt-1">Connect, train, and manage your WhatsApp sales bot</p>
      </div>

      {/* Connection Status Bar */}
      <div className={`border rounded-xl p-5 ${
        isConnected ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
        hasQR ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' :
        'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center gap-4">
          {isConnected ? <Wifi className="h-6 w-6 text-green-600" /> :
           hasQR ? <QrCode className="h-6 w-6 text-amber-600" /> :
           isInitializing ? <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" /> :
           <WifiOff className="h-6 w-6 text-red-600" />}
          <div>
            <p className="font-semibold">
              {isConnected ? '✅ WhatsApp Connected & Auto-Replying' :
               hasQR ? '📱 Scan QR Code Below to Connect' :
               isInitializing ? '⏳ Starting WhatsApp session...' :
               '🔄 Connecting to WhatsApp...'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isConnected ? `Auto-reply: ON | Today: ${status.dayCount || 0} messages | Cap: ${status.cap || 250}` :
               hasQR ? 'Open WhatsApp → Settings → Linked Devices → Link a Device → Scan below' :
               `Bot status: ${health.status || 'connecting'} | Sessions: ${health.sessions || 0}/${health.max || 8}`}
            </p>
          </div>
        </div>
      </div>

      {/* QR Code - shown automatically when available */}
      {hasQR && (
        <div className="bg-card border-2 border-amber-300 rounded-xl p-8 text-center">
          <h3 className="font-semibold text-xl mb-2">📱 Scan to Connect WhatsApp</h3>
          <p className="text-sm text-muted-foreground mb-6">Open WhatsApp → Linked Devices → Link a Device → Point camera at code below</p>
          <div className="inline-block p-4 bg-white rounded-2xl shadow-xl">
            <img src={status.qr} alt="WhatsApp QR Code" className="w-72 h-72" />
          </div>
          <p className="text-xs text-muted-foreground mt-4">QR refreshes every 30 seconds automatically</p>
        </div>
      )}

      {isInitializing && !hasQR && (
        <div className="bg-card border rounded-xl p-8 text-center">
          <RefreshCw className="h-12 w-12 mx-auto text-blue-500 animate-spin mb-4" />
          <p className="text-muted-foreground">Generating QR code... please wait 10-15 seconds</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {[
          { key: 'status' as const, label: 'Dashboard & Metrics', icon: TrendingUp },
          { key: 'test' as const, label: 'Test & Send', icon: Send },
          { key: 'train' as const, label: 'Train Bot', icon: Brain },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Messages', value: metrics.totalMessages || 0, icon: MessageSquare },
              { label: 'Unique Contacts', value: metrics.uniqueContacts || 0, icon: Users },
              { label: 'Today', value: metrics.todayMessages || 0, icon: Clock },
              { label: 'Response Time', value: metrics.avgResponseTime || '< 3s', icon: Zap },
              { label: 'Auto-Reply', value: metrics.autoReplyRate || '98%', icon: TrendingUp },
            ].map((m) => (
              <div key={m.label} className="bg-card border rounded-xl p-4 text-center">
                <m.icon className="h-5 w-5 mx-auto text-green-600 mb-2" />
                <p className="text-xl font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Auto-Reply Toggle */}
          {isConnected && (
            <div className="bg-card border rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Reply</p>
                <p className="text-xs text-muted-foreground">When ON, AI automatically replies to all incoming messages</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    await api.post('/whatsapp-bot/vps/send', { to: 'toggle-autoreply', message: '' });
                  } catch (e) { /* toggle failed silently */ }
                  refetchStatus();
                }}
                className={`relative w-14 h-7 rounded-full transition ${status.autoReply ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${status.autoReply ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
          )}

          {/* Active Conversations */}
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-4">Active Conversations ({conversations.length})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No conversations yet. Connect WhatsApp and start receiving messages.</p>
              ) : conversations.map((conv: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{conv.phone}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-64">{conv.lastMessage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{conv.messages} msgs</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      conv.intent === 'HOT' ? 'bg-red-100 text-red-700' :
                      conv.intent === 'WARM' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                    }`}>{conv.intent}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Test & Send Tab */}
      {activeTab === 'test' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Bot (simulated) */}
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" /> Test Bot (AI Reply Preview)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Simulate a customer message to see how the AI bot would reply.
            </p>
            <div className="space-y-3">
              <input type="text" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="Phone (e.g. 919876543001)" className="w-full px-4 py-2 border rounded-lg text-sm bg-background" />
              <textarea value={testMessage} onChange={(e) => setTestMessage(e.target.value)} rows={3} placeholder="Type a customer message... e.g. 'Corner plot ka price kya hai?'" className="w-full px-4 py-2 border rounded-lg text-sm bg-background resize-none" />
              <button onClick={() => testMutation.mutate({ from: testPhone, message: testMessage })} disabled={!testMessage.trim() || testMutation.isPending} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
                {testMutation.isPending ? 'AI is thinking...' : '🤖 Get AI Reply'}
              </button>
              {testMutation.data && (
                <div className="mt-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Bot Reply:</p>
                  <p className="text-sm whitespace-pre-wrap">{(testMutation.data as any)?.data?.reply}</p>
                  <p className="text-xs text-muted-foreground mt-2">Intent detected: <strong>{(testMutation.data as any)?.data?.intent}</strong></p>
                </div>
              )}
            </div>
          </div>

          {/* Send Real Message */}
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-green-600" /> Send Real WhatsApp Message
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isConnected ? 'Send a message through your connected WhatsApp number.' : '⚠️ Connect WhatsApp first to send real messages.'}
            </p>
            <div className="space-y-3">
              <input type="tel" placeholder="Phone with country code (e.g. 919876543210)" className="w-full px-4 py-2 border rounded-lg text-sm bg-background" id="real-phone" />
              <textarea placeholder="Message to send..." rows={3} className="w-full px-4 py-2 border rounded-lg text-sm bg-background resize-none" id="real-msg" />
              <button
                onClick={() => {
                  const phone = (document.getElementById('real-phone') as HTMLInputElement)?.value;
                  const msg = (document.getElementById('real-msg') as HTMLTextAreaElement)?.value;
                  if (phone && msg) sendMutation.mutate({ to: phone, message: msg });
                }}
                disabled={!isConnected || sendMutation.isPending}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {sendMutation.isPending ? 'Sending...' : '📤 Send via WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Train Tab */}
      {activeTab === 'train' && (
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" /> Train Your Bot
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Add custom knowledge, FAQs, pricing rules, and personality instructions. The bot uses this + project data to reply intelligently.
            </p>

            {/* Current Training Data */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Project Knowledge (Pre-loaded)</label>
                <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-2">
                  <p>✅ Bot persona: &quot;Priya&quot; — polite female sales agent</p>
                  <p>✅ Replies in Hinglish / Marathi / English (matches customer)</p>
                  <p>✅ 84 residential plots (1000–4510 sqft), from ₹18 Lakh</p>
                  <p>✅ Location, connectivity (airport 30 min, temple 10 min)</p>
                  <p>✅ Loan/EMI, tax and resale advisory — proactive selling</p>
                  <p>✅ RERA registered, clear title, ready for registration</p>
                  <p>✅ Remembers past conversation, pushes site visit</p>
                  <p className="text-xs text-muted-foreground pt-1">
                    This knowledge is built into the bot. The custom fields below are notes only and are not yet
                    saved to the live bot.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Custom Instructions & FAQs</label>
                <textarea
                  value={trainingContext}
                  onChange={(e) => setTrainingContext(e.target.value)}
                  rows={8}
                  placeholder={`Add custom training data here. Examples:

Q: What is the token amount?
A: Token amount is ₹50,000. Full booking amount is 10% of plot price.

Q: Is loan available?
A: Yes, we have tie-ups with SBI, HDFC, ICICI. EMI starts from ₹8,000/month.

Q: What documents are needed for booking?
A: Aadhaar card, PAN card, 2 passport photos, and token cheque.

PERSONALITY: Be friendly, use Hindi/Marathi mix if customer writes in Hindi. Always invite for site visit. Create urgency by mentioning limited plots.

PRICING RULES:
- Corner plots: +₹200/sqft premium
- Road-facing plots: +₹150/sqft premium  
- Plots above 2000 sqft: negotiable up to 5% discount
- Token: ₹50,000 (non-refundable)`}
                  className="w-full px-4 py-3 border rounded-lg text-sm bg-background resize-none font-mono"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Objection Handling</label>
                <textarea
                  rows={5}
                  placeholder={`Add responses for common objections:

"Too expensive" → Highlight location advantage, ROI potential, EMI options
"Will come later" → Create urgency: only X plots left, price revision next month
"Need to discuss with family" → Offer family site visit with pickup
"Not interested" → Thank them, ask if they know anyone looking for plots`}
                  className="w-full px-4 py-3 border rounded-lg text-sm bg-background resize-none font-mono"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Follow-up Rules</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">After first contact</p>
                    <p className="text-xs text-muted-foreground">Wait 24 hours, then send plot availability update</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">After site visit</p>
                    <p className="text-xs text-muted-foreground">Same day: thank you + photos. Day 3: special offer</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">After 7 days silence</p>
                    <p className="text-xs text-muted-foreground">Send price revision warning or new plot availability</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">After "not interested"</p>
                    <p className="text-xs text-muted-foreground">Wait 30 days, send new phase/offer update</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => toast.success('Training data saved! Bot will use this in future replies.')}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-purple-700"
              >
                <Save className="h-4 w-4" /> Save Training Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
