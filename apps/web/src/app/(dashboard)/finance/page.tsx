'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { IndianRupee, TrendingUp, AlertCircle, Users, ArrowUpRight } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function FinancePage() {
  const { data: summaryData } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => api.get('/finance/summary'),
  });

  const { data: overdueData } = useQuery({
    queryKey: ['finance-overdue'],
    queryFn: () => api.get('/finance/overdue'),
  });

  const summary = summaryData?.data || {};
  const overdue = overdueData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finance</h1>
        <p className="text-muted-foreground mt-1">Revenue, payments, and commissions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Revenue', value: formatCurrency(summary.totalRevenue || 0), icon: IndianRupee, color: 'text-green-600 bg-green-100' },
          { label: 'Monthly Revenue', value: formatCurrency(summary.monthlyRevenue || 0), icon: TrendingUp, color: 'text-blue-600 bg-blue-100' },
          { label: 'Pending Payments', value: formatCurrency(summary.pendingPayments || 0), icon: AlertCircle, color: 'text-orange-600 bg-orange-100' },
          { label: 'Commissions', value: formatCurrency(summary.totalCommissions || 0), icon: Users, color: 'text-purple-600 bg-purple-100' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Overdue Payments */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          Overdue Payments ({overdue.length})
        </h3>
        {overdue.length === 0 ? (
          <p className="text-muted-foreground text-sm">No overdue payments</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Customer</th>
                  <th className="text-left py-2 font-medium">Booking</th>
                  <th className="text-left py-2 font-medium">Amount</th>
                  <th className="text-left py-2 font-medium">Due Date</th>
                  <th className="text-left py-2 font-medium">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {overdue.map((payment: any) => (
                  <tr key={payment.id}>
                    <td className="py-3 font-medium">{payment.customer?.name}</td>
                    <td className="py-3 text-muted-foreground">{payment.booking?.bookingNumber}</td>
                    <td className="py-3 text-red-600 font-medium">{formatCurrency(Number(payment.amount))}</td>
                    <td className="py-3 text-muted-foreground">{new Date(payment.dueDate).toLocaleDateString()}</td>
                    <td className="py-3">{payment.customer?.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
