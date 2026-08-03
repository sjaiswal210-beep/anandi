import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anandi Park | Premium NA Plots by Yuraj & Rajan Developers, Pune',
  description:
    'Anandi Park offers premium NA plots from 1000 to 5000 sq.ft in Pune. Clear titles, RERA registered, ready for registration. Starting at ₹15 Lac. By Yuraj & Rajan Developers.',
  keywords: [
    'Anandi Park',
    'NA plots Pune',
    'plots for sale Pune',
    'Yuraj Rajan Developers',
    'RERA registered plots',
  ],
  openGraph: {
    title: 'Anandi Park - Premium NA Plots, Pune',
    description: 'Premium NA plots starting at ₹15 Lac. RERA registered. By Yuraj & Rajan Developers.',
    type: 'website',
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-slate-950">{children}</div>;
}
