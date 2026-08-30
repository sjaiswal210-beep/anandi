'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { QrCode, Shield, Clock, CheckCircle, Home, ExternalLink } from 'lucide-react';

export default function HrQrTerminalPage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [token, setToken] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [tickerLogs, setTickerLogs] = useState<any[]>([]);

  // 1. Clock ticker
  useEffect(() => {
    const clockInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // 2. Silent login and loop triggers on mount
  useEffect(() => {
    const runKioskAuthAndLoad = async () => {
      try {
        // Authenticate background session so API requests fetch seamlessly on raw kiosks
        const res: any = await api.post('/auth/login', { email: 'Kalpdev@outlook.com', password: 'Kalpdev@1234' });
        const accessToken = res?.data?.accessToken || res?.accessToken;
        if (accessToken) {
          localStorage.setItem('realtyos-auth', JSON.stringify({ state: { token: accessToken } }));
        }
      } catch (err) {
        console.error('Silent kiosk login restore failed:', err);
      } finally {
        setCheckingSession(false);
      }
    };
    runKioskAuthAndLoad();
  }, []);

  // 3. Start fetching and intervals after authentication is ready
  useEffect(() => {
    if (checkingSession) return;

    fetchToken();
    fetchTodayLogs();

    const tokenInterval = setInterval(() => {
      fetchToken();
    }, 15000);

    const logsInterval = setInterval(() => {
      fetchTodayLogs();
    }, 10000);

    return () => {
      clearInterval(tokenInterval);
      clearInterval(logsInterval);
    };
  }, [checkingSession]);

  // 4. Countdown timer ticker
  useEffect(() => {
    if (!expiresAt) return;

    const timer = setInterval(() => {
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.round((expiry - Date.now()) / 1000));
      setTimeRemaining(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const fetchToken = async () => {
    try {
      const res: any = await api.get('/hr/attendance/qr');
      if (res?.token || res?.data?.token) {
        setToken(res.token || res.data.token);
        setExpiresAt(res.expiresAt || res.data.expiresAt);
      }
    } catch (e) {
      console.error('Error fetching terminal QR token:', e);
    }
  };

  const fetchTodayLogs = async () => {
    try {
      const res: any = await api.get('/hr/attendance/logs');
      const todayString = new Date().toISOString().split('T')[0];
      const todayLogs = (res?.data || res || []).filter((log: any) => log.date.startsWith(todayString));
      setTickerLogs(todayLogs.slice(0, 5)); // show latest 5
    } catch (e) {
      console.error(e);
    }
  };

  // Base mobile scan URL
  const scanUrl = `https://anandipark.in/attendance/scan?token=${token}`;
  const qrImageUrl = token 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(scanUrl)}`
    : '';

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-400">Authenticating Kiosk Wall Terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 md:p-12 font-sans select-none">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/15 p-2 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-slate-100">Anandi Park Terminal</h1>
            <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Secure GPS Attendance Checkpoint</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2">
            <a 
              href="/hr-portal" 
              className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              HR Portal
            </a>
          </div>
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-black font-mono tracking-tight text-slate-100">{currentTime || '--:--:--'}</div>
            <div className="text-xs text-slate-400 mt-1 font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>
      </div>

      {/* Core Center Column */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 max-w-7xl mx-auto w-full py-8">
        
        {/* QR Core Box */}
        <div className="flex flex-col items-center space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden shrink-0 max-w-sm w-full">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse" />
          
          <div className="bg-white p-4 rounded-2xl shadow-inner relative">
            {qrImageUrl ? (
              <img 
                src={qrImageUrl} 
                alt="Secure Scan QR" 
                className="w-64 h-64 select-none object-contain"
                draggable={false}
              />
            ) : (
              <div className="w-64 h-64 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 animate-pulse">
                <Clock className="h-10 w-10 shrink-0" />
              </div>
            )}
          </div>

          <div className="text-center w-full">
            <div className="flex items-center justify-center gap-2 text-sm font-bold tracking-widest uppercase">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400">Rolling QR Active</span>
            </div>
            
            <p className="text-xs text-slate-400 mt-2 font-medium max-w-xs mx-auto">
              Scan using your mobile device camera to punch In / Out. This code expires in:
            </p>
            
            <div className="text-2xl font-mono font-black text-slate-100 mt-1.5">
              {timeRemaining}s
            </div>
          </div>
        </div>

        {/* Instructions / Presence Stream */}
        <div className="flex-1 space-y-6 max-w-lg">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-300">How to punch attendance:</h2>
            <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2.5 leading-relaxed">
              <li>Open your smartphone camera or any QR scanner.</li>
              <li>Scan the rolling QR code shown on this tablet.</li>
              <li>Allow browser <span className="text-emerald-400 font-bold">GPS/Location permissions</span> when prompted.</li>
              <li>Select <span className="text-slate-100 font-bold">Check In</span> or <span className="text-slate-100 font-bold">Check Out</span> to record your punch on-site!</li>
            </ol>
          </div>

          {/* Real-time Presence Stream */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Recent Checks Today</h3>
            <div className="space-y-2">
              {tickerLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No logs recorded today yet.</p>
              ) : (
                tickerLogs.map((log) => (
                  <div key={log.id} className="bg-slate-900/30 border border-slate-800/40 rounded-xl p-3.5 flex items-center justify-between text-xs transition-all hover:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-400 shrink-0">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{log.employee?.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{log.employee?.designation} • {log.employee?.department}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2 py-1 rounded">
                        {log.checkOut 
                          ? `Out: ${new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : `In: ${new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="text-center text-xs text-slate-500 border-t border-slate-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>Richland Developers HQ • Powered by RealtyOS Biometric Checkpoint System</span>
        <a href="/hr-portal" className="sm:hidden text-slate-400 hover:text-white underline font-semibold">Go to HR Portal</a>
      </div>

    </div>
  );
}
