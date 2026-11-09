'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';

export default function StampDutyCalculatorPage() {
  const [propertyValue, setPropertyValue] = useState<number>(2500000); // 25 Lakh
  const [buyerGender, setFemaleBuyer] = useState<'male' | 'female' | 'joint'>('male');
  const [locationType, setLocationType] = useState<'pmc' | 'pmrda' | 'rural'>('pmc');

  // Base Stamp Duty Rates in Maharashtra:
  // PMC Municipal Limits: Male 7% (5% Base + 1% Metro Cess + 1% Local Body Tax/LBT), Female 6% (1% concession)
  // PMRDA / Outer: Male 6% (5% Base + 1% Cess), Female 5%
  // Rural Gram Panchayat: Male 5%, Female 4%
  let stampDutyRate = 7;
  if (locationType === 'pmc') {
    stampDutyRate = buyerGender === 'female' ? 6 : buyerGender === 'joint' ? 6.5 : 7;
  } else if (locationType === 'pmrda') {
    stampDutyRate = buyerGender === 'female' ? 5 : buyerGender === 'joint' ? 5.5 : 6;
  } else {
    stampDutyRate = buyerGender === 'female' ? 4 : buyerGender === 'joint' ? 4.5 : 5;
  }

  const stampDutyAmount = (propertyValue * stampDutyRate) / 100;
  // Registration fee in Maharashtra = 1% of property value (capped at ₹30,000)
  const registrationFee = Math.min(30000, (propertyValue * 1) / 100);
  const totalGovernmentFees = stampDutyAmount + registrationFee;

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
            <FileText className="h-3.5 w-3.5" /> Government Registration Estimator
          </span>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            Stamp Duty &amp; Registration Fee Calculator (Pune / Maharashtra)
          </h1>
          <p className="mt-2 text-slate-400 text-sm sm:text-base">
            Calculate exact stamp duty charges, Metro Cess, LBT, registration fees, and female buyer concession rebates for purchasing plots in Pune.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-12">
          {/* Controls */}
          <div className="md:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-200">Plot Agreement Value (₹)</label>
                <span className="text-base font-extrabold text-amber-400">
                  ₹{propertyValue.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min={1000000}
                max={15000000}
                step={50000}
                value={propertyValue}
                onChange={(e) => setPropertyValue(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>₹10 Lakh</span>
                <span>₹50 Lakh</span>
                <span>₹1.5 Crore</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Buyer Ownership Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'male', label: 'Male Buyer (7%)' },
                  { id: 'female', label: 'Female Buyer (6%)' },
                  { id: 'joint', label: 'Joint (Male + Female)' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setFemaleBuyer(g.id as any)}
                    className={`rounded-xl p-3 text-xs font-bold transition border ${
                      buyerGender === g.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-200 mb-2">Property Jurisdiction Zone</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pmc', label: 'PMC (Pune City)' },
                  { id: 'pmrda', label: 'PMRDA Limits' },
                  { id: 'rural', label: 'Gram Panchayat' },
                ].map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => setLocationType(loc.id as any)}
                    className={`rounded-xl p-3 text-xs font-bold transition border ${
                      locationType === loc.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="md:col-span-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase font-bold tracking-widest text-amber-400">Total Government Charges</p>
              <p className="mt-2 text-3xl font-extrabold text-white">
                ₹{Math.round(totalGovernmentFees).toLocaleString('en-IN')}
              </p>

              <div className="mt-6 space-y-4 text-sm border-t border-slate-800 pt-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">Effective Stamp Duty Rate:</span>
                  <span className="font-bold text-amber-400">{stampDutyRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stamp Duty Amount:</span>
                  <span className="font-bold text-white">₹{Math.round(stampDutyAmount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Registration Fees (Capped at ₹30,000):</span>
                  <span className="font-bold text-white">₹{Math.round(registrationFee).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {buyerGender === 'female' && (
                <div className="mt-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>1% Female buyer stamp duty concession applied (Saved ₹{(propertyValue * 0.01).toLocaleString('en-IN')})!</span>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <Link
                href="/contact"
                className="block text-center rounded-full bg-amber-500 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors"
              >
                Inquire About Ready Registration Plots
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}