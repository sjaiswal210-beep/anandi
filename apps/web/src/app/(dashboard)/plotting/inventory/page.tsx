'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useCallback } from 'react';
import { Map, Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const STATUS_FILL: Record<string, string> = {
  AVAILABLE: '#10b981',
  RESERVED: '#f59e0b',
  SOLD: '#ef4444',
  HOLD: '#9ca3af',
};

const STATUS_HOVER: Record<string, string> = {
  AVAILABLE: '#059669',
  RESERVED: '#d97706',
  SOLD: '#dc2626',
  HOLD: '#6b7280',
};

export default function PlotInventoryPage() {
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

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

  // Layout constants
  const CELL_W = 90;
  const CELL_H = 70;
  const GAP = 4;
  const ROAD_H = 40;
  const PAD = 30;

  const maxRow = Math.max(...plots.map((p) => p.row), 1);
  const maxCol = Math.max(...plots.map((p) => p.col), 1);

  const svgW = PAD * 2 + maxCol * (CELL_W + GAP);
  const svgH = PAD * 2 + maxRow * (CELL_H + GAP) + ROAD_H * 2;

  // Zoom/pan handlers
  const zoomIn = () => setZoom((z) => Math.min(z + 0.3, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.3, 0.5));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.plot-rect')) return;
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
    setZoom((z) => Math.min(3, Math.max(0.5, z - e.deltaY * 0.001)));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Map className="h-8 w-8 text-emerald-600" /> Plot Layout Map
          </h1>
          <p className="text-muted-foreground mt-1">Interactive map — click any plot, pinch/scroll to zoom, drag to pan</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={zoomIn} className="p-2 border rounded-lg hover:bg-muted" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={zoomOut} className="p-2 border rounded-lg hover:bg-muted" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
          <button onClick={resetView} className="p-2 border rounded-lg hover:bg-muted" aria-label="Reset view"><RotateCcw className="h-4 w-4" /></button>
          <span className="text-xs text-muted-foreground ml-2">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.available}</p>
          <p className="text-[10px] text-muted-foreground">Available</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.reserved}</p>
          <p className="text-[10px] text-muted-foreground">Reserved</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.sold}</p>
          <p className="text-[10px] text-muted-foreground">Sold</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Reserved</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500" /> Sold</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border-2 border-yellow-400 bg-transparent" /> Corner plot</span>
      </div>

      {/* Interactive Map */}
      {isLoading ? (
        <div className="bg-card border rounded-xl p-12 text-center text-sm text-muted-foreground">Loading plot layout…</div>
      ) : plots.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center text-sm text-muted-foreground">No plots loaded. Run seed-real-plots.ts.</div>
      ) : (
        <div
          className="bg-card border rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full"
            style={{
              minHeight: 400,
              maxHeight: '70vh',
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              transition: dragging ? 'none' : 'transform 0.15s ease',
            }}
          >
            {/* Roads */}
            <rect x={0} y={PAD - 5} width={svgW} height={ROAD_H} fill="#e2e8f0" rx={4} />
            <text x={svgW / 2} y={PAD + 14} textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">
              — MAIN ROAD (30 ft) —
            </text>

            <rect x={0} y={PAD + ROAD_H + maxRow * (CELL_H + GAP) + 5} width={svgW} height={ROAD_H} fill="#e2e8f0" rx={4} />
            <text x={svgW / 2} y={PAD + ROAD_H + maxRow * (CELL_H + GAP) + 24} textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">
              — INTERNAL ROAD (40 ft) —
            </text>

            {/* Plots */}
            {plots.map((plot) => {
              const x = PAD + (plot.col - 1) * (CELL_W + GAP);
              const y = PAD + ROAD_H + (plot.row - 1) * (CELL_H + GAP);
              const fill = STATUS_FILL[plot.status] || '#9ca3af';
              const isSelected = selectedPlot?.id === plot.id;

              return (
                <g
                  key={plot.id}
                  className="plot-rect"
                  onClick={(e) => { e.stopPropagation(); setSelectedPlot(plot); }}
                  style={{ cursor: 'pointer' }}
                >
                  <rect
                    x={x}
                    y={y}
                    width={CELL_W}
                    height={CELL_H}
                    rx={6}
                    fill={fill}
                    stroke={isSelected ? '#1d4ed8' : plot.corner ? '#eab308' : 'transparent'}
                    strokeWidth={isSelected ? 3 : plot.corner ? 2.5 : 0}
                    opacity={isSelected ? 1 : 0.9}
                  >
                    <title>{`${plot.plotNumber} — ${Number(plot.area).toLocaleString()} sqft — ${formatCurrency(Number(plot.price))}`}</title>
                  </rect>
                  <text x={x + CELL_W / 2} y={y + 24} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
                    {plot.plotNumber}
                  </text>
                  <text x={x + CELL_W / 2} y={y + 40} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.85)">
                    {Number(plot.area).toLocaleString()} sqft
                  </text>
                  <text x={x + CELL_W / 2} y={y + 54} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.8)">
                    {formatCurrency(Number(plot.price))}
                  </text>
                  {plot.corner && (
                    <circle cx={x + CELL_W - 8} cy={y + 8} r={4} fill="#eab308" stroke="white" strokeWidth={1} />
                  )}
                  {plot.roadFacing && (
                    <rect x={x + 3} y={y + 3} width={14} height={8} rx={2} fill="rgba(255,255,255,0.3)" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Selected Plot Detail */}
      {selectedPlot && (
        <div className="bg-card border-2 border-blue-200 dark:border-blue-900 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" /> Plot {selectedPlot.plotNumber}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                STATUS_FILL[selectedPlot.status] === '#10b981' ? 'bg-emerald-500' :
                STATUS_FILL[selectedPlot.status] === '#f59e0b' ? 'bg-amber-500' : 'bg-red-500'
              }`}>
                {selectedPlot.status}
              </span>
              <button onClick={() => setSelectedPlot(null)} className="text-xs text-muted-foreground hover:text-foreground">✕ Close</button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><p className="text-xs text-muted-foreground">Area</p><p className="font-semibold">{Number(selectedPlot.area).toLocaleString()} sqft</p></div>
            <div><p className="text-xs text-muted-foreground">Dimensions</p><p className="font-semibold">{selectedPlot.dimensions || '-'}</p></div>
            <div><p className="text-xs text-muted-foreground">Price</p><p className="font-semibold text-emerald-600">{formatCurrency(Number(selectedPlot.price))}</p></div>
            <div><p className="text-xs text-muted-foreground">Rate</p><p className="font-semibold">₹{Number(selectedPlot.pricePerSqFt).toLocaleString()}/sqft</p></div>
            <div><p className="text-xs text-muted-foreground">Facing</p><p className="font-semibold">{selectedPlot.facing || '-'}</p></div>
            <div><p className="text-xs text-muted-foreground">Road Facing</p><p className="font-semibold">{selectedPlot.roadFacing ? '✅ Yes' : 'No'}</p></div>
            <div><p className="text-xs text-muted-foreground">Corner</p><p className="font-semibold">{selectedPlot.corner ? '✅ Premium' : 'No'}</p></div>
            <div><p className="text-xs text-muted-foreground">Position</p><p className="font-semibold">Row {selectedPlot.row}, Col {selectedPlot.col}</p></div>
          </div>
          {selectedPlot.status === 'AVAILABLE' && (
            <div className="mt-5 flex gap-3">
              <a href="#contact" className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                Enquire / Book
              </a>
              <a
                href={`https://wa.me/919999000001?text=${encodeURIComponent(`Hi, I am interested in plot ${selectedPlot.plotNumber} (${Number(selectedPlot.area).toLocaleString()} sqft, ${formatCurrency(Number(selectedPlot.price))}). Please share details.`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted"
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
