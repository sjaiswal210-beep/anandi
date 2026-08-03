'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Map, Users, Phone, MessageSquare, TrendingUp, BarChart3, Bot, Megaphone, Target } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function PlottingOverviewPage() {
  const { data: botMetrics } = useQuery({
    queryKey: ['whatsapp-bot-metrics'],
    queryFn: () => api.get('/whatsapp-bot/metrics'),
  });

  const { data: sourceData } = useQuery({
    queryKey: ['lead-source-breakdown'],
    queryFn: () => api.get('/lead-ingestion/source-breakdown'),
  });

  const metrics = botMetrics?.data || {};
  const sources = sourceData?.data || [];

  const cards = [
    { title: 'Plot Inventory', desc: 'Visual plot map with booking status', href: '/plotting/inventory', icon: Map, color: 'from-emerald-500 to-emerald-600', stat: '40 plots' },
    { title: 'WhatsApp AI Bot', desc: 'Auto-replies, follow-ups, sales', href: '/plotting/whatsapp-bot', icon: MessageSquare, color: 'from-green-500 to-green-600', stat: `${metrics.totalMessages || 0} messages` },
    { title: 'Social Media', desc: 'AI content generator + scheduling', href: '/plotting/social', icon: Megaphone, color: 'from-pink-500 to-pink-600', stat: 'Generate posts' },
    { title: 'Customer Data', desc: 'Import, broadcast, convert', href: '/plotting/customers', icon: Users, color: 'from-blue-500 to-blue-600', stat: 'Import CSV' },
    { title: 'AI Calling', desc: 'Humanized voice calls to leads', href: '/plotting/calling', icon: Phone, color: 'from-orange-500 to-orange-600', stat: 'Call campaigns' },
    { title: 'Ads Network', desc: 'Google, Meta, WhatsApp ads', href: '/marketing', icon: TrendingUp, color: 'from-purple-500 to-purple-600', stat: 'Manage campaigns' },
    { title: 'Lead Scraper', desc: 'Find interested buyers from web', href: '/plotting/scraper', icon: Target, color: 'from-red-500 to-red-600', stat: 'Scrape leads' },
    { title: 'Unified Leads', desc: 'All sources in one view', href: '/leads', icon: BarChart3, color: 'from-cyan-500 to-cyan-600', stat: `${sources.length || 0} sources` },
    { title: 'AI Agents', desc: '10 agents working 24/7', href: '/ai-agents', icon: Bot, color: 'from-indigo-500 to-indigo-600', stat: 'Chat with agents' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Plotting Project Growth Platform</h1>
        <p className="text-muted-foreground mt-1">End-to-end automation for your land plotting project</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => (
          <Link key={card.title} href={card.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border rounded-xl p-5 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold group-hover:text-primary transition">{card.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
              <p className="text-xs font-medium text-primary mt-3">{card.stat}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Source breakdown */}
      {sources.length > 0 && (
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4">Lead Sources</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sources.map((s: any) => (
              <div key={s.source} className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{s._count}</p>
                <p className="text-xs text-muted-foreground">{s.source?.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
