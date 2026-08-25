'use client';

import { Download, Palette, Image as ImageIcon, FileText, Printer } from 'lucide-react';

// All assets are static files under apps/web/public/brand, served from the same
// origin as the dashboard — no API call needed. Regenerate them on the machine
// with: node scripts/build-brand-kit.js  and  node scripts/render-print-templates.js

const COLORS = [
  { name: 'Slate', hex: '#0F172A' },
  { name: 'Slate 800', hex: '#1E293B' },
  { name: 'Gold', hex: '#F59E0B' },
  { name: 'Gold Light', hex: '#FCD34D' },
  { name: 'Gold Deep', hex: '#D97706' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'White', hex: '#FFFFFF' },
];

const LOGOS = [
  { label: 'Logo — transparent', file: '/brand/richland-transparent.png', dark: true },
  { label: 'Logo — on white', file: '/brand/richland-white.png', dark: false },
  { label: 'Logo — square (dark)', file: '/brand/richland-square.png', dark: true },
  { label: 'App icon / favicon', file: '/brand/favicon-512.png', dark: true },
  { label: 'Social square (1080)', file: '/brand/og-brand-1080.png', dark: true },
];

const PRINT = [
  { label: 'Visiting Card — Front', base: 'visiting-card-front', size: '3.5 × 2 in + bleed' },
  { label: 'Visiting Card — Back', base: 'visiting-card-back', size: '3.5 × 2 in + bleed' },
  { label: 'Brochure / Book Cover', base: 'brochure-cover', size: 'A4 · 300 DPI' },
  { label: 'Brochure — Inside', base: 'brochure-inside', size: 'A4 · 300 DPI' },
  { label: 'Flex Banner — Portrait', base: 'flex-portrait', size: '4 × 6 ft' },
  { label: 'Hoarding — Landscape', base: 'flex-hoarding', size: '12 × 6 ft' },
  { label: 'Carry Bag', base: 'carry-bag', size: '12 × 15 in' },
  { label: 'Letterhead', base: 'letterhead', size: 'A4' },
];

export default function MarketingKitPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Palette className="h-8 w-8 text-primary" /> Marketing Kit
        </h1>
        <p className="text-muted-foreground mt-1">
          Rich-Land Developers brand assets and print-ready collateral for Anandi Park.
          PDFs are vector and print-perfect at any size; PNGs are high-resolution.
        </p>
      </div>

      {/* Brand colors */}
      <section className="bg-card border rounded-xl p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Palette className="h-5 w-5 text-primary" /> Brand Colors
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {COLORS.map((c) => (
            <div key={c.hex} className="rounded-lg border overflow-hidden">
              <div className="h-16" style={{ background: c.hex }} />
              <div className="p-2">
                <p className="text-xs font-medium">{c.name}</p>
                <button
                  onClick={() => navigator.clipboard?.writeText(c.hex)}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                  title="Click to copy"
                >
                  {c.hex}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">Fonts: Inter (headlines/body), Georgia (monogram), Noto Sans Devanagari (Marathi/Hindi).</p>
      </section>

      {/* Logo kit */}
      <section className="bg-card border rounded-xl p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <ImageIcon className="h-5 w-5 text-primary" /> Logo Kit
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {LOGOS.map((l) => (
            <div key={l.file} className="rounded-xl border overflow-hidden">
              <div className={`flex items-center justify-center h-32 p-4 ${l.dark ? 'bg-slate-900' : 'bg-white'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.file} alt={l.label} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{l.label}</span>
                <a href={l.file} download className="p-1.5 rounded-md border hover:bg-muted" aria-label={`Download ${l.label}`}>
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="/rich-land-logo.svg" download className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Vector logo (SVG)
          </a>
          <a href="/rich-land-mark.svg" download className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted">
            <Download className="h-4 w-4" /> Vector mark (SVG)
          </a>
        </div>
      </section>

      {/* Print collateral */}
      <section className="bg-card border rounded-xl p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-1">
          <Printer className="h-5 w-5 text-primary" /> Print Collateral
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Download the PDF for the printer (vector, scales to any size). PNG is a high-res raster preview.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRINT.map((p) => (
            <div key={p.base} className="rounded-xl border overflow-hidden">
              <div className="bg-slate-900 flex items-center justify-center p-3" style={{ minHeight: '180px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/brand/print/${p.base}.png`} alt={p.label} className="max-h-64 max-w-full object-contain rounded" />
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{p.label}</span>
                  <span className="text-[11px] text-muted-foreground">{p.size}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`/brand/print/${p.base}.pdf`}
                    download
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                  >
                    <FileText className="h-3.5 w-3.5" /> PDF
                  </a>
                  <a
                    href={`/brand/print/${p.base}.png`}
                    download
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium hover:bg-muted"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> PNG
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Need a different size or edit? The source templates are HTML in <code className="font-mono bg-muted px-1 rounded">brand/templates/</code>.
          Re-render with <code className="font-mono bg-muted px-1 rounded">node scripts/render-print-templates.js</code>.
          For a layered Photoshop file, open the SVG or the PDF in Photoshop/Illustrator.
        </p>
      </section>
    </div>
  );
}
