'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PlotAreaConverterPage() {
  const [value, setValue] = useState<number>(1);
  const [fromUnit, setFromUnit] = useState<string>('guntha');

  // Conversion factors relative to 1 Square Foot
  // 1 Guntha = 1089 Sq Ft
  // 1 Sq Meter = 10.7639 Sq Ft
  // 1 Sq Yard = 9 Sq Ft
  // 1 Acre = 43560 Sq Ft (40 Gunthas)
  // 1 Hectare = 107639 Sq Ft (2.471 Acres)
  const factorsInSqFt: Record<string, number> = {
    sqft: 1,
    guntha: 1089,
    sqmeter: 10.7639,
    sqyard: 9,
    acre: 43560,
    hectare: 107639,
  };

  const sqFtValue = value * (factorsInSqFt[fromUnit] || 1);

  const conversions = [
    { unit: 'Guntha', value: sqFtValue / 1089, note: 'Primary land unit in Maharashtra (1 Guntha = 1,089 sq ft)' },
    { unit: 'Square Feet (Sq Ft)', value: sqFtValue, note: 'Standard residential plot measurement' },
    { unit: 'Square Meters (Sq M)', value: sqFtValue / 10.7639, note: 'Architectural & town planning metric' },
    { unit: 'Square Yards (Gaj)', value: sqFtValue / 9, note: 'Common northern India plot unit' },
    { unit: 'Acre', value: sqFtValue / 43560, note: '1 Acre = 40 Gunthas = 43,560 sq ft' },
    { unit: 'Hectare', value: sqFtValue / 107639, note: '1 Hectare = 2.471 Acres = 100 Gunthas' },
  ];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-5xl px-5">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Tools
        </Link>

        <div className="mt-6 text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Indian Land Converter
          </span>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            Land Area Converter (Guntha ↔ Sq Ft ↔ Acre)
          </h1>
          <p className="mt-2 text-slate-400 text-sm sm:text-base">
            Convert land area units used across Maharashtra real estate: Guntha, Square Feet, Square Meters, Square Yards, Acres, and Hectares.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Enter Quantity</label>
              <input
                type="number"
                min={0}
                value={value}
                onChange={(e) => setValue(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg font-bold text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Select Source Unit</label>
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
              >
                <option value="guntha">Guntha (1,089 sq ft)</option>
                <option value="sqft">Square Feet (sq ft)</option>
                <option value="sqmeter">Square Meters (sq m)</option>
                <option value="sqyard">Square Yards (sq yd / gaj)</option>
                <option value="acre">Acre (40 Gunthas)</option>
                <option value="hectare">Hectare (100 Gunthas)</option>
              </select>
            </div>
          </div>

          {/* Output Grid */}
          <div className="mt-10 border-t border-slate-800 pt-8">
            <h2 className="text-xl font-bold text-white mb-6">Converted Area Measurements</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {conversions.map((c) => (
                <div
                  key={c.unit}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-5 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">{c.unit}</span>
                    <p className="mt-1 text-2xl font-extrabold text-amber-400">
                      {c.value < 0.01
                        ? c.value.toFixed(4)
                        : c.value % 1 === 0
                        ? c.value.toLocaleString('en-IN')
                        : c.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <p className="mt-3 text-xs text-slate-400 border-t border-slate-900 pt-2">{c.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}