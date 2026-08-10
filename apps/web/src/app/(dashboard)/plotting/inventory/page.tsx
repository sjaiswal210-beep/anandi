'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useCallback } from 'react';
import { Map, Info, ZoomIn, ZoomOut, RotateCcw, Maximize } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  AVAILABLE: { bg: 'rgba(16,185,129,0.25)', border: '#10b981', text: '#065f46' },
  RESERVED: { bg: 'rgba(245,158,11,0.35)', border: '#f59e0b', text: '#78350f' },
  SOLD: { bg: 'rgba(239,68,68,0.35)', border: '#ef4444', text: '#7f1d1d' },
  HOLD: { bg: 'rgba(156,163,175,0.3)', border: '#9ca3af', text: '#374151' },
};

export default function PlotInventoryPage() {
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showOverlay, setShowOverlay] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: plots = [], isLoading } = useQuery<any[]>({
    queryKey: ['plot-inventory'],
    queryFn: async () => {
      const res: any = await api.get('/plots/project/first');
      const payload = res?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
  });

  const stats = {
    total: plots.length,
    available: plots.filter((p) => p.status === 'AVAILABLE').length,
    reserved: plots.filter((p) => p.status === 'RESERVED').length,
    sold: plots.filter((p) => p.status === 'SOLD').length,
  };

  // Zoom/pan
  const zoomIn = () => setZoom((z) => Math.min(z + 0.4, 5));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.4, 0.5));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);
  const onPointerUp = useCallback(() => setDragging(false), []);
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(5, Math.max(0.5, z - e.deltaY * 0.002)));
  }, []);

  // The image is the actual source. We overlay an SVG with transparent
  // plot regions on top so each one is clickable. The SVG viewBox matches
  // the image's native aspect ratio (measured from the file: ~3024 x 4032).
  const IMG_W = 3024;
  const IMG_H = 4032;

  // Plot hotspot positions — manually mapped to match the physical image.
  // Each entry: [row, col, x%, y%, w%, h%] as percentages of the image.
  // These are approximate bounding boxes over the plot labels in the image.
  // The approach: divide the image into the known 8 rows and variable columns.
  // Row positions (y% ranges) based on the image structure:
  const ROW_Y: Record<number, { top: number; h: number }> = {
    1: { top: 14, h: 8.5 },
    2: { top: 23, h: 7.5 },
    3: { top: 31, h: 7.5 },
    4: { top: 39, h: 7.5 },
    5: { top: 47, h: 7.5 },
    6: { top: 55, h: 7.5 },
    7: { top: 67, h: 7.5 },
    8: { top: 75, h: 7.5 },
  };

  // For each row, plots span from ~8% to ~92% horizontally, distributed by area.
  const ROW_X_START = 8;
  const ROW_X_END = 92;

  const getPlotRect = (plot: any) => {
    const rowInfo = ROW_Y[plot.row];
    if (!rowInfo) return null;

    const rowPlots = plots
      .filter((p) => p.row === plot.row)
      .sort((a, b) => a.col - b.col);
    const totalArea = rowPlots.reduce((s, p) => s + Number(p.area), 0);
    const totalW = ROW_X_END - ROW_X_START;

    let xStart = ROW_X_START;
    for (const p of rowPlots) {
      const w = (Number(p.area) / totalArea) * totalW;
      if (p.id === plot.id) {
        return { x: xStart, y: rowInfo.top, w, h: rowInfo.h };
      }
      xStart += w;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="h-7 w-7 text-emerald-600" /> Plot Layout
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Tap any plot · pinch/scroll to zoom · drag to pan</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={zoomIn} className="p-2 border rounded-lg hover:bg-muted" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={zoomOut} className="p-2 border rounded-lg hover:bg-muted" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
          <button onClick={resetView} className="p-2 border rounded-lg hover:bg-muted" aria-label="Reset"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={() => setShowOverlay((s) => !s)} className={`p-2 border rounded-lg ${showOverlay ? 'bg-emerald-100 dark:bg-emerald-950' : 'hover:bg-muted'}`} aria-label="Toggle overlay">
            <Maximize className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground ml-1">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-card border rounded-lg p-2 text-center">
          <p className="text-lg font-bold">{stats.total}</p><p className="text-[9px] text-muted-foreground">Total</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-emerald-600">{stats.available}</p><p className="text-[9px] text-muted-foreground">Available</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-amber-600">{stats.reserved}</p><p className="text-[9px] text-muted-foreground">Reserved</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-2 text-center">
          <p className="text-lg font-bold text-red-600">{stats.sold}</p><p className="text-[9px] text-muted-foreground">Sold</p>
        </div>
      </div>

      {/* Map with image background + SVG overlay */}
      {isLoading ? (
        <div className="bg-card border rounded-xl p-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div
          ref={containerRef}
          className="relative border rounded-xl overflow-hidden bg-white cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          <div
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              transition: dragging ? 'none' : 'transform 0.12s ease-out',
              position: 'relative',
            }}
          >
            {/* The actual layout plan image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/site/layout-plan.jpg"
              alt="Anandi Park plot layout plan"
              className="w-full h-auto block"
              draggable={false}
            />

            {/* Transparent clickable SVG overlay */}
            {showOverlay && (
              <svg
                viewBox={`0 0 100 100`}
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: 'none' }}
              >
                {plots.map((plot) => {
                  const rect = getPlotRect(plot);
                  if (!rect) return null;
                  const colors = STATUS_COLORS[plot.status] || STATUS_COLORS.AVAILABLE;
                  const isSelected = selectedPlot?.id === plot.id;

                  return (
                    <rect
                      key={plot.id}
                      x={`${rect.x}%`}
                      y={`${rect.y}%`}
                      width={`${rect.w}%`}
                      height={`${rect.h}%`}
                      fill={isSelected ? 'rgba(37,99,235,0.35)' : colors.bg}
                      stroke={isSelected ? '#2563eb' : colors.border}
                      strokeWidth={isSelected ? 0.4 : 0.15}
                      rx={0.3}
                      style={{ pointerEvents: 'all', cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); setSelectedPlot(plot); }}
                    />
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border-2 border-emerald-500 bg-emerald-500/25" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border-2 border-amber-500 bg-amber-500/30" /> Reserved</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border-2 border-red-500 bg-red-500/30" /> Sold</span>
        <span className="text-muted-foreground">Toggle overlay: click the □ button</span>
      </div>

      {/* Detail panel */}
      {selectedPlot && (
        <div className="bg-card border-2 border-blue-200 dark:border-blue-900 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" /> Plot {selectedPlot.plotNumber}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                selectedPlot.status === 'AVAILABLE' ? 'bg-emerald-500' :
                selectedPlot.status === 'RESERVED' ? 'bg-amber-500' : 'bg-red-500'
              }`}>{selectedPlot.status}</span>
              <button onClick={() => setSelectedPlot(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Area</p><p className="font-semibold">{Number(selectedPlot.area).toLocaleString()} sqft</p></div>
            <div><p className="text-xs text-muted-foreground">Dimensions</p><p className="font-semibold">{selectedPlot.dimensions || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Price</p><p className="font-semibold text-emerald-600">{formatCurrency(Number(selectedPlot.price))}</p></div>
            <div><p className="text-xs text-muted-foreground">Rate</p><p className="font-semibold">₹{Number(selectedPlot.pricePerSqFt).toLocaleString()}/sqft</p></div>
            <div><p className="text-xs text-muted-foreground">Facing</p><p className="font-semibold">{selectedPlot.facing || '—'}</p></div>
            <div><p className="text-xs text-muted-foreground">Road Facing</p><p className="font-semibold">{selectedPlot.roadFacing ? '✅ Yes' : 'No'}</p></div>
            <div><p className="text-xs text-muted-foreground">Corner</p><p className="font-semibold">{selectedPlot.corner ? '✅ Premium' : 'No'}</p></div>
            <div><p className="text-xs text-muted-foreground">Position</p><p className="font-semibold">Row {selectedPlot.row}, Col {selectedPlot.col}</p></div>
          </div>
          {selectedPlot.status === 'AVAILABLE' && (
            <div className="mt-4 flex gap-3 flex-wrap">
              <button className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                Enquire / Book
              </button>
              <a
                href={`https://wa.me/919999000001?text=${encodeURIComponent(`Hi, I am interested in plot ${selectedPlot.plotNumber} (${Number(selectedPlot.area).toLocaleString()} sqft, ${formatCurrency(Number(selectedPlot.price))}). Please share details.`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted"
              >
                WhatsApp About This Plot
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
