import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Anandi Park | Premium Residential Plots in Wagholi, Pune',
  description: 'Anandi Park — 84 premium residential plots at Bakori, Wagholi, Pune East. Starting ₹18 Lakh. By Rich-Land Developers (Yuvraj Gade & Rajan Kute).',
  icons: {
    icon: [
      { url: '/brand/favicon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/brand/apple-touch-icon.png',
  },
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
