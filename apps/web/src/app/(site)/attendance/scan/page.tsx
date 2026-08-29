'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Shield, MapPin, AlertCircle, CheckCircle, Navigation, Phone, Clock } from 'lucide-react';

function MobileScanPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Input states
  const [phone, setPhone] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Status states
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorErrorMsg] = useState('');
  const [successCard, setSuccessCard] = useState<any | null>(null);

  // Load phone from localStorage on mount & get GPS
  useEffect(() => {
    const saved = localStorage.getItem('realtyos_emp_phone');
    if (saved) setPhone(saved);

    requestLocation();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setErrorErrorMsg('Geolocation is not supported by your mobile browser. Please use Chrome or Safari.');
      return;
    }

    setLoadingLoc(true);
    setErrorErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoadingLoc(false);
      },
      (error) => {
        setLoadingLoc(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorErrorMsg('Location access was denied. You MUST allow location permissions in your browser settings to scan attendance.');
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorErrorMsg('GPS signal weak or unavailable. Try stepping closer to an open area.');
            break;
          case error.TIMEOUT:
            setErrorErrorMsg('GPS request timed out. Please refresh the page and try again.');
            break;
          default:
            setErrorErrorMsg('Failed to acquire secure GPS coordinates.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorErrorMsg('QR token is missing. Please scan the live QR code on the office screen.');
      return;
    }
    if (!coords) {
      setErrorErrorMsg('Secure GPS location coordinates are required. Please enable location permissions.');
      return;
    }
    if (!phone || phone.length < 10) {
      setErrorErrorMsg('Please enter a valid 10-digit registered phone number.');
      return;
    }

    setSubmitting(true);
    setErrorErrorMsg('');
    setSuccessCard(null);

    try {
      // Endpoint is fully public-facing
      const res: any = await api.post('/hr/attendance/scan?workspaceId=anandi-park', {
        token,
        phone,
        latitude: coords.lat,
        longitude: coords.lng
      });

      const responseData = res?.data || res;

      if (responseData && responseData.action) {
        // Save phone to localStorage on success
        localStorage.setItem('realtyos_emp_phone', phone);
        setSuccessCard(responseData);
      } else {
        throw new Error('Malformed API response');
      }

    } catch (err: any) {
      setErrorErrorMsg(err.response?.data?.message || 'Verification failed. This QR code might be expired. Please scan the current code.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between py-6 px-4">
      
      {/* Header */}
      <div className="text-center space-y-2 mt-4">
        <div className="mx-auto bg-emerald-500/10 dark:bg-emerald-500/15 p-2 rounded-2xl w-fit border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <Shield className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-extrabold tracking-tight">Anandi Park Site Attendance</h1>
        <p className="text-xs text-muted-foreground">Richland Developers Geofenced Verification Checkpoint</p>
      </div>

      {/* Core Form Card */}
      <div className="flex-1 flex items-center justify-center py-6">
        <div className="bg-card border text-card-foreground p-5 rounded-2xl shadow-lg w-full max-w-sm space-y-5">
          
          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span>{errorMsg}</span>
                {errorMsg.includes('permission') && (
                  <button onClick={requestLocation} className="block mt-1.5 underline text-rose-900 cursor-pointer font-bold">
                    Retry GPS Access
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success Card */}
          {successCard && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-5 rounded-xl text-center space-y-3">
              <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto shrink-0" />
              <div>
                <h3 className="font-extrabold text-base text-emerald-800">Punch Successful!</h3>
                <p className="text-sm mt-0.5 font-bold">Good {successCard.action === 'check-in' ? 'Morning' : 'Evening'}, {successCard.employeeName}!</p>
                <div className="flex items-center justify-center gap-1 text-xs text-emerald-700 font-semibold mt-3 bg-white border border-emerald-100 py-2 px-3 rounded-lg w-fit mx-auto shadow-sm">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Recorded {successCard.action === 'check-in' ? 'Check-In' : 'Check-Out'} at <span className="font-bold">{successCard.time}</span></span>
                </div>
                <p className="text-[10px] text-emerald-600 font-mono mt-3">Verified On-Site: {successCard.distanceMeters}m from center boundary</p>
              </div>
            </div>
          )}

          {/* Input Form */}
          {!successCard && (
            <form onSubmit={handlePunch} className="space-y-4">
              
              {/* Phone Field */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Registered Phone
                </label>
                <input 
                  type="tel" 
                  required 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full border rounded-xl p-3 bg-background text-sm font-semibold tracking-wider placeholder:font-normal placeholder:tracking-normal"
                />
              </div>

              {/* GPS Checker Card */}
              <div className="border bg-slate-50/50 dark:bg-slate-900/10 p-3.5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className={`h-4.5 w-4.5 shrink-0 ${coords ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-300">Secure GPS Geo-Fence</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {loadingLoc ? 'Acquiring GPS Signal...' : coords ? `Locked: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Location Required'}
                    </div>
                  </div>
                </div>
                {!coords && !loadingLoc && (
                  <button 
                    type="button" 
                    onClick={requestLocation}
                    className="p-1.5 bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200 rounded-lg cursor-pointer transition-colors"
                  >
                    <Navigation className="h-4.5 w-4.5 shrink-0" />
                  </button>
                )}
              </div>

              {/* Submit Punch */}
              <button 
                type="submit" 
                disabled={submitting || loadingLoc || !coords || !token}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm tracking-wide transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? 'Verifying Coordinates...' : loadingLoc ? 'Acquiring GPS Signal...' : 'Punch Daily Attendance'}
              </button>
            </form>
          )}

          {/* Verification Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2 border-t pt-3">
            <Shield className="h-3 w-3 shrink-0" />
            Secure Encrypted Session
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-400">
        © Richland Developers • RealtyOS Cloud Node
      </div>

    </div>
  );
}

export default function MobileScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-muted-foreground animate-pulse font-medium text-sm">Loading Secure Verification Portal...</p>
      </div>
    }>
      <MobileScanPageContent />
    </Suspense>
  );
}
