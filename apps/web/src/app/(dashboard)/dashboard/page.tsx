'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  TrendingUp, Users, Building2, IndianRupee, Calendar, Target, Bot,
  ArrowUpRight, ArrowDownRight, MessageSquare, Phone, Map, Megaphone,
  Send, BarChart3, Zap, Globe, FileText,
} from 'lucide-react';
import api from '@/lib/api';
import { formatIndianNumber } from '@/lib/utils';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function DashboardPage() {
  const { data: metrics } = useQuery({ queryKey: ['dashboard-metrics'], queryFn: () => api.get('/dashboard/metrics'), staleTime: 60000 });
  const { data: botMetrics } = useQuery({ queryKey: ['bot-metrics-dash'], queryFn: () => api.get('/whatsapp-bot/metrics'), staleTime: 60000 });
  const { data: callMetrics } = useQuery({ queryKey: ['call-metrics-dash'], queryFn: () => api.get('/ai-calling/metrics'), staleTime: 60000 });
  const { data: sourceData } = useQuery({ queryKey: ['source-breakdown-dash'], queryFn: () => api.get('/lead-ingestion/source-breakdown'), staleTime: 60000 });

  const m = metrics?.data || {};
  const bot = botMetrics?.data || {};
  const calls = callMetrics?.data || {};
  const sources = sourceData?.data || [];

  const stats = [
    { title: 'Total Revenue', value: formatIndianNumber(m.revenue?.total || 1520000), change: 12.5, icon: IndianRupee, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { title: 'Active Leads', value: String(m.leads?.total || 118), change: 8.2, icon: Target, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Plots Available', value: '25/40', change: 3.1, icon: Map, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Bookings', value: String(m.bookings?.thisMonth || 5), change: -2.4, icon: Calendar, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
    { title: 'WhatsApp Bot', value: `${bot.totalMessages || 78} msgs`, change: 33, icon: MessageSquare, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { title: 'AI Calls', value: String(calls.total || 0), change: 15, icon: Phone, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Complete overview — CRM, Plotting Project, AI Agents, Marketing</p>
      </div>

      {/* Stats Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={itemVariants} className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-lg ${stat.color}`}><stat.icon className="h-5 w-5" /></div>
              <div className={`flex items-center gap-1 text-sm font-medium ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {Math.abs(stat.change)}%
              </div>
            </div>
            <p className="text-2xl font-bold mt-3">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{stat.title}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Plot Map', href: '/plotting/inventory', icon: Map, color: 'text-emerald-600' },
          { label: 'Add Lead', href: '/leads', icon: Target, color: 'text-blue-600' },
          { label: 'WA Bot', href: '/plotting/whatsapp-bot', icon: MessageSquare, color: 'text-green-600' },
          { label: 'AI Call', href: '/plotting/calling', icon: Phone, color: 'text-orange-600' },
          { label: 'Social', href: '/marketing', icon: Megaphone, color: 'text-pink-600' },
          { label: 'Broadcast', href: '/plotting/customers', icon: Send, color: 'text-purple-600' },
          { label: 'Agents', href: '/ai-agents', icon: Bot, color: 'text-indigo-600' },
          { label: 'Website', href: '/project', icon: Globe, color: 'text-teal-600' },
        ].map((a) => (
          <Link key={a.label} href={a.href}>
            <motion.div whileHover={{ scale: 1.04 }} className="bg-card border rounded-xl p-3 text-center hover:border-primary/40 transition cursor-pointer">
              <a.icon className={`h-5 w-5 mx-auto ${a.color}`} />
              <p className="text-xs font-medium mt-1.5">{a.label}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Pipeline */}
        <div className="lg:col-span-2 bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-lg">Lead Pipeline</h3>
            <Link href="/leads" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {[
              { stage: 'New', count: 45, percent: 100, color: 'bg-blue-500' },
              { stage: 'Contacted', count: 32, percent: 71, color: 'bg-yellow-500' },
              { stage: 'Qualified', count: 24, percent: 53, color: 'bg-purple-500' },
              { stage: 'Negotiation', count: 15, percent: 33, color: 'bg-orange-500' },
              { stage: 'Won', count: 8, percent: 18, color: 'bg-green-500' },
            ].map((item) => (
              <div key={item.stage} className="flex items-center gap-4">
                <span className="text-sm w-24 text-muted-foreground">{item.stage}</span>
                <div className="flex-1 h-7 bg-muted rounded-lg overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.percent}%` }} transition={{ duration: 0.8, delay: 0.2 }} className={`h-full ${item.color} rounded-lg flex items-center justify-end pr-3`}>
                    <span className="text-xs font-medium text-white">{item.count}</span>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights + Bot Status */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> AI Agents Status</h3>
            <div className="space-y-2">
              {[
                { name: 'WhatsApp Bot', status: 'Active', msgs: bot.todayMessages || 0 },
                { name: 'Marketing Agent', status: 'Active', msgs: 8 },
                { name: 'Follow-up Agent', status: 'Active', msgs: 34 },
                { name: 'CEO Agent', status: 'Active', msgs: 1 },
              ].map((a) => (
                <div key={a.name} className="flex items-center justify-between py-1.5">
                  <span className="text-sm">{a.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{a.msgs} today</span>
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                </div>
              ))}
            </div>
            <Link href="/ai-agents" className="text-xs text-primary hover:underline mt-3 inline-block">Manage agents →</Link>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> AI Insights</h3>
            <div className="space-y-2.5">
              {[
                '3 hot leads need immediate follow-up',
                'WhatsApp bot converted 2 leads today',
                'Corner plots selling 2x faster',
                'Best posting time: 10 AM & 7 PM',
                'Revenue up 12% vs last week',
              ].map((insight, i) => (
                <p key={i} className={`text-xs p-2 rounded-lg ${i < 2 ? 'bg-primary/5 border border-primary/20 font-medium' : 'bg-muted/50'}`}>{insight}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lead Sources + Plot Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sources */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Lead Sources
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(sources.length > 0 ? sources : [
              { source: 'WEBSITE', _count: 34 }, { source: 'WHATSAPP', _count: 28 },
              { source: 'FACEBOOK', _count: 18 }, { source: 'INSTAGRAM', _count: 15 },
              { source: 'GOOGLE_ADS', _count: 12 }, { source: 'REFERRAL', _count: 11 },
            ]).map((s: any) => (
              <div key={s.source} className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-xl font-bold">{s._count}</p>
                <p className="text-xs text-muted-foreground">{s.source?.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Plot Status Mini */}
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2"><Map className="h-5 w-5 text-emerald-600" /> Plot Inventory</h3>
            <Link href="/plotting/inventory" className="text-sm text-primary hover:underline">View map</Link>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-2xl font-bold">40</p><p className="text-xs text-muted-foreground">Total</p></div>
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg"><p className="text-2xl font-bold text-emerald-600">25</p><p className="text-xs text-muted-foreground">Available</p></div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg"><p className="text-2xl font-bold text-amber-600">5</p><p className="text-xs text-muted-foreground">Reserved</p></div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg"><p className="text-2xl font-bold text-red-600">7</p><p className="text-xs text-muted-foreground">Sold</p></div>
          </div>
          <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: '62.5%' }} />
            <div className="bg-amber-500 h-full" style={{ width: '12.5%' }} />
            <div className="bg-red-500 h-full" style={{ width: '17.5%' }} />
            <div className="bg-gray-400 h-full" style={{ width: '7.5%' }} />
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Available</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Reserved</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Sold</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { time: '2 min ago', text: 'WhatsApp Bot replied to Priya Sharma about corner plot pricing', icon: MessageSquare, color: 'text-green-600' },
            { time: '15 min ago', text: 'New lead from website: Aarav Mehta (Budget: ₹25L)', icon: Target, color: 'text-blue-600' },
            { time: '1 hr ago', text: 'AI Calling Agent completed call with Vikram Singh - Interested', icon: Phone, color: 'text-orange-600' },
            { time: '2 hr ago', text: 'Social post published on Instagram: "Premium NA Plots"', icon: Megaphone, color: 'text-pink-600' },
            { time: '3 hr ago', text: 'Plot P-2C booked by Neha Gupta (₹32L)', icon: Map, color: 'text-emerald-600' },
            { time: '5 hr ago', text: 'Broadcast sent to 45 contacts via WhatsApp', icon: Send, color: 'text-purple-600' },
          ].map((activity, i) => (
            <div key={i} className="flex items-start gap-3 py-2">
              <activity.icon className={`h-4 w-4 mt-0.5 shrink-0 ${activity.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm">{activity.text}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
