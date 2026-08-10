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

  // Zoom/pan
  const zoomIn = () => setZoom((z) => Math.min(z + 0.3, 4));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.3, 0.4));
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.plot-g')) return;
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
    setZoom((z) => Math.min(4, Math.max(0.4, z - e.deltaY * 0.001)));
  }, []);

  // Build layout matching the physical plan (IMG_3389).
  // Each plot gets width proportional to its area relative to its row's total.
  // This makes the proportions match the actual drawing exactly.
  const ROW_W = 800; // total usable width for plots per row
  const PLOT_H = 56; // height per plot row
  const GAP = 2;
  const ROAD_H = 28;
  const PAD_X = 40;
  const PAD_Y = 30;

  // Group by row, sorted by col within each row.
  const rowMap: Record<number, any[]> = {};
  plots.forEach((p) => { if (!rowMap[p.row]) rowMap[p.row] = []; rowMap[p.row].push(p); });
  Object.values(rowMap).forEach((r) => r.sort((a: any, b: any) => a.col - b.col));
  const sortedRows = Object.keys(rowMap).map(Number).sort((a, b) => a - b);

  // SVG dimensions
  const svgW = ROW_W + PAD_X * 2;
  const numRows = sortedRows.length;
  // 3 roads: top, internal (between 6 & 7), bottom
  const svgH = PAD_Y * 2 + numRows * (PLOT_H + GAP) + ROAD_H * 3 + GAP * 6;

  // Build the SVG elements
  const buildLayout = () => {
    const els: JSX.Element[] = [];
    let y = PAD_Y;

    // --- TOP ROAD (30 ft boundary) ---
    els.push(
      <g key="road-top">
        <rect x={PAD_X - 10} y={y} width={ROW_W + 20} height={ROAD_H} fill="#94a3b8" rx={3} />
        <text x={PAD_X + ROW_W / 2} y={y + 18} textAnchor="middle" fontSize="9" fill="white" fontWeight="600">
          30 FT ROAD (NORTH BOUNDARY)
        </text>
      </g>,
    );
    y += ROAD_H + GAP * 2;

    for (const rowIdx of sortedRows) {
      // Insert 40ft internal road between rows 6 and 7
      if (rowIdx === 7) {
        els.push(
          <g key="road-mid">
            <rect x={PAD_X - 10} y={y} width={ROW_W + 20} height={ROAD_H} fill="#64748b" rx={3} />
            <text x={PAD_X + ROW_W / 2} y={y + 18} textAnchor="middle" fontSize="9" fill="white" fontWeight="600">
              40 FT INTERNAL ROAD
            </text>
          </g>,
        );
        y += ROAD_H + GAP * 2;
      }

      const rowPlots = rowMap[rowIdx];
      const totalArea = rowPlots.reduce((s: number, p: any) => s + Number(p.area), 0);
      const totalGaps = (rowPlots.length - 1) * GAP;
      const availW = ROW_W - totalGaps;

      let x = PAD_X;

      for (const plot of rowPlots) {
        const area = Number(plot.area);
        const w = Math.round((area / totalArea) * availW);
        const fill = STATUS_FILL[plot.status] || '#9ca3af';
        const isSelected = selectedPlot?.id === plot.id;

        els.push(
          <g
            key={plot.id}
            className="plot-g"
            onClick={(e) => { e.stopPropagation(); setSelectedPlot(plot); }}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={x} y={y} width={w} height={PLOT_H} rx={3}
              fill={fill}
              stroke={isSelected ? '#1d4ed8' : plot.corner ? '#eab308' : '#f8fafc'}
              strokeWidth={isSelected ? 2.5 : plot.corner ? 2 : 0.5}
              opacity={isSelected ? 1 : 0.92}
            />
            {/* Plot number */}
            <text x={x + w / 2} y={y + 16} textAnchor="middle" fontSize={w < 45 ? '7' : '9'} fontWeight="700" fill="white">
              {plot.plotNumber}
            </text>
            {/* Area */}
            <text x={x + w / 2} y={y + 30} textAnchor="middle" fontSize={w < 45 ? '6' : '7.5'} fill="rgba(255,255,255,0.9)">
              {Number(plot.area).toLocaleString()}
            </text>
            {/* Dimensions or price depending on space */}
            {w >= 55 && (
              <text x={x + w / 2} y={y + 42} textAnchor="middle" fontSize="6.5" fill="rgba(255,255,255,0.75)">
                {plot.dimensions ? plot.dimensions.split(' x ')[0] : ''}
              </text>
            )}
            {/* Corner triangle */}
            {plot.corner && (
              <polygon
                points={`${x + w - 10},${y} ${x + w},${y} ${x + w},${y + 10}`}
                fill="#eab308"
              />
            )}
            {/* Road-facing indicator: thin line at edge */}
            {plot.roadFacing && rowIdx <= 2 && (
              <rect x={x} y={y} width={w} height={2} fill="rgba(255,255,255,0.5)" rx={1} />
            )}
            {plot.roadFacing && rowIdx >= 7 && (
              <rect x={x} y={y + PLOT_H - 2} width={w} height={2} fill="rgba(255,255,255,0.5)" rx={1} />
            )}
          </g>,
        );
        x += w + GAP;
      }
      y += PLOT_H + GAP;
    }

    // --- BOTTOM ROAD (Wagholi-Bakori) ---
    els.push(
      <g key="road-bot">
        <rect x={PAD_X - 10} y={y + GAP} width={ROW_W + 20} height={ROAD_H} fill="#334155" rx={3} />
        <text x={PAD_X + ROW_W / 2} y={y + GAP + 18} textAnchor="middle" fontSize="9" fill="white" fontWeight="600">
          WAGHOLI — BAKORI ROAD (30 FT)
        </text>
      </g>,
    );

    return els;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Map className="h-8 w-8 text-emerald-600" /> Plot Layout
          </h1>
          <p className="text-muted-foreground mt-1">Interactive map — tap a plot, pinch to zoom, drag to pan</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={zoomIn} className="p-2 border rounded-lg hover:bg-muted" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={zoomOut} className="p-2 border rounded-lg hover:bg-muted" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
          <button onClick={resetView} className="p-2 border rounded-lg hover:bg-muted" aria-label="Reset"><RotateCcw className="h-4 w-4" /></button>
          <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
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
      <div className="flex items-center gap-5 text-xs flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-500" /> Reserved</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500" /> Sold</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border-2 border-yellow-400" /> Corner</span>
        <span className="text-muted-foreground">N ↑</span>
      </div>

      {/* Map */}
      {isLoading ? (
        <div className="bg-card border rounded-xl p-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : plots.length === 0 ? (
        <div className="bg-card border rounded-xl p-16 text-center text-sm text-muted-foreground">No plots. Run seed-real-plots.ts.</div>
      ) : (
        <div
          className="bg-white dark:bg-slate-900 border rounded-xl overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
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
            preserveAspectRatio="xMidYMid meet"
            style={{
              minHeight: 450,
              maxHeight: '75vh',
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              transition: dragging ? 'none' : 'transform 0.12s ease-out',
            }}
          >
            {plots.length > 0 && buildLayout()}

            {/* North arrow */}
            <g transform={`translate(${svgW - 35}, ${PAD_Y + ROAD_H + 10})`}>
              <polygon points="0,16 5,0 10,16" fill="#334155" opacity={0.6} />
              <text x={5} y={24} textAnchor="middle" fontSize="7" fill="#334155" fontWeight="600">N</text>
            </g>
          </svg>
        </div>
      )}

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
