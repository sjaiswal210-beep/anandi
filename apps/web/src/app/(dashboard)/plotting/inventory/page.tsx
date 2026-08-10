'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Map, Info, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const STATUS_STYLES: Record<string, { fill: string; stroke: string }> = {
  AVAILABLE: { fill: '#ecfdf5', stroke: '#059669' },
  RESERVED: { fill: '#fffbeb', stroke: '#d97706' },
  SOLD: { fill: '#fef2f2', stroke: '#dc2626' },
  HOLD: { fill: '#f3f4f6', stroke: '#6b7280' },
};

export default function PlotInventoryPage() {
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  // Layout: engineering-drawing style. Each plot drawn as outlined rect
  // with width proportional to actual area within its row.
  const PLOT_H = 68;
  const ROW_GAP = 2;
  const ROAD_H = 32;
  const PAD = 24;
  const TOTAL_W = 960;

  const rowMap: Record<number, any[]> = {};
  plots.forEach((p) => { if (!rowMap[p.row]) rowMap[p.row] = []; rowMap[p.row].push(p); });
  Object.values(rowMap).forEach((r) => r.sort((a: any, b: any) => a.col - b.col));
  const sortedRows = Object.keys(rowMap).map(Number).sort((a, b) => a - b);

  const numRows = sortedRows.length;
  const SVG_W = TOTAL_W + PAD * 2;
  const SVG_H = PAD * 2 + numRows * (PLOT_H + ROW_GAP) + ROAD_H * 3 + 40;

  const renderLayout = () => {
    const els: JSX.Element[] = [];
    let y = PAD;

    // Top road
    els.push(
      <g key="road-top">
        <rect x={PAD} y={y} width={TOTAL_W} height={ROAD_H} fill="none" stroke="#1e293b" strokeWidth={1.5} />
        {/* Hatching */}
        <pattern id="hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="0.5" />
        </pattern>
        <rect x={PAD} y={y} width={TOTAL_W} height={ROAD_H} fill="url(#hatch)" />
        <text x={PAD + TOTAL_W / 2} y={y + 20} textAnchor="middle" fontSize="11" fill="#1e293b" fontWeight="600">
          30&apos; WIDE ROAD
        </text>
      </g>,
    );
    y += ROAD_H + 4;

    for (const rowIdx of sortedRows) {
      // Internal road between row 6 and 7
      if (rowIdx === 7) {
        els.push(
          <g key="road-mid">
            <rect x={PAD} y={y} width={TOTAL_W} height={ROAD_H} fill="none" stroke="#1e293b" strokeWidth={1.5} />
            <rect x={PAD} y={y} width={TOTAL_W} height={ROAD_H} fill="url(#hatch)" />
            <text x={PAD + TOTAL_W / 2} y={y + 20} textAnchor="middle" fontSize="11" fill="#1e293b" fontWeight="600">
              40&apos; INTERNAL ROAD
            </text>
          </g>,
        );
        y += ROAD_H + 4;
      }

      const rowPlots = rowMap[rowIdx];
      const totalArea = rowPlots.reduce((s: number, p: any) => s + Number(p.area), 0);
      const plotGaps = (rowPlots.length - 1) * 1.5;
      const usableW = TOTAL_W - plotGaps;

      // Outer boundary for the row
      els.push(
        <rect
          key={`row-border-${rowIdx}`}
          x={PAD} y={y} width={TOTAL_W} height={PLOT_H}
          fill="none" stroke="#334155" strokeWidth={1.2}
        />,
      );

      let x = PAD;
      for (let i = 0; i < rowPlots.length; i++) {
        const plot = rowPlots[i];
        const area = Number(plot.area);
        const w = Math.round((area / totalArea) * usableW);
        const style = STATUS_STYLES[plot.status] || STATUS_STYLES.AVAILABLE;
        const isSelected = selectedPlot?.id === plot.id;

        els.push(
          <g
            key={plot.id}
            onClick={() => setSelectedPlot(plot)}
            style={{ cursor: 'pointer' }}
          >
            {/* Plot outline */}
            <rect
              x={x} y={y} width={w} height={PLOT_H}
              fill={isSelected ? '#dbeafe' : style.fill}
              stroke={isSelected ? '#2563eb' : style.stroke}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* Corner marker */}
            {plot.corner && (
              <path
                d={`M${x},${y} L${x + 12},${y} L${x},${y + 12} Z`}
                fill="#eab308"
              />
            )}
            {/* Plot number — bold, centered */}
            <text
              x={x + w / 2} y={y + 18}
              textAnchor="middle" fontSize={w < 40 ? '8' : '11'}
              fontWeight="700" fill="#1e293b"
            >
              {plot.plotNumber}
            </text>
            {/* Area */}
            <text
              x={x + w / 2} y={y + 33}
              textAnchor="middle" fontSize={w < 40 ? '6.5' : '9'}
              fill="#475569"
            >
              {Number(plot.area).toLocaleString()} sqft
            </text>
            {/* Dimensions */}
            {w >= 55 && plot.dimensions && (
              <text
                x={x + w / 2} y={y + 46}
                textAnchor="middle" fontSize="7" fill="#64748b"
              >
                {plot.dimensions}
              </text>
            )}
            {/* Facing indicator */}
            {w >= 50 && (
              <text
                x={x + w / 2} y={y + 59}
                textAnchor="middle" fontSize="6.5" fill="#94a3b8"
              >
                {plot.facing}
              </text>
            )}
          </g>,
        );

        x += w + 1.5;
      }
      y += PLOT_H + ROW_GAP;
    }

    // Bottom road — Wagholi-Bakori
    els.push(
      <g key="road-bot">
        <rect x={PAD} y={y + 2} width={TOTAL_W} height={ROAD_H} fill="none" stroke="#1e293b" strokeWidth={1.5} />
        <rect x={PAD} y={y + 2} width={TOTAL_W} height={ROAD_H} fill="url(#hatch)" />
        <text x={PAD + TOTAL_W / 2} y={y + 22} textAnchor="middle" fontSize="11" fill="#1e293b" fontWeight="600">
          WAGHOLI — BAKORI ROAD (30&apos;)
        </text>
      </g>,
    );

    // Title block (engineering drawing style)
    els.push(
      <g key="title">
        <text x={PAD + TOTAL_W / 2} y={SVG_H - 8} textAnchor="middle" fontSize="10" fill="#64748b">
          ANANDI PARK — GAT NO. 279, VILLAGE BAKORI, TALUKA HAVELI, PUNE — LAYOUT PLAN
        </text>
      </g>,
    );

    return els;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="h-7 w-7 text-emerald-600" /> Plot Layout
          </h1>
          <p className="text-muted-foreground text-sm">Tap any plot · scroll to zoom · drag to pan</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={zoomIn} className="p-2 border rounded-lg hover:bg-muted"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={zoomOut} className="p-2 border rounded-lg hover:bg-muted"><ZoomOut className="h-4 w-4" /></button>
          <button onClick={resetView} className="p-2 border rounded-lg hover:bg-muted"><RotateCcw className="h-4 w-4" /></button>
          <span className="text-xs text-muted-foreground ml-1">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-card border rounded-lg p-2 text-center"><p className="text-lg font-bold">{stats.total}</p><p className="text-[9px] text-muted-foreground">Total</p></div>
        <div className="border rounded-lg p-2 text-center" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}><p className="text-lg font-bold text-emerald-700">{stats.available}</p><p className="text-[9px] text-muted-foreground">Available</p></div>
        <div className="border rounded-lg p-2 text-center" style={{ background: '#fffbeb', borderColor: '#fde68a' }}><p className="text-lg font-bold text-amber-700">{stats.reserved}</p><p className="text-[9px] text-muted-foreground">Reserved</p></div>
        <div className="border rounded-lg p-2 text-center" style={{ background: '#fef2f2', borderColor: '#fecaca' }}><p className="text-lg font-bold text-red-700">{stats.sold}</p><p className="text-[9px] text-muted-foreground">Sold</p></div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-emerald-600" style={{ background: '#ecfdf5' }} /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-amber-600" style={{ background: '#fffbeb' }} /> Reserved</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-red-600" style={{ background: '#fef2f2' }} /> Sold</span>
        <span className="flex items-center gap-1.5"><span className="w-0 h-0 border-l-[6px] border-l-yellow-500 border-b-[6px] border-b-transparent" /> Corner</span>
        <span className="text-muted-foreground ml-auto">N ↑</span>
      </div>

      {/* SVG Layout Drawing */}
      {isLoading ? (
        <div className="bg-white border rounded-xl p-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : plots.length === 0 ? (
        <div className="bg-white border rounded-xl p-16 text-center text-sm text-muted-foreground">No plots loaded.</div>
      ) : (
        <div
          className="bg-white border rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            preserveAspectRatio="xMidYMid meet"
            style={{
              minHeight: 500,
              maxHeight: '78vh',
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              transition: dragging ? 'none' : 'transform 0.12s ease-out',
            }}
          >
            <defs>
              <pattern id="hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="0.5" />
              </pattern>
            </defs>
            {renderLayout()}
          </svg>
        </div>
      )}

      {/* Detail panel */}
      {selectedPlot && (
        <div className="bg-card border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5">
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
              <button className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">Enquire / Book</button>
              <a
                href={`https://wa.me/919999000001?text=${encodeURIComponent(`Hi, I am interested in plot ${selectedPlot.plotNumber} (${Number(selectedPlot.area).toLocaleString()} sqft, ${formatCurrency(Number(selectedPlot.price))}). Please share details.`)}`}
                target="_blank" rel="noreferrer"
                className="px-5 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted"
              >WhatsApp About This Plot</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
