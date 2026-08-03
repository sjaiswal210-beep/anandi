'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Upload, Search, FileText, Image, File, Download, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

const typeIcons: Record<string, any> = {
  AADHAAR: FileText, PAN: FileText, AGREEMENT: FileText,
  SALE_DEED: FileText, FLOOR_PLAN: Image, LOAN_DOCUMENT: FileText,
  RERA_CERTIFICATE: FileText, BROCHURE: Image, OTHER: File,
};

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { search, type: typeFilter }],
    queryFn: () => api.get('/documents', { params: { search, type: typeFilter, limit: 50 } }),
  });

  const documents = data?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage property and customer documents</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
          <Upload className="h-4 w-4" /> Upload
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-background">
          <option value="">All Types</option>
          <option value="AADHAAR">Aadhaar</option>
          <option value="PAN">PAN</option>
          <option value="AGREEMENT">Agreement</option>
          <option value="SALE_DEED">Sale Deed</option>
          <option value="FLOOR_PLAN">Floor Plan</option>
          <option value="LOAN_DOCUMENT">Loan Document</option>
          <option value="RERA_CERTIFICATE">RERA Certificate</option>
          <option value="BROCHURE">Brochure</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Document</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Related To</th>
              <th className="text-left px-4 py-3 font-medium">Size</th>
              <th className="text-left px-4 py-3 font-medium">Uploaded</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
            ) : documents.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No documents found</td></tr>
            ) : documents.map((doc: any) => {
              const Icon = typeIcons[doc.type] || File;
              return (
                <tr key={doc.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{doc.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-muted rounded text-xs">{doc.type?.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{doc.lead?.name || doc.customer?.name || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{(doc.size / 1024).toFixed(0)} KB</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 hover:bg-accent rounded" aria-label="Download"><Download className="h-4 w-4" /></button>
                    <button className="p-1.5 hover:bg-accent rounded text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
