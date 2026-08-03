'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bot, MessageSquare, Send, Zap, Clock, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function WhatsAppBotPage() {
  const [testPhone, setTestPhone] = useState('919876543001');
  const [testMessage, setTestMessage] = useState('');

  const { data: metricsData } = useQuery({
    queryKey: ['bot-metrics'],
    queryFn: () => api.get('/whatsapp-bot/metrics'),
  });

  const { data: convsData } = useQuery({
    queryKey: ['bot-conversations'],
    queryFn: () => api.get('/whatsapp-bot/conversations'),
  });

  const testMutation = useMutation({
    mutationFn: (data: { from: string; message: string }) =>
      api.post('/whatsapp-bot/incoming', data),
    onSuccess: (res: any) => {
      toast.success('Bot replied!');
      setTestMessage('');
    },
  });

  const metrics = metricsData?.data || {};
  const conversations = convsData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bot className="h-8 w-8 text-green-600" /> WhatsApp AI Bot
        </h1>
        <p className="text-muted-foreground mt-1">Fully automated sales bot — handles all conversations 24/7</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Messages', value: metrics.totalMessages || 0, icon: MessageSquare },
          { label: 'Unique Contacts', value: metrics.uniqueContacts || 0, icon: Users },
          { label: 'Today', value: metrics.todayMessages || 0, icon: Clock },
          { label: 'Response Time', value: metrics.avgResponseTime || '< 3s', icon: Zap },
          { label: 'Auto-Reply Rate', value: metrics.autoReplyRate || '98%', icon: TrendingUp },
        ].map((m) => (
          <div key={m.label} className="bg-card border rounded-xl p-4 text-center">
            <m.icon className="h-5 w-5 mx-auto text-green-600 mb-2" />
            <p className="text-xl font-bold">{m.value}</p>
            <p className="text-xs text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Bot */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" /> Test Bot
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Simulate an incoming WhatsApp message to test AI responses.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full px-4 py-2 border rounded-lg text-sm bg-background"
            />
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              placeholder="Type a customer message... e.g. 'I want to buy a plot, what is the price?'"
              className="w-full px-4 py-2 border rounded-lg text-sm bg-background resize-none"
            />
            <button
              onClick={() => testMutation.mutate({ from: testPhone, message: testMessage })}
              disabled={!testMessage.trim() || testMutation.isPending}
              className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {testMutation.isPending ? 'Bot is replying...' : 'Send as Customer'}
            </button>
            {testMutation.data && (
              <div className="mt-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Bot Reply:</p>
                <p className="text-sm">{(testMutation.data as any)?.data?.reply}</p>
                <p className="text-xs text-muted-foreground mt-2">Intent: {(testMutation.data as any)?.data?.intent}</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Conversations */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Active Conversations</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p>
            ) : conversations.map((conv: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{conv.phone}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-48">{conv.lastMessage}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{conv.messages} msgs</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    conv.intent === 'HOT' ? 'bg-red-100 text-red-700' :
                    conv.intent === 'WARM' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{conv.intent}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
