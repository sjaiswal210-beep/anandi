'use client';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Search, FileText, Image, File, Download, Share2, Map, Shield, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api, { mediaUrl } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const CATEGORIES = [
  { id: '', label: 'All Documents' },
  { id: 'BROCHURE', label: 'Brochure' },
  { id: 'LAYOUT_PLAN', label: 'Layout Plan' },
  { id: 'FLOOR_PLAN', label: 'Floor Plan' },
  { id: 'RERA_CERTIFICATE', label: 'RERA Certificate' },
  { id: 'TITLE_DOCUMENT', label: 'Title / 7/12' },
  { id: 'NA_ORDER', label: 'NA Order' },
  { id: 'AGREEMENT', label: 'Agreement' },
  { id: 'SALE_DEED', label: 'Sale Deed' },
  { id: 'PRICE_LIST', label: 'Price List' },
  { id: 'SITE_PHOTOS', label: 'Site Photos' },
  { id: 'OTHER', label: 'Other' },
];

const typeIcons: Record<string, any> = {
  BROCHURE: Image, LAYOUT_PLAN: Map, FLOOR_PLAN: Map,
  RERA_CERTIFICATE: Shield, TITLE_DOCUMENT: FileText,
  NA_ORDER: FileText, AGREEMENT: FileText, SALE_DEED: FileText,
  PRICE_LIST: FileText, SITE_PHOTOS: Image, OTHER: File,
};

const UPLOAD_TYPES = CATEGORIES.filter((c) => c.id !== '');

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload modal state: holds the picked file until the user confirms the
  // category/name, since a File alone has no "which category" info.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState('BROCHURE');
  const [uploadName, setUploadName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['documents', { search, type: typeFilter }],
    queryFn: () => api.get('/documents', { params: { search, type: typeFilter || undefined, limit: 100 } }),
  });

  const documents: any[] = (data as any)?.data?.data || (data as any)?.data || [];

  const uploadMutation = useMutation({
    mutationFn: (vars: { file: File; type: string; name: string }) => {
      const form = new FormData();
      form.append('file', vars.file);
      form.append('type', vars.type);
      form.append('name', vars.name || vars.file.name);
      return api.post('/documents', form);
    },
    onSuccess: () => {
      toast.success('Document uploaded');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      closeUploadModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Upload failed';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const openFilePicker = () => fileInputRef.current?.click();

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File is larger than 25 MB — please use a smaller file.');
      e.target.value = '';
      return;
    }
    setPendingFile(file);
    setUploadName(file.name.replace(/\.[^/.]+$/, ''));
    setUploadType(typeFilter || 'BROCHURE');
  };

  const closeUploadModal = () => {
    setPendingFile(null);
    setUploadName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmUpload = () => {
    if (!pendingFile) return;
    uploadMutation.mutate({ file: pendingFile, type: uploadType, name: uploadName });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-emerald-600" /> Documents
          </h1>
          <p className="text-muted-foreground mt-1">
            Anandi Park project documents — brochure, layout, RERA, pricing. Shared via WhatsApp bot on request.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={onFilePicked}
          />
          <button
            onClick={openFilePicker}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            <Upload className="h-4 w-4" /> Upload Document
          </button>
        </div>
      </div>

      {/* Upload confirm modal — appears after a file is picked */}
      {pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border rounded-xl p-5 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Upload document</h3>
              <button onClick={closeUploadModal} className="p-1 hover:bg-muted rounded" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {pendingFile.name} · {(pendingFile.size / 1024).toFixed(0)} KB
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              >
                {UPLOAD_TYPES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={closeUploadModal}
                disabled={uploadMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                disabled={uploadMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {uploadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4">
        <p className="text-sm text-emerald-800 dark:text-emerald-300">
          <strong>WhatsApp integration:</strong> When a lead asks for brochure, layout, or pricing on WhatsApp,
          the bot automatically picks the latest document of that type and sends it. Upload updated versions here.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setTypeFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                typeFilter === cat.id
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'hover:bg-muted'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents grid */}
      {isLoading ? (
        <div className="bg-card border rounded-xl p-8 text-center text-sm text-muted-foreground">Loading...</div>
      ) : documents.length === 0 ? (
        <div className="bg-card border rounded-xl p-8 text-center space-y-2">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          <p className="text-xs text-muted-foreground">
            Upload the Anandi Park brochure, layout plan, RERA certificate, and price list.
            The WhatsApp bot will share them automatically when leads ask.
          </p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Document</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Size</th>
                <th className="text-left px-4 py-3 font-medium">Uploaded</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: any) => {
                const Icon = typeIcons[doc.type] || File;
                return (
                  <tr key={doc.id} className="border-t hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">{doc.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-muted rounded text-xs">
                        {(doc.type || 'OTHER').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {doc.size ? `${(doc.size / 1024).toFixed(0)} KB` : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.createdAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {doc.url && (
                          <a
                            href={mediaUrl(doc.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 hover:bg-accent rounded"
                            aria-label="Download"
                            download
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                        <button className="p-1.5 hover:bg-accent rounded" aria-label="Share via WhatsApp" title="Copy link for WhatsApp">
                          <Share2 className="h-4 w-4 text-green-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Suggested documents */}
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold mb-3">Recommended documents to upload</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: 'Project Brochure (PDF)', type: 'BROCHURE', desc: 'Main marketing brochure with project overview, amenities, pricing' },
            { name: 'Layout Plan', type: 'LAYOUT_PLAN', desc: 'The 84-plot layout map showing rows, roads, dimensions' },
            { name: 'RERA Certificate', type: 'RERA_CERTIFICATE', desc: 'RERA registration document for buyer confidence' },
            { name: 'Price List', type: 'PRICE_LIST', desc: 'Plot-wise pricing with area, rate, and total amount' },
            { name: 'NA Order / 7/12 Extract', type: 'NA_ORDER', desc: 'Non-agricultural land conversion order' },
            { name: 'Site Photos', type: 'SITE_PHOTOS', desc: 'Recent site development progress photos' },
          ].map((suggestion) => {
            const exists = documents.some((d) => d.type === suggestion.type);
            return (
              <div
                key={suggestion.type}
                className={`p-3 rounded-lg border ${
                  exists
                    ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/10'
                    : 'border-dashed'
                }`}
              >
                <p className="text-sm font-medium flex items-center gap-2">
                  {exists && <span className="text-emerald-600">✓</span>}
                  {suggestion.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{suggestion.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
