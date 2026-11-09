import type { Metadata } from 'next';
import Link from 'next/link';
import { Calculator, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Real Estate Tools & Plot Calculators',
  description:
    'Free online real estate tools: Plot Loan EMI Calculator, Stamp Duty & Registration Fee Calculator (Pune/Maharashtra), and Land Unit Converter (Guntha to Sq Ft).',
  alternates: { canonical: 'https://anandipark.in/tools' },
};

export default function ToolsHubPage() {
  const tools = [
    {
      title: 'Plot Loan EMI Calculator',
      description:
        'Calculate monthly EMI payments, total interest payable, and loan amortization schedule for land and construction loans.',
      href: '/tools/emi-calculator',
      icon: Calculator,
      badge: 'Popular',
    },
    {
      title: 'Stamp Duty & Registration Calculator (Pune)',
      description:
        'Estimate total Maharashtra government stamp duty, Metro Cess, Local Body Tax (LBT), and registration fees for Pune plots.',
      href: '/tools/stamp-duty-calculator',
      icon: FileText,
      badge: 'Government Rates',
    },
    {
      title: 'Land Area Converter (Guntha ↔ Sq Ft)',
      description:
        'Convert land area units instantly across Indian measurements: Guntha, Square Feet, Square Meters, Acres, and Hectares.',
      href: '/tools/plot-area-converter',
      icon: ShieldCheck,
      badge: 'Instant Utility',
    },
  ];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen pt-28 pb-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-400">
            <Calculator className="h-3.5 w-3.5" /> Interactive Real Estate Utilities
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl text-white">
            Free Real Estate &amp; Plot Purchase Calculators
          </h1>
          <p className="mt-4 text-base text-slate-400 leading-relaxed">
            Free tools developed by Rich-Land Developers to help buyers evaluate home loans, government registration fees, and land measurements in Pune East.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.href}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg transition hover:border-amber-500/50 hover:shadow-amber-500/10"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                      {t.badge}
                    </span>
                  </div>
                  <h2 className="mt-6 text-xl font-bold text-white">{t.title}</h2>
                  <p className="mt-3 text-sm text-slate-400 leading-relaxed">{t.description}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                  <Link
                    href={t.href}
                    className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-amber-300"
                  >
                    Open Calculator <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}