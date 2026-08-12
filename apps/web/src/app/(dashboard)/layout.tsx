'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import api from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState(false);

  // Dashboard password gate
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const unlocked = sessionStorage.getItem('dashboard-unlocked');
      if (unlocked === 'yes') setLocked(false);
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Kalpdev@1994') {
      setLocked(false);
      setPwError(false);
      sessionStorage.setItem('dashboard-unlocked', 'yes');
    } else {
      setPwError(true);
    }
  };

  // Auto-login on mount (single user setup)
  useEffect(() => {
    if (locked) return;
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
  }, [locked]);

  if (locked) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 p-6">
        <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Anandi Park</h1>
            <p className="text-sm text-slate-400 mt-1">Dashboard Access</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
            placeholder="Enter password"
            autoFocus
            className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          {pwError && <p className="text-sm text-red-400 text-center">Wrong password</p>}
          <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
            Enter Dashboard
          </button>
        </form>
      </div>
    );
  }

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
