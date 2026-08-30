'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Shield, MapPin, AlertCircle, CheckCircle, Navigation, Phone, Clock, Camera } from 'lucide-react';

function MobileScanPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Input states
  const [phone, setPhone] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  // Webcam & Photo states
  const [photo, setPhoto] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [usingWebcam, setUsingWebcam] = useState(false);

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

  // Control camera session based on GPS lock and punch status
  useEffect(() => {
    if (coords && !successCard) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [coords, successCard]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 300 }, height: { ideal: 300 } },
        audio: false
      });
      setStream(mediaStream);
      setUsingWebcam(true);
      // Timeout to ensure the video node is mounted in DOM
      setTimeout(() => {
        const el = document.getElementById('webcam-video') as HTMLVideoElement;
        if (el) {
          el.srcObject = mediaStream;
          el.play().catch(e => console.warn('Play interrupted:', e));
        }
      }, 150);
    } catch (err) {
      console.warn('Inline webcam access failed, using file fallback:', err);
      setUsingWebcam(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

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

  const compressAndSetPhoto = (imageSrc: string | File) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const processSrc = (src: string) => {
      img.onload = () => {
        // High-performance light-weight square compression (160x160 pixels)
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        
        if (ctx) {
          // Centered square cropping math
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          
          // Render to canvas
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          
          // Compress with 50% JPEG quality (producing ultra lightweight 5-10kb payloads)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
          setPhoto(compressedBase64);
          stopCamera();
        }
      };
      img.src = src;
    };

    if (imageSrc instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          processSrc(e.target.result as string);
        }
      };
      reader.readAsDataURL(imageSrc);
    } else {
      processSrc(imageSrc);
    }
  };

  const handleSnap = () => {
    const el = document.getElementById('webcam-video') as HTMLVideoElement;
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.width = el.videoWidth || 300;
    canvas.height = el.videoHeight || 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      compressAndSetPhoto(dataUrl);
    }
  };

  const handleFallbackCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressAndSetPhoto(file);
    }
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
    if (!photo) {
      setErrorErrorMsg('Facial verification photo is strictly required. Please take a selfie first.');
      return;
    }

    setSubmitting(true);
    setErrorErrorMsg('');
    setSuccessCard(null);

    try {
      // Send payload with GPS coordinates and compressed selfie string
      const res: any = await api.post('/hr/attendance/scan?workspaceId=anandi-park', {
        token,
        phone,
        latitude: coords.lat,
        longitude: coords.lng,
        photo: photo
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
                  <button type="button" onClick={requestLocation} className="block mt-1.5 underline text-rose-900 cursor-pointer font-bold">
                    Retry GPS Access
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success Modal Overlay */}
          {successCard && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-9 w-9" />
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                    हजेरी यशस्वीरित्या नोंदवली!
                  </h2>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">
                    Punch Completed Successfully!
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 space-y-3">
                  <p className="text-sm font-black">
                    Good {successCard.action === 'check-in' ? 'Morning' : 'Evening'}, {successCard.employeeName}!
                  </p>
                  
                  {photo && (
                    <div className="flex justify-center">
                      <img 
                        src={photo} 
                        alt="Captured Verification" 
                        className="w-24 h-28 rounded-2xl object-cover border-4 border-white dark:border-slate-800 shadow-md"
                      />
                    </div>
                  )}

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-center gap-1.5 font-bold text-slate-600 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" />
                      <span>
                        Type: <span className="text-slate-900 dark:text-white uppercase font-black">{successCard.action}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 font-bold text-slate-600 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" />
                      <span>
                        Time: <span className="text-slate-900 dark:text-white font-mono font-black">{successCard.time}</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-2">
                      📍 GPS Geofenced: {successCard.distanceMeters}m from boundary
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSuccessCard(null);
                    setPhoto(null);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg transition-colors cursor-pointer uppercase tracking-wider text-xs"
                >
                  ठीक आहे (Done)
                </button>
              </div>
            </div>
          )}

          {/* Input Form */}
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
                  className="w-full border rounded-xl p-3 bg-background text-sm font-semibold tracking-wider placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

              {/* Photo Verification Section */}
              {coords && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    Facial Verification Photo
                  </label>
                  
                  <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/30 flex flex-col items-center justify-center p-4">
                    {photo ? (
                      <div className="relative flex flex-col items-center space-y-2 w-full animate-fade-in">
                        <img 
                          src={photo} 
                          alt="Captured Selfie" 
                          className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                        />
                        <button 
                          type="button" 
                          onClick={() => { setPhoto(null); startCamera(); }}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                        >
                          Retake Photo 🤳
                        </button>
                      </div>
                    ) : usingWebcam ? (
                      <div className="relative flex flex-col items-center space-y-3 w-full">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-300 relative shadow-inner">
                          <video 
                            id="webcam-video"
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={handleSnap}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Capture Selfie 📸
                        </button>
                      </div>
                    ) : (
                      <div className="relative flex flex-col items-center justify-center py-2.5 w-full">
                        <input 
                          type="file"
                          id="fallback-camera-input"
                          accept="image/*"
                          capture="user"
                          onChange={handleFallbackCapture}
                          className="hidden"
                        />
                        <button 
                          type="button" 
                          onClick={() => document.getElementById('fallback-camera-input')?.click()}
                          className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-400 cursor-pointer transition-colors"
                        >
                          <span className="text-2xl">🤳</span>
                          <span className="text-[10px] font-black mt-1 uppercase tracking-wider text-center px-1 text-slate-500">Take Selfie</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Punch */}
              <button 
                type="submit" 
                disabled={submitting || loadingLoc}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm tracking-wide transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? 'Processing Attendance...' : !photo ? 'Snap Selfie to Proceed' : 'Punch Daily Attendance'}
              </button>
            </form>

          {/* Verification Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-2 border-t pt-3">
            <Shield className="h-3 w-3 shrink-0" />
            Secure Encrypted Session
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-400">
        © Richland Developers • Kalpdev Digitals Cloud Node
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
