'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Map, Info } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-emerald-500 hover:bg-emerald-600',
  RESERVED: 'bg-amber-500 hover:bg-amber-600',
  SOLD: 'bg-red-500 hover:bg-red-600',
  HOLD: 'bg-gray-400 hover:bg-gray-500',
};

export default function PlotInventoryPage() {
  const [selectedPlot, setSelectedPlot] = useState<any>(null);

  const { data: plotsData } = useQuery({
    queryKey: ['plot-inventory'],
    queryFn: async () => {
      // Try with workspace auth first, fallback to direct project query
      try {
        const res: any = await api.get('/properties/projects');
        const projects = res?.data || [];
        if (projects.length > 0) {
          return api.get(`/plots/project/${projects[0].id}`);
        }
      } catch {
        // If auth fails, try public endpoint directly
      }
      // Fallback: fetch all projects from plots endpoint via axios
      const ax = (await import('axios')).default;
      const baseUrl = typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':4000') : 'http://localhost:4000';
      // Get project ID from stats endpoint which is public
      const statsRes = await ax.get(`${baseUrl}/api/v1/plots/project/first`);
      return statsRes.data;
    },
  });

  const plots: any[] = (plotsData as any)?.data || [];
  const stats = {
    total: plots.length,
    available: plots.filter((p) => p.status === 'AVAILABLE').length,
    reserved: plots.filter((p) => p.status === 'RESERVED').length,
    sold: plots.filter((p) => p.status === 'SOLD').length,
  };

  // Group by rows
  const rows: Record<number, any[]> = {};
  plots.forEach((p) => {
    if (!rows[p.row]) rows[p.row] = [];
    rows[p.row].push(p);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Map className="h-8 w-8 text-primary" /> Plot Inventory
          </h1>
          <p className="text-muted-foreground mt-1">Visual map of all plots with real-time availability</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total Plots</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{stats.available}</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-600">{stats.reserved}</p>
          <p className="text-xs text-muted-foreground">Reserved</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{stats.sold}</p>
          <p className="text-xs text-muted-foreground">Sold</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-emerald-500" /> Available</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-amber-500" /> Reserved</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-500" /> Sold</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-400" /> Hold</span>
      </div>

      {/* Plot Grid */}
      <div className="bg-card border rounded-xl p-6 overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="text-center text-xs text-muted-foreground mb-4 font-medium">— MAIN ROAD —</div>
          {Object.entries(rows).sort((a, b) => Number(a[0]) - Number(b[0])).map(([row, rowPlots]) => (
            <div key={row} className="flex gap-2 mb-2 items-center">
              <span className="text-xs text-muted-foreground w-16">Row {row}</span>
              <div className="flex gap-2 flex-1">
                {rowPlots.sort((a, b) => a.col - b.col).map((plot) => (
                  <motion.button
                    key={plot.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPlot(plot)}
                    className={`flex-1 py-4 px-2 rounded-lg text-white text-xs font-medium transition-all ${statusColors[plot.status]} ${plot.corner ? 'ring-2 ring-yellow-300' : ''}`}
                    title={`${plot.plotNumber} - ${plot.area} sqft - ${formatCurrency(Number(plot.price))}`}
                  >
                    <p className="font-bold">{plot.plotNumber}</p>
                    <p className="opacity-80">{Number(plot.area).toLocaleString()} sqft</p>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
          <div className="text-center text-xs text-muted-foreground mt-4 font-medium">— INTERNAL ROAD —</div>
        </div>
      </div>

      {/* Plot Detail Panel */}
      {selectedPlot && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> Plot {selectedPlot.plotNumber}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusColors[selectedPlot.status]}`}>
              {selectedPlot.status}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-muted-foreground">Area</p><p className="font-semibold">{Number(selectedPlot.area).toLocaleString()} sqft</p></div>
            <div><p className="text-xs text-muted-foreground">Dimensions</p><p className="font-semibold">{selectedPlot.dimensions || '-'}</p></div>
            <div><p className="text-xs text-muted-foreground">Price</p><p className="font-semibold text-primary">{formatCurrency(Number(selectedPlot.price))}</p></div>
            <div><p className="text-xs text-muted-foreground">Rate</p><p className="font-semibold">₹{Number(selectedPlot.pricePerSqFt).toLocaleString()}/sqft</p></div>
            <div><p className="text-xs text-muted-foreground">Facing</p><p className="font-semibold">{selectedPlot.facing || '-'}</p></div>
            <div><p className="text-xs text-muted-foreground">Road Facing</p><p className="font-semibold">{selectedPlot.roadFacing ? '✅ Yes' : 'No'}</p></div>
            <div><p className="text-xs text-muted-foreground">Corner Plot</p><p className="font-semibold">{selectedPlot.corner ? '✅ Yes (Premium)' : 'No'}</p></div>
            <div><p className="text-xs text-muted-foreground">Position</p><p className="font-semibold">Row {selectedPlot.row}, Col {selectedPlot.col}</p></div>
          </div>
          {selectedPlot.status === 'AVAILABLE' && (
            <button className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
              Book This Plot
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
