'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Map, Target, Phone, MessageSquare, Share2, Search,
  TrendingUp, ArrowUpRight,
} from 'lucide-react';
import api from '@/lib/api';

export default function DashboardPage() {
  // Single live-stats call: leads by source, plots, channels — all real, auto-refreshing.
  const { data: liveData } = useQuery({
    queryKey: ['dashboard-live'],
    queryFn: () => api.get('/dashboard/live-stats'),
    refetchInterval: 15000,
  });

  const { data: callData } = useQuery({
    queryKey: ['calls-dash'],
    queryFn: () => api.get('/ai-calling/metrics'),
    refetchInterval: 15000,
  });

  const live: any = (liveData as any)?.data || {};
  const leadStats: any = live.leads || {};
  const plotStats = {
    total: live.plots?.total || 0,
    available: live.plots?.available || 0,
    reserved: live.plots?.reserved || 0,
    sold: live.plots?.sold || 0,
  };
  const channels: any = live.channels || {};
  const calls: any = (callData as any)?.data || {};

  const sourceLabels: Record<string, string> = {
    WEBSITE: 'Website', WHATSAPP: 'WhatsApp', FACEBOOK: 'Facebook',
    INSTAGRAM: 'Instagram', GOOGLE_ADS: 'Google Ads', REFERRAL: 'Referral',
    WALK_IN: 'Walk-in', COLD_CALL: 'Cold Call', OTHER: 'Scraped / Other',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Anandi Park</h1>
        <p className="text-muted-foreground mt-1">
          84 Premium NA Plots · Bakori, Wagholi-Bakori Road, Pune · by Yuvraj Gade & Rajan Kute Developers
        </p>
      </div>

      {/* Key Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <Map className="h-5 w-5 text-emerald-600" />
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" /> {plotStats.sold} sold
            </span>
          </div>
          <p className="text-3xl font-bold mt-2">{plotStats.available}</p>
          <p className="text-sm text-muted-foreground">Plots Available</p>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <Target className="h-5 w-5 text-blue-600" />
            {leadStats.newToday > 0 && (
              <span className="text-xs text-emerald-600 font-medium">+{leadStats.newToday} today</span>
            )}
          </div>
          <p className="text-3xl font-bold mt-2">{leadStats.total || 0}</p>
          <p className="text-sm text-muted-foreground">Total Leads</p>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <Phone className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold mt-2">{calls.total || 0}</p>
          <p className="text-sm text-muted-foreground">Calls Made</p>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <MessageSquare className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold mt-2">{channels.whatsappMessages || 0}</p>
          <p className="text-sm text-muted-foreground">WhatsApp Messages</p>
        </div>
      </div>

      {/* Plot Progress */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Plot Sales Progress</h2>
          <Link href="/plotting/inventory" className="text-sm text-emerald-600 hover:underline">View map →</Link>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{plotStats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{plotStats.available}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{plotStats.reserved}</p>
            <p className="text-xs text-muted-foreground">Reserved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{plotStats.sold}</p>
            <p className="text-xs text-muted-foreground">Sold</p>
          </div>
        </div>
        <div className="w-full h-4 rounded-full bg-muted overflow-hidden flex">
          {plotStats.total > 0 && (
            <>
              <div className="bg-emerald-500 h-full" style={{ width: `${(plotStats.available / plotStats.total) * 100}%` }} />
              <div className="bg-amber-500 h-full" style={{ width: `${(plotStats.reserved / plotStats.total) * 100}%` }} />
              <div className="bg-red-500 h-full" style={{ width: `${(plotStats.sold / plotStats.total) * 100}%` }} />
            </>
          )}
        </div>
        <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Reserved</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Sold</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Plot Map', href: '/plotting/inventory', icon: Map, color: 'text-emerald-600' },
          { label: 'Voice Calls', href: '/plotting/calling', icon: Phone, color: 'text-orange-600' },
          { label: 'WhatsApp Bot', href: '/plotting/whatsapp-bot', icon: MessageSquare, color: 'text-green-600' },
          { label: 'Social Media', href: '/plotting/social', icon: Share2, color: 'text-pink-600' },
          { label: 'Lead Scraper', href: '/plotting/scraper', icon: Search, color: 'text-blue-600' },
          { label: 'Project Site', href: '/project', icon: TrendingUp, color: 'text-teal-600' },
        ].map((a) => (
          <Link key={a.label} href={a.href}>
            <div className="bg-card border rounded-xl p-4 text-center hover:border-emerald-300 transition cursor-pointer">
              <a.icon className={`h-6 w-6 mx-auto ${a.color}`} />
              <p className="text-xs font-medium mt-2">{a.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" /> Lead Sources
          </h2>
          {leadStats.bySource?.length > 0 ? (
            <div className="space-y-3">
              {leadStats.bySource.map((s: any) => (
                <div key={s.source} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{sourceLabels[s.source] || s.source}</span>
                  <span className="text-sm font-semibold">{s.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No leads yet</p>
              <Link href="/plotting/scraper" className="text-xs text-emerald-600 hover:underline mt-1 inline-block">
                Run the scraper →
              </Link>
            </div>
          )}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4 text-center">
            <div>
              <p className="text-lg font-bold">{leadStats.qualified || 0}</p>
              <p className="text-[10px] text-muted-foreground">Qualified</p>
            </div>
            <div>
              <p className="text-lg font-bold">{leadStats.won || 0}</p>
              <p className="text-[10px] text-muted-foreground">Won</p>
            </div>
            <div>
              <p className="text-lg font-bold">{leadStats.newThisWeek || 0}</p>
              <p className="text-[10px] text-muted-foreground">This week</p>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Map className="h-5 w-5 text-emerald-600" /> Project Details
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Project', value: 'Anandi Park' },
              { label: 'Developer', value: 'Yuvraj Gade & Rajan Kute' },
              { label: 'Location', value: 'GAT No. 279, Village Bakori, Taluka Haveli, Pune' },
              { label: 'Road', value: 'Wagholi-Bakori Wide Road' },
              { label: 'Total Plots', value: '84 (1000–4510 sqft)' },
              { label: 'Price Range', value: '₹15L – ₹83L' },
              { label: 'Rate', value: '₹1,500/sqft + premiums' },
              { label: 'Type', value: 'NA Residential Plots' },
              { label: 'Status', value: 'RERA Registered · Clear Titles' },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4 py-1.5 border-b last:border-0">
                <span className="text-xs text-muted-foreground shrink-0">{item.label}</span>
                <span className="text-sm font-medium text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calling Stats */}
      {(calls.total > 0) && (
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-orange-600" /> Calling Campaign
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{calls.total}</p>
              <p className="text-xs text-muted-foreground">Total Calls</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{calls.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{calls.connectionRate}</p>
              <p className="text-xs text-muted-foreground">Connect Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{calls.avgDuration}</p>
              <p className="text-xs text-muted-foreground">Avg Duration</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
