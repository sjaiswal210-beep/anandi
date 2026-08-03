'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Phone, Mic, FileText, TrendingUp, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function AICallingPage() {
  const [callPhone, setCallPhone] = useState('');
  const [objective, setObjective] = useState('introduction');

  const { data: metricsData } = useQuery({
    queryKey: ['call-metrics'],
    queryFn: () => api.get('/ai-calling/metrics'),
  });

  const { data: recordsData } = useQuery({
    queryKey: ['call-records'],
    queryFn: () => api.get('/ai-calling/records'),
  });

  const callMutation = useMutation({
    mutationFn: (data: { phone: string; objective: string }) =>
      api.post('/ai-calling/call', data),
    onSuccess: () => toast.success('Call initiated!'),
  });

  const metrics = metricsData?.data || {};
  const records = recordsData?.data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Phone className="h-8 w-8 text-orange-600" /> AI Calling Agent
        </h1>
        <p className="text-muted-foreground mt-1">Humanized voice AI that calls leads and handles conversations</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Calls', value: metrics.total || 0, icon: Phone },
          { label: 'Completed', value: metrics.completed || 0, icon: TrendingUp },
          { label: 'Connected', value: metrics.connected || 0, icon: Users },
          { label: 'Connect Rate', value: metrics.connectionRate || '0%', icon: TrendingUp },
          { label: 'Avg Duration', value: metrics.avgDuration || '0s', icon: Clock },
        ].map((m) => (
          <div key={m.label} className="bg-card border rounded-xl p-4 text-center">
            <m.icon className="h-5 w-5 mx-auto text-orange-600 mb-2" />
            <p className="text-xl font-bold">{m.value}</p>
            <p className="text-xs text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Initiate Call */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Mic className="h-5 w-5 text-orange-600" /> Make AI Call
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Phone Number</label>
              <input type="tel" value={callPhone} onChange={(e) => setCallPhone(e.target.value)} placeholder="9876543210" className="w-full px-4 py-2 border rounded-lg text-sm bg-background" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Objective</label>
              <select value={objective} onChange={(e) => setObjective(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm bg-background">
                <option value="introduction">Introduction Call</option>
                <option value="follow_up">Follow-up</option>
                <option value="site_visit">Schedule Site Visit</option>
                <option value="pricing">Share Pricing</option>
                <option value="booking">Booking Confirmation</option>
              </select>
            </div>
            <button
              onClick={() => callMutation.mutate({ phone: callPhone, objective })}
              disabled={!callPhone || callMutation.isPending}
              className="w-full py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {callMutation.isPending ? 'Initiating...' : '📞 Initiate AI Call'}
            </button>
          </div>
        </div>

        {/* Call Records */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" /> Recent Calls
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {records.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No calls yet</p>
            ) : records.map((call: any) => (
              <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{call.phone}</p>
                  <p className="text-xs text-muted-foreground">{call.intentDetected || 'pending'} • {call.duration ? `${call.duration}s` : '-'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  call.status === 'completed' ? 'bg-green-100 text-green-700' :
                  call.status === 'initiated' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{call.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
