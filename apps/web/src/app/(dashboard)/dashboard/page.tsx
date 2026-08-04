'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Map, Target, Phone, MessageSquare, Share2, Search,
  TrendingUp, Users, IndianRupee, ArrowUpRight,
} from 'lucide-react';
import api from '@/lib/api';

export default function DashboardPage() {
  const { data: plotsData } = useQuery({
    queryKey: ['plots-dash'],
    queryFn: () => api.get('/plots/project/first'),
    staleTime: 60000,
  });

  const { data: leadsData } = useQuery({
    queryKey: ['leads-dash'],
    queryFn: () => api.get('/lead-scraper/stats'),
    staleTime: 60000,
  });

  const { data: callData } = useQuery({
    queryKey: ['calls-dash'],
    queryFn: () => api.get('/ai-calling/metrics'),
    staleTime: 60000,
  });

  const plots: any[] = (plotsData as any)?.data || [];
  const plotStats = {
    total: plots.length || 84,
    available: plots.filter((p) => p.status === 'AVAILABLE').length,
    reserved: plots.filter((p) => p.status === 'RESERVED').length,
    sold: plots.filter((p) => p.status === 'SOLD').length,
  };

  const scraper: any = (leadsData as any)?.data || {};
  const calls: any = (callData as any)?.data || {};

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
          </div>
          <p className="text-3xl font-bold mt-2">{scraper.total || 0}</p>
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
            <IndianRupee className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold mt-2">₹15L+</p>
          <p className="text-sm text-muted-foreground">Starting Price</p>
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
          {scraper.byPlatform?.length > 0 ? (
            <div className="space-y-3">
              {scraper.byPlatform.map((s: any) => (
                <div key={s.platform} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm capitalize">{s.platform.replace('_', ' ')}</span>
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
          {scraper.lastScrapeAt && (
            <p className="text-xs text-muted-foreground mt-3">
              Last scraped: {new Date(scraper.lastScrapeAt).toLocaleString()}
            </p>
          )}
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
