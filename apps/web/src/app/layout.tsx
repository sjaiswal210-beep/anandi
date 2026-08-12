import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Anandi Park | Premium Residential Plots in Wagholi, Pune',
  description: 'Anandi Park — 84 premium residential plots at Bakori, Wagholi, Pune East. Starting ₹18 Lakh. By Yuvraj Gade & Rajan Kute Developers.',
  icons: { icon: '/site/entry-gate.jpg' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
