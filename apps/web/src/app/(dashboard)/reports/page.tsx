'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, Building2, Download } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function ReportsPage() {
  const [period, setPeriod] = useState('monthly');
  const [reportType, setReportType] = useState('sales');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', reportType, period],
    queryFn: () => api.get(`/reports/${reportType}`, { params: { period } }),
  });

  const report = reportData?.data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">Business analytics and performance reports</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-accent">
          <Download className="h-4 w-4" /> Export PDF
        </button>
      </div>

      {/* Report Type Tabs */}
      <div className="flex items-center gap-2 border-b pb-3">
        {[
          { key: 'sales', label: 'Sales', icon: TrendingUp },
          { key: 'leads', label: 'Leads', icon: Users },
          { key: 'properties', label: 'Properties', icon: Building2 },
          { key: 'agents', label: 'Agent Performance', icon: Users },
          { key: 'marketing', label: 'Marketing', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setReportType(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${
              reportType === tab.key ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-2">
        {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-xs capitalize ${
              period === p ? 'bg-primary/10 text-primary border border-primary/30' : 'border hover:bg-accent'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="bg-card border rounded-xl p-6">
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading report...</p>
        ) : reportType === 'sales' ? (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Sales Report ({period})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{report.totalBookings || 0}</p>
                <p className="text-xs text-muted-foreground">Bookings</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{formatCurrency(report.totalRevenue || 0)}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{report.conversions || 0}</p>
                <p className="text-xs text-muted-foreground">Conversions</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-2xl font-bold">{report.conversionRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </div>
        ) : reportType === 'agents' ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Agent Performance</h3>
            {Array.isArray(report) && report.map((agent: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {agent.agent?.name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">{agent.agent?.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.leadsAssigned} leads assigned</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-green-600">{agent.leadsConverted}</p>
                    <p className="text-xs text-muted-foreground">Converted</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{agent.conversionRate}%</p>
                    <p className="text-xs text-muted-foreground">Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{agent.visitsCompleted}</p>
                    <p className="text-xs text-muted-foreground">Visits</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-16 w-16 mx-auto text-primary/20 mb-4" />
            <p className="text-muted-foreground">Report data for {reportType}</p>
            <pre className="text-left mt-4 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
