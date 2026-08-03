'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Phone, Mail, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get('/customers', { params: { search, limit: 50 } }),
  });

  const customers = data?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage converted leads and buyers</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <p className="col-span-full text-center py-8 text-muted-foreground">Loading...</p>
        ) : customers.length === 0 ? (
          <p className="col-span-full text-center py-8 text-muted-foreground">No customers found</p>
        ) : customers.map((customer: any) => (
          <div key={customer.id} className="bg-card border rounded-xl p-5 hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {customer.name?.[0]}
              </div>
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-xs text-muted-foreground">Since {formatDate(customer.createdAt)}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {customer.phone}</p>
              {customer.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {customer.email}</p>}
              {customer.city && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {customer.city}, {customer.state}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
