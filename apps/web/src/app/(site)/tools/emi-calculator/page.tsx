'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator, ShieldCheck } from 'lucide-react';

export default function EmiCalculatorPage() {
  const [loanAmount, setLoanAmount] = useState<number>(2000000); // 20 Lakh
  const [interestRate, setInterestRate] = useState<number>(8.5); // 8.5%
  const [tenureYears, setTenureYears] = useState<number>(15); // 15 years

  // EMI Formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;

  const emi =
    monthlyRate === 0
      ? loanAmount / totalMonths
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - loanAmount;

  const principalPercent = Math.round((loanAmount / totalPayment) * 100) || 0;
  const interestPercent = 100 - principalPercent;

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
            <Calculator className="h-3.5 w-3.5" /> Financial Calculator
          </span>
          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            Real Estate Plot Loan EMI Calculator
          </h1>
          <p className="mt-2 text-slate-400 text-sm sm:text-base">
            Estimate monthly home/plot loan installments, total interest payable, and bank eligibility for purchasing land in Pune.
          </p>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-12">
          {/* Controls */}
          <div className="md:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-200">Plot Loan Amount (₹)</label>
                <span className="text-base font-extrabold text-amber-400">
                  ₹{loanAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min={500000}
                max={10000000}
                step={50000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>₹5 Lakh</span>
                <span>₹50 Lakh</span>
                <span>₹1 Crore</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-200">Interest Rate (% p.a.)</label>
                <span className="text-base font-extrabold text-amber-400">{interestRate}%</span>
              </div>
              <input
                type="range"
                min={6.5}
                max={15}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>6.5%</span>
                <span>8.5% (Avg Home Loan)</span>
                <span>15%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold text-slate-200">Loan Tenure (Years)</label>
                <span className="text-base font-extrabold text-amber-400">{tenureYears} Years</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1 Year</span>
                <span>15 Years</span>
                <span>30 Years</span>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="md:col-span-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase font-bold tracking-widest text-amber-400">Monthly EMI Payable</p>
              <p className="mt-2 text-3xl font-extrabold text-white">
                ₹{Math.round(emi).toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">/ month</span>
              </p>

              <div className="mt-6 space-y-4 text-sm border-t border-slate-800 pt-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">Principal Amount:</span>
                  <span className="font-bold text-white">₹{loanAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Interest Payable:</span>
                  <span className="font-bold text-amber-400">₹{Math.round(totalInterest).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800/80 pt-3">
                  <span className="text-slate-300 font-bold">Total Payable Amount:</span>
                  <span className="font-bold text-white">₹{Math.round(totalPayment).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="mt-6">
                <p className="text-xs text-slate-400 mb-1.5 flex justify-between font-medium">
                  <span>Principal: {principalPercent}%</span>
                  <span>Interest: {interestPercent}%</span>
                </p>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
                  <div className="bg-amber-500 h-full" style={{ width: `${principalPercent}%` }} />
                  <div className="bg-emerald-500 h-full" style={{ width: `${interestPercent}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <Link
                href="/contact"
                className="block text-center rounded-full bg-amber-500 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 transition-colors"
              >
                Apply for Bank Loan Tie-Up
              </Link>
            </div>
          </div>
        </div>

        {/* Informational SEO content */}
        <section className="mt-16 space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed border-t border-slate-800 pt-12">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-400" /> How Plot Loans Work in Pune (Bank Tie-Ups &amp; Eligibility)
          </h2>
          <p>
            When purchasing a residential plot at <strong>Anandi Park</strong>, buyers can leverage plot loan financing options provided by nationalized and private banking partners including <strong>SBI, HDFC Bank, ICICI Bank, and Axis Bank</strong>.
          </p>
          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h3 className="font-bold text-white text-base">Key Plot Loan Rules in Maharashtra</h3>
              <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-slate-400 list-disc pl-4">
                <li>Loan-to-Value (LTV) ratio ranges from 75% to 80% of total plot agreement value.</li>
                <li>Maximum loan tenure for land purchase is typically 15 to 20 years.</li>
                <li>Higher loan eligibility is granted for sanctioned R-Zone / PMC limits land.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h3 className="font-bold text-white text-base">Documents Required for Loan Approval</h3>
              <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-slate-400 list-disc pl-4">
                <li>Applicant KYC (Aadhaar, PAN Card, passport photos).</li>
                <li>Income proof (Last 6 months bank statements, 3 months salary slips or ITR for self-employed).</li>
                <li>Clear title papers &amp; 7/12 extract (Provided directly by Rich-Land Developers).</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}