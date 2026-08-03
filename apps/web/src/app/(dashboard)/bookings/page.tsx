'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, FileText, IndianRupee, Calendar, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusColors: Record<string, string> = {
  INITIATED: 'bg-blue-100 text-blue-700',
  AGREEMENT: 'bg-yellow-100 text-yellow-700',
  LOAN_APPLIED: 'bg-orange-100 text-orange-700',
  LOAN_APPROVED: 'bg-purple-100 text-purple-700',
  REGISTERED: 'bg-cyan-100 text-cyan-700',
  POSSESSION: 'bg-teal-100 text-teal-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function BookingsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', { search, status: statusFilter }],
    queryFn: () => api.get('/bookings', { params: { search, status: statusFilter, limit: 50 } }),
  });

  const bookings = bookingsData?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground mt-1">Track property bookings and payments</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
          <Plus className="h-4 w-4" /> New Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: FileText, color: 'text-blue-600' },
          { label: 'Active', value: bookings.filter((b: any) => !['COMPLETED', 'CANCELLED'].includes(b.status)).length, icon: Calendar, color: 'text-orange-600' },
          { label: 'Completed', value: bookings.filter((b: any) => b.status === 'COMPLETED').length, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'Total Value', value: formatCurrency(bookings.reduce((s: number, b: any) => s + Number(b.totalAmount || 0), 0)), icon: IndianRupee, color: 'text-purple-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-background">
          <option value="">All Status</option>
          {Object.keys(statusColors).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Bookings List */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Booking #</th>
              <th className="text-left px-4 py-3 font-medium">Customer</th>
              <th className="text-left px-4 py-3 font-medium">Property</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Total</th>
              <th className="text-left px-4 py-3 font-medium">Paid</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No bookings found</td></tr>
            ) : bookings.map((booking: any) => (
              <tr key={booking.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{booking.bookingNumber}</td>
                <td className="px-4 py-3 font-medium">{booking.customer?.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{booking.property?.title}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status] || ''}`}>
                    {booking.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">{formatCurrency(Number(booking.totalAmount))}</td>
                <td className="px-4 py-3 text-green-600">{formatCurrency(Number(booking.paidAmount))}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(booking.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
