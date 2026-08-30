'use client';

import { useState, useEffect, Suspense } from 'react';
import api from '@/lib/api';
import { 
  Shield, 
  Phone, 
  User, 
  Calendar, 
  Clock, 
  FileSpreadsheet, 
  LogOut, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Menu, 
  X,
  CreditCard,
  Briefcase
} from 'lucide-react';

function WorkerPortalContent() {
  // Authentication / Profile state
  const [phone, setPhone] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [authError, setAuthError] = useState('');

  // Core Data
  const [employee, setEmployee] = useState<any | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payrolls, setPayrolls] = useState<any[]>([]);

  // Sub-navigation tabs
  const [currentTab, setCurrentTab] = useState<'profile' | 'attendance' | 'leaves' | 'payroll'>('profile');
  
  // Leave request form states
  const [leaveForm, setLeaveForm] = useState({
    type: 'CASUAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState(false);
  const [leaveError, setLeaveError] = useState('');

  // 1. Check local storage for session on mount
  useEffect(() => {
    const savedPhone = localStorage.getItem('realtyos_worker_phone');
    if (savedPhone) {
      setPhone(savedPhone);
      fetchWorkerData(savedPhone);
    }
  }, []);

  // 2. Fetch worker data
  const fetchWorkerData = async (workerPhone: string) => {
    setCheckingPhone(true);
    setAuthError('');
    try {
      const getDeviceDetails = () => {
        if (typeof window === 'undefined') return 'Unknown';
        const ua = navigator.userAgent;
        let os = 'Unknown OS';
        if (/android/i.test(ua)) os = 'Android';
        else if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) os = 'iOS';
        else if (/windows/i.test(ua)) os = 'Windows';
        else if (/macintosh/i.test(ua)) os = 'Mac';
        
        let brand = '';
        if (/samsung|sm-/i.test(ua)) brand = 'Samsung ';
        else if (/oneplus/i.test(ua)) brand = 'OnePlus ';
        else if (/pixel/i.test(ua)) brand = 'Google Pixel ';
        else if (/xiaomi|mi |redmi/i.test(ua)) brand = 'Xiaomi ';
        else if (/oppo/i.test(ua)) brand = 'Oppo ';
        else if (/vivo/i.test(ua)) brand = 'Vivo ';

        let browser = 'Browser';
        if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua)) browser = 'Chrome';
        else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
        else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
        else if (/edge|edg/i.test(ua)) browser = 'Edge';
        
        return `${brand}${os} (${browser})`;
      };

      const device = getDeviceDetails();
      const res: any = await api.get(`/hr/worker-portal?phone=${workerPhone}&device=${encodeURIComponent(device)}`);
      const data = res?.data || res;
      if (data && data.employee) {
        setEmployee(data.employee);
        setAttendance(data.attendance || []);
        setLeaves(data.leaves || []);
        setPayrolls(data.payrolls || []);
        setIsLoggedIn(true);
        localStorage.setItem('realtyos_worker_phone', workerPhone);
      } else {
        throw new Error('No profile data returned');
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Failed to authenticate phone number. Make sure your number is registered by HR.');
      setIsLoggedIn(false);
    } finally {
      setCheckingPhone(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setAuthError('Please enter a valid 10-digit phone number.');
      return;
    }
    fetchWorkerData(phone);
  };

  const handleLogout = () => {
    localStorage.removeItem('realtyos_worker_phone');
    setEmployee(null);
    setAttendance([]);
    setLeaves([]);
    setPayrolls([]);
    setIsLoggedIn(false);
    setPhone('');
  };

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingLeave(true);
    setLeaveError('');
    setLeaveSuccess(false);

    try {
      await api.post('/hr/worker-portal/leave', {
        phone,
        ...leaveForm
      });
      setLeaveSuccess(true);
      setLeaveForm({
        type: 'CASUAL',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: ''
      });
      // Refresh logs
      fetchWorkerData(phone);
    } catch (err: any) {
      setLeaveError(err.response?.data?.message || 'Failed to request leave.');
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Login View
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6">
        <div className="text-center space-y-3 mt-12">
          <div className="mx-auto bg-emerald-500/10 p-2.5 rounded-2xl w-fit border border-emerald-500/20 text-emerald-400">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider">Worker Self-Service</h1>
          <p className="text-sm text-slate-400 max-w-xs mx-auto">
            Anandi Park employee portal. Enter your 10-digit phone number configured in HR records.
          </p>
        </div>

        <div className="flex-1 flex items-center justify-center py-10">
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl w-full max-w-sm space-y-5 shadow-2xl">
            
            {authError && (
              <div className="bg-rose-950/20 border border-rose-900/50 text-rose-400 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  Mobile Phone Number
                </label>
                <input 
                  type="tel" 
                  required 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full border border-slate-800 rounded-xl p-3.5 bg-slate-900 text-sm font-semibold tracking-widest placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button 
                type="submit" 
                disabled={checkingPhone || !phone || phone.length < 10}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm tracking-wide transition-all disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center"
              >
                {checkingPhone ? 'Authenticating...' : 'Enter Worker Portal'}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-500">
          Powered by Richland Developers Kalpdev Digitals
        </div>
      </div>
    );
  }

  // Active Today's Punch Card Helper
  const getTodayStatus = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLog = attendance.find(log => log.date.startsWith(todayStr));
    if (!todayLog) return { label: 'Absent / Unrecorded', color: 'bg-rose-500/15 text-rose-400 border-rose-500/20' };
    
    if (todayLog.checkIn && todayLog.checkOut) {
      return { label: 'Checked Out', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' };
    }
    return { label: 'Checked In (Active)', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' };
  };

  const todayStatus = getTodayStatus();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">
      
      {/* Mobile Header Dashboard Banner */}
      <div className="bg-slate-900 border-b border-slate-800 p-5 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/15 p-2 rounded-xl border border-emerald-500/25 text-emerald-400 shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Namaste / Welcome</div>
              <h2 className="font-extrabold text-lg text-slate-100">{employee?.name}</h2>
              <p className="text-xs text-emerald-400 font-semibold">{employee?.designation} • {employee?.department}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Today's Biometric Status */}
        <div className={`mt-4 border p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${todayStatus.color}`}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>Today's Attendance Status:</span>
          </div>
          <span className="font-black uppercase tracking-wider">{todayStatus.label}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-md w-full mx-auto p-4 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
          <button 
            onClick={() => setCurrentTab('profile')}
            className={`py-2.5 rounded-lg transition-all ${currentTab === 'profile' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Profile
          </button>
          <button 
            onClick={() => setCurrentTab('attendance')}
            className={`py-2.5 rounded-lg transition-all ${currentTab === 'attendance' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            History
          </button>
          <button 
            onClick={() => setCurrentTab('leaves')}
            className={`py-2.5 rounded-lg transition-all ${currentTab === 'leaves' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Leaves
          </button>
          <button 
            onClick={() => setCurrentTab('payroll')}
            className={`py-2.5 rounded-lg transition-all ${currentTab === 'payroll' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Salary
          </button>
        </div>

        {/* TAB 1: PROFILE SUMMARY */}
        {currentTab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">Employment Summary</h3>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 font-bold uppercase text-[10px]">Wage Structure</div>
                  <div className="font-extrabold text-slate-200 mt-1 text-sm">{employee?.salaryType}</div>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 font-bold uppercase text-[10px]">Base Pay (₹)</div>
                  <div className="font-extrabold text-slate-200 mt-1 text-sm">₹{parseFloat(employee?.baseSalary).toLocaleString('en-IN')}</div>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 col-span-2 flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-slate-500 font-bold uppercase text-[10px]">Joining Date</div>
                    <div className="font-extrabold text-slate-200 mt-0.5 text-xs">
                      {new Date(employee?.joiningDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">My Banking Details</h3>
              <div className="text-xs space-y-2 text-slate-300">
                <p><span className="text-slate-500 font-bold">Bank Name:</span> {employee?.bankName || '--'}</p>
                <p><span className="text-slate-500 font-bold">Account Number:</span> {employee?.bankAccountNumber || '--'}</p>
                <p><span className="text-slate-500 font-bold">IFSC Code:</span> {employee?.bankIfscCode || '--'}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE HISTORY */}
        {currentTab === 'attendance' && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">My 30-Day Logs</h3>
            <div className="space-y-2">
              {attendance.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-8">No attendance records found.</p>
              ) : (
                attendance.map((log) => (
                  <div key={log.id} className="bg-slate-900 border border-slate-800/60 rounded-xl p-3.5 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-200">
                        {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>In: {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</span>
                        {log.checkOut && (
                          <span>• Out: {new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      log.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      log.status === 'LATE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      log.status === 'LEAVE' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LEAVE SCHEDULER */}
        {currentTab === 'leaves' && (
          <div className="space-y-5">
            {/* Submit Leave */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">Apply for Leave</h3>
              
              {leaveSuccess && (
                <div className="bg-emerald-950/20 border border-emerald-900/50 text-emerald-400 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                  <span>Leave application submitted to HR successfully!</span>
                </div>
              )}

              {leaveError && (
                <div className="bg-rose-950/20 border border-rose-900/50 text-rose-400 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-semibold">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{leaveError}</span>
                </div>
              )}

              <form onSubmit={handleRequestLeave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Leave Category</label>
                  <select 
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value})}
                    className="w-full border border-slate-800 rounded-xl p-3 bg-slate-950 text-xs text-slate-100 font-semibold focus:outline-none"
                  >
                    <option value="CASUAL">Casual Leave (Paid)</option>
                    <option value="SICK">Sick Leave (Paid)</option>
                    <option value="EARNED">Earned Leave (Paid)</option>
                    <option value="LOP">Loss Of Pay (Unpaid LOP)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Start Date</label>
                    <input 
                      type="date" required value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                      className="w-full border border-slate-800 rounded-xl p-3 bg-slate-950 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">End Date</label>
                    <input 
                      type="date" required value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                      className="w-full border border-slate-800 rounded-xl p-3 bg-slate-950 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Reason</label>
                  <textarea 
                    required rows={2} value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                    placeholder="E.g. Personal emergency, fever, etc."
                    className="w-full border border-slate-800 rounded-xl p-3 bg-slate-950 text-xs text-slate-100 focus:outline-none placeholder:text-slate-600"
                  />
                </div>

                <button 
                  type="submit" disabled={submittingLeave}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs tracking-wide cursor-pointer disabled:opacity-50"
                >
                  {submittingLeave ? 'Submitting Leave Application...' : 'Apply Leave'}
                </button>
              </form>
            </div>

            {/* Leave History List */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">My Leave Status</h3>
              {leaves.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">No leaves submitted.</p>
              ) : (
                leaves.map((leave) => (
                  <div key={leave.id} className="bg-slate-900 border border-slate-800/50 rounded-xl p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-200">{leave.type} ({leave.days} Day(s))</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      leave.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                      leave.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PAYROLL SHEET */}
        {currentTab === 'payroll' && (
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">My Salary Payouts</h3>
            <div className="space-y-2">
              {payrolls.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-8">No salary slips generated yet.</p>
              ) : (
                payrolls.map((pay) => (
                  <div key={pay.id} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div>
                        <div className="font-extrabold text-sm text-slate-200">
                          {new Date(0, pay.month - 1).toLocaleString('en-US', { month: 'long' })} {pay.year}
                        </div>
                        <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {pay.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Net Paid</div>
                        <div className="text-lg font-black text-emerald-400 font-mono">₹{parseFloat(pay.netSalary).toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 leading-relaxed">
                      <div>
                        <div className="font-bold text-slate-500">Base Salary</div>
                        <div className="font-mono mt-0.5">₹{parseFloat(pay.baseSalary).toLocaleString('en-IN')}</div>
                      </div>
                      <div>
                        <div className="font-bold text-slate-500">Unpaid Days</div>
                        <div className="font-bold text-rose-400 mt-0.5">{pay.unpaidLeaves + pay.absentDays} Days</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-500">Deductions</div>
                        <div className="font-mono text-rose-400 mt-0.5">₹{parseFloat(pay.deductions).toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    {pay.paymentReference && (
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400 font-mono break-all flex items-center gap-1.5 leading-relaxed">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>Ref: {pay.paymentReference}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Mobile Footer */}
      <div className="text-center text-[10px] text-slate-500 border-t border-slate-900 py-4 mt-6">
        Anandi Park Kalpdev Digitals Worker Node • SSL Secure
      </div>

    </div>
  );
}

export default function WorkerPortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse text-sm font-medium">Launching Mobile Worker Node...</p>
      </div>
    }>
      <WorkerPortalContent />
    </Suspense>
  );
}
