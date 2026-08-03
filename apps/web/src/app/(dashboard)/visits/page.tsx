'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Calendar, MapPin, Clock, User, Phone, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

const statusConfig: Record<string, { color: string; icon: any }> = {
  SCHEDULED: { color: 'bg-blue-100 text-blue-700', icon: Clock },
  CONFIRMED: { color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  IN_PROGRESS: { color: 'bg-yellow-100 text-yellow-700', icon: MapPin },
  COMPLETED: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { color: 'bg-red-100 text-red-700', icon: XCircle },
  NO_SHOW: { color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

export default function VisitsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: visitsData, isLoading } = useQuery({
    queryKey: ['visits', { status: statusFilter, date: viewDate }],
    queryFn: () => api.get('/visits', { params: { status: statusFilter, date: viewDate, limit: 50 } }),
  });

  const visits = visitsData?.data?.data || [];

  const { data: todayData } = useQuery({
    queryKey: ['visits-today'],
    queryFn: () => api.get('/visits/today'),
  });

  const todayVisits = todayData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Visits</h1>
          <p className="text-muted-foreground mt-1">Schedule and track property visits</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
          <Plus className="h-4 w-4" /> Schedule Visit
        </button>
      </div>

      {/* Today's Schedule */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Today&apos;s Schedule ({todayVisits.length} visits)
        </h3>
        {todayVisits.length === 0 ? (
          <p className="text-muted-foreground text-sm">No visits scheduled for today</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayVisits.map((visit: any) => (
              <div key={visit.id} className="border rounded-lg p-4 hover:border-primary/50 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{visit.lead?.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig[visit.status]?.color}`}>
                    {visit.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDateTime(visit.scheduledAt)}</p>
                  <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {visit.property?.title || 'TBD'}</p>
                  <p className="flex items-center gap-1"><User className="h-3 w-3" /> {visit.agent?.name}</p>
                  <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {visit.lead?.phone}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={viewDate}
          onChange={(e) => setViewDate(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-background"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-background">
          <option value="">All Status</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No Show</option>
        </select>
      </div>

      {/* Visits Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Lead</th>
              <th className="text-left px-4 py-3 font-medium">Property</th>
              <th className="text-left px-4 py-3 font-medium">Agent</th>
              <th className="text-left px-4 py-3 font-medium">Scheduled At</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : visits.map((visit: any) => (
              <tr key={visit.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{visit.lead?.name}</div>
                  <div className="text-xs text-muted-foreground">{visit.lead?.phone}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{visit.property?.title || 'General'}</td>
                <td className="px-4 py-3">{visit.agent?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateTime(visit.scheduledAt)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[visit.status]?.color}`}>
                    {visit.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {visit.rating ? `${'⭐'.repeat(visit.rating)}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
