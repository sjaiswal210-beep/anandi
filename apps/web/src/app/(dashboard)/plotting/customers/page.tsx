'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Send, Users, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function CustomerDataPage() {
  const queryClient = useQueryClient();
  const [csvText, setCsvText] = useState('');
  const [broadcastName, setBroadcastName] = useState('');
  const [broadcastChannel, setBroadcastChannel] = useState('whatsapp');
  const [broadcastTemplate, setBroadcastTemplate] = useState('Hi {name}, we are launching premium NA plots starting ₹15 Lakh. RERA registered. Would you like to know more? Reply YES for details.');

  const { data: customersData } = useQuery({
    queryKey: ['customer-imports'],
    queryFn: () => api.get('/customer-data'),
  });

  const { data: broadcastsData } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: () => api.get('/customer-data/broadcasts'),
  });

  const importMutation = useMutation({
    mutationFn: (records: any[]) => api.post('/customer-data/import', { records }),
    onSuccess: (res: any) => {
      toast.success(`Imported ${res?.data?.imported || 0} customers`);
      queryClient.invalidateQueries({ queryKey: ['customer-imports'] });
      setCsvText('');
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: (dto: any) => api.post('/customer-data/broadcast', dto),
    onSuccess: () => {
      toast.success('Broadcast campaign created');
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
    },
  });

  const customers = customersData?.data?.data || [];
  const broadcasts = broadcastsData?.data || [];

  const handleImport = () => {
    const lines = csvText.trim().split('\n').filter(Boolean);
    const records = lines.map((line) => {
      const [name, phone, email] = line.split(',').map((s) => s.trim());
      return { name, phone, email: email || undefined };
    });
    if (records.length === 0) { toast.error('No data to import'); return; }
    importMutation.mutate(records);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" /> Customer Data Agent
        </h1>
        <p className="text-muted-foreground mt-1">Import existing customers, broadcast project details, convert to leads</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" /> Import Customers
          </h3>
          <p className="text-xs text-muted-foreground mb-3">Paste CSV data: name, phone, email (one per line)</p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={6}
            placeholder="Rahul Sharma, 9876543210, rahul@gmail.com&#10;Priya Patel, 9123456789&#10;Amit Singh, 9988776655, amit@email.com"
            className="w-full px-4 py-2 border rounded-lg text-sm bg-background resize-none font-mono"
          />
          <button onClick={handleImport} disabled={!csvText.trim() || importMutation.isPending} className="mt-3 w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {importMutation.isPending ? 'Importing...' : `Import ${csvText.trim().split('\n').filter(Boolean).length} Contacts`}
          </button>
          <p className="text-xs text-muted-foreground mt-2">{customers.length} customers imported so far</p>
        </div>

        {/* Broadcast */}
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-green-600" /> Broadcast Campaign
          </h3>
          <div className="space-y-3">
            <input type="text" value={broadcastName} onChange={(e) => setBroadcastName(e.target.value)} placeholder="Campaign name" className="w-full px-4 py-2 border rounded-lg text-sm bg-background" />
            <select value={broadcastChannel} onChange={(e) => setBroadcastChannel(e.target.value)} className="w-full px-4 py-2 border rounded-lg text-sm bg-background">
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
            <textarea
              value={broadcastTemplate}
              onChange={(e) => setBroadcastTemplate(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg text-sm bg-background resize-none"
            />
            <button
              onClick={() => broadcastMutation.mutate({ name: broadcastName, channel: broadcastChannel, template: broadcastTemplate })}
              disabled={!broadcastName || broadcastMutation.isPending}
              className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Create Broadcast
            </button>
          </div>
        </div>
      </div>

      {/* Broadcast History */}
      {broadcasts.length > 0 && (
        <div className="bg-card border rounded-xl p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Broadcast History
          </h3>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2">Campaign</th>
                <th className="text-left px-4 py-2">Channel</th>
                <th className="text-left px-4 py-2">Sent</th>
                <th className="text-left px-4 py-2">Delivered</th>
                <th className="text-left px-4 py-2">Responded</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {broadcasts.map((b: any) => (
                <tr key={b.id}>
                  <td className="px-4 py-2 font-medium">{b.name}</td>
                  <td className="px-4 py-2">{b.channel}</td>
                  <td className="px-4 py-2">{b.sentCount}</td>
                  <td className="px-4 py-2">{b.deliveredCount}</td>
                  <td className="px-4 py-2">{b.respondedCount}</td>
                  <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${b.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
