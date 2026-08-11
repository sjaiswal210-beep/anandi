'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import api from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  // Auto-login on mount (single user setup)
  useEffect(() => {
    const init = async () => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('realtyos-auth') : null;
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.state?.token) { setReady(true); return; }
        }
        // Auto-login
        const res: any = await api.post('/auth/login', { email: 'Kalpdev@outlook.com', password: 'Kalpdev@1234' });
        // The response interceptor unwraps response.data, so the token is at res.data.accessToken or res.accessToken
        const token = res?.data?.accessToken || res?.accessToken;
        if (token) {
          localStorage.setItem('realtyos-auth', JSON.stringify({ state: { token } }));
        }
      } catch {
        // Continue without auth — public endpoints still work
      }
      setReady(true);
    };
    init();
  }, []);

  if (!ready) {
    return <div className="h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
