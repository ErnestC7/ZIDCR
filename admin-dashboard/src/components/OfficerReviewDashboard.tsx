import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Clock, User, FileText, ChevronDown, Baby } from 'lucide-react';
import CameraCapture from './CameraCapture';
import VitalNoticesReview from './VitalNoticesReview';

interface Props { onBack: () => void; }

interface Application {
  appNumber: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  nrcNumber: string;
  passportNumber: string;
  phone: string;
  email: string;
  province: string;
  address: string;
  submittedAt: string;
  expiresAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  uci: string | null;
}

const generateUCI = () => {
  const prefix = String(Math.floor(1 + Math.random() * 8));
  return prefix + Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
};

const OFFICER_NAME = 'Officer R. Banda'; // Replace with auth context in production

export default function OfficerReviewDashboard({ onBack }: Props) {
  const [tab, setTab] = useState<'APPLICATIONS' | 'VITAL_NOTICES'>('APPLICATIONS');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricCaptured, setBiometricCaptured] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionDone, setActionDone] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [pendingNoticesCount, setPendingNoticesCount] = useState(0);

  const loadApplications = () => {
    const data: Application[] = JSON.parse(localStorage.getItem('zidcr_applications') || '[]');
    setApplications(data);
  };

  const loadNoticesCount = () => {
    const notices = JSON.parse(localStorage.getItem('zidcr_vital_notices') || '[]');
    setPendingNoticesCount(notices.filter((n: { status: string }) => n.status === 'PENDING_DNRPC').length);
  };

  useEffect(() => {
    loadApplications();
    loadNoticesCount();
    const interval = setInterval(loadNoticesCount, 2000);
    return () => clearInterval(interval);
  }, []);

  const saveAll = (updated: Application[]) => {
    localStorage.setItem('zidcr_applications', JSON.stringify(updated));
    setApplications(updated);
  };

  const isExpired = (exp: string) => new Date(exp) < new Date();
  const filtered = applications.filter(a => filter === 'ALL' ? true : a.status === filter);

  const handleApprove = async () => {
    if (!selected || !biometricCaptured) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    const uci = generateUCI();
    const updated = applications.map(a =>
      a.appNumber === selected.appNumber
        ? { ...a, status: 'APPROVED' as const, reviewedAt: new Date().toISOString(), reviewedBy: OFFICER_NAME, uci }
        : a
    );
    saveAll(updated);
    setSelected(null);
    setShowBiometric(false);
    setBiometricCaptured(false);
    setActionDone('APPROVED');
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!selected || !rejectionReason.trim()) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1000));
    const updated = applications.map(a =>
      a.appNumber === selected.appNumber
        ? { ...a, status: 'REJECTED' as const, reviewedAt: new Date().toISOString(), reviewedBy: OFFICER_NAME, rejectionReason }
        : a
    );
    saveAll(updated);
    setShowRejectModal(false);
    setSelected(null);
    setRejectionReason('');
    setActionDone('REJECTED');
    setIsProcessing(false);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'PENDING') return <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold"><Clock className="w-3 h-3" />PENDING</span>;
    if (status === 'APPROVED') return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle2 className="w-3 h-3" />APPROVED</span>;
    return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold"><XCircle className="w-3 h-3" />REJECTED</span>;
  };

  // Post-action confirmation screen
  if (actionDone) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-10 text-center border-t-8 border-blue-900">
          {actionDone === 'APPROVED'
            ? <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            : <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          }
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Application {actionDone}</h2>
          <p className="text-slate-600 mb-8 text-sm">
            {actionDone === 'APPROVED'
              ? 'The citizen has been issued a 13-digit eNRC. They can view it via the Application Status portal.'
              : 'The application has been rejected with a reason. The citizen can re-apply after correcting the issues.'}
          </p>
          <div className="flex gap-3">
            <button onClick={() => { setActionDone(null); loadApplications(); }}
              className="flex-1 border-2 border-blue-900 text-blue-900 py-3 rounded-lg font-bold hover:bg-blue-50 transition">
              Review More
            </button>
            <button onClick={onBack}
              className="flex-1 bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* ── Header ── */}
      <div className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-blue-800 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold">Application Review Dashboard</h2>
              <p className="text-blue-300 text-xs">DNRPC — Authorised Officers Only</p>
            </div>
          </div>
          <div className="text-sm text-blue-200 flex items-center gap-2">
            <User className="w-4 h-4" />{OFFICER_NAME}
          </div>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex gap-1 pt-3">
          <button
            onClick={() => setTab('APPLICATIONS')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-bold border-b-2 transition ${
              tab === 'APPLICATIONS' ? 'border-blue-900 text-blue-900 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            ID Applications
            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-mono">
              {applications.filter(a => a.status === 'PENDING').length}
            </span>
          </button>
          <button
            onClick={() => setTab('VITAL_NOTICES')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-bold border-b-2 transition ${
              tab === 'VITAL_NOTICES' ? 'border-blue-900 text-blue-900 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Baby className="w-4 h-4" />
            Birth &amp; Death Notices
            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-mono">
              {pendingNoticesCount}
            </span>
          </button>
        </div>

        {/* Sub-filter bar (Applications tab only) */}
        {tab === 'APPLICATIONS' && (
          <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-3">
            {[
              { label: 'All',      val: 'ALL',      count: applications.length },
              { label: 'Pending',  val: 'PENDING',  count: applications.filter(a => a.status === 'PENDING').length },
              { label: 'Approved', val: 'APPROVED', count: applications.filter(a => a.status === 'APPROVED').length },
              { label: 'Rejected', val: 'REJECTED', count: applications.filter(a => a.status === 'REJECTED').length },
            ].map(f => (
              <button
                key={f.val}
                onClick={() => setFilter(f.val as typeof filter)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filter === f.val ? 'bg-blue-100 text-blue-900' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                {f.label} <span className="font-mono">{f.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex gap-6">

        {/* ── Vital Notices Tab ── */}
        {tab === 'VITAL_NOTICES' && <VitalNoticesReview />}

        {/* ── Applications Tab ── */}
        {tab === 'APPLICATIONS' && (
          <>
            {/* Left: Application List */}
            <div className={`${selected ? 'hidden md:flex md:flex-col md:w-80' : 'w-full flex flex-col'} shrink-0 gap-3`}>
              {filtered.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold">
                    No {filter !== 'ALL' ? filter.toLowerCase() : ''} applications
                  </p>
                </div>
              )}
              {filtered.map(app => (
                <button
                  key={app.appNumber}
                  onClick={() => { setSelected(app); setShowBiometric(false); setBiometricCaptured(false); }}
                  className={`w-full bg-white rounded-xl border text-left p-5 transition hover:shadow-md ${
                    selected?.appNumber === app.appNumber
                      ? 'border-blue-900 shadow-md ring-2 ring-blue-900/10'
                      : 'border-slate-200 hover:border-blue-300'
                  } ${isExpired(app.expiresAt) && app.status === 'PENDING' ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-slate-900">{app.firstName} {app.lastName}</p>
                      <p className="font-mono text-xs text-slate-400 mt-0.5">{app.appNumber}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                    <span>{app.province}</span>
                    <span>Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
                  </div>
                  {isExpired(app.expiresAt) && app.status === 'PENDING' && (
                    <p className="text-red-500 text-xs font-bold mt-2">⚠ EXPIRED — Cannot be processed</p>
                  )}
                </button>
              ))}
            </div>

            {/* Right: Detail Panel */}
            {selected && (
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                  {/* Panel header */}
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{selected.firstName} {selected.lastName}</h3>
                      <p className="font-mono text-xs text-slate-400 mt-0.5">{selected.appNumber}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={selected.status} />
                      <button
                        onClick={() => setSelected(null)}
                        className="text-slate-400 hover:text-slate-700 text-lg font-bold transition"
                      >×</button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-280px)]">

                    {/* Applicant Details Grid */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Application Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ['Full Name', `${selected.firstName} ${selected.otherNames || ''} ${selected.lastName}`.trim()],
                          ['Date of Birth', new Date(selected.dob).toLocaleDateString('en-ZM')],
                          ['Gender', selected.gender],
                          ['Marital Status', selected.maritalStatus],
                          ['Legacy NRC', selected.nrcNumber || 'Not provided'],
                          ['Passport', selected.passportNumber || 'Not provided'],
                          ['Province', selected.province],
                          ['Address', selected.address || 'Not provided'],
                          ['Phone', selected.phone || 'Not provided'],
                          ['Email', selected.email || 'Not provided'],
                        ].map(([label, val]) => (
                          <div key={label} className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
                            <p className="font-medium text-slate-900 text-sm mt-0.5">{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 30-Day Validity */}
                    <div className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                      isExpired(selected.expiresAt) && selected.status === 'PENDING'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Expires: <strong>{new Date(selected.expiresAt).toLocaleDateString('en-ZM')}</strong>
                        {isExpired(selected.expiresAt) && selected.status === 'PENDING' && ' — EXPIRED, cannot be processed'}
                      </span>
                    </div>

                    {/* Already Approved */}
                    {selected.status === 'APPROVED' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                        <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
                        <p className="font-bold text-green-800">Approved by {selected.reviewedBy}</p>
                        <p className="text-sm text-green-700 mt-1">
                          Issued eNRC: <span className="font-mono font-bold">{selected.uci}</span>
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          {selected.reviewedAt ? new Date(selected.reviewedAt).toLocaleString() : ''}
                        </p>
                      </div>
                    )}

                    {/* Already Rejected */}
                    {selected.status === 'REJECTED' && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                        <XCircle className="w-8 h-8 text-red-500 mb-2" />
                        <p className="font-bold text-red-800">Rejected by {selected.reviewedBy}</p>
                        <p className="text-sm text-red-700 mt-1 font-medium">Reason: {selected.rejectionReason}</p>
                        <p className="text-xs text-red-600 mt-1">
                          {selected.reviewedAt ? new Date(selected.reviewedAt).toLocaleString() : ''}
                        </p>
                      </div>
                    )}

                    {/* Actions — only for unexpired PENDING */}
                    {selected.status === 'PENDING' && !isExpired(selected.expiresAt) && (
                      <div className="border-t border-slate-200 pt-6 space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Officer Actions</h4>

                        {/* Step 1: Biometric Capture */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setShowBiometric(v => !v)}
                          >
                            <div>
                              <p className="font-bold text-blue-900 text-sm">Step 1: Capture Citizen Biometrics</p>
                              <p className="text-blue-700 text-xs mt-0.5">Citizen must be physically present. Capture face in person.</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {biometricCaptured && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                              <ChevronDown className={`w-5 h-5 text-blue-700 transition-transform ${showBiometric ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                          {showBiometric && (
                            <div className="mt-4">
                              {biometricCaptured ? (
                                <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                                  <CheckCircle2 className="w-5 h-5" /> Biometric captured successfully
                                </div>
                              ) : (
                                <CameraCapture onCapture={() => setBiometricCaptured(true)} />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Step 2: Approve */}
                        <button
                          onClick={handleApprove}
                          disabled={!biometricCaptured || isProcessing}
                          className="w-full flex items-center justify-center gap-3 bg-green-700 hover:bg-green-600 text-white py-4 rounded-xl font-extrabold text-lg transition shadow-lg disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                          {isProcessing
                            ? <><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />Processing...</>
                            : <><CheckCircle2 className="w-6 h-6" />Step 2: Approve &amp; Issue eNRC</>
                          }
                        </button>
                        {!biometricCaptured && (
                          <p className="text-xs text-slate-400 text-center -mt-2">Capture biometrics above before approving</p>
                        )}

                        {/* Reject */}
                        <button
                          onClick={() => setShowRejectModal(true)}
                          className="w-full flex items-center justify-center gap-2 border-2 border-red-400 text-red-600 hover:bg-red-50 py-3 rounded-xl font-bold transition"
                        >
                          <XCircle className="w-5 h-5" /> Reject Application
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Reject Modal ── */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <XCircle className="w-10 h-10 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reject Application</h3>
            <p className="text-slate-600 text-sm mb-4">
              You must provide a clear reason. This reason will be shown to the applicant so they can correct and re-apply.
            </p>
            <select
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-400 outline-none mb-3 text-slate-800"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            >
              <option value="">— Select rejection reason —</option>
              <option>Incomplete or inaccurate personal information provided.</option>
              <option>Documents submitted do not match application details.</option>
              <option>Applicant is already registered in the national registry (duplicate).</option>
              <option>Proof of citizenship/nationality could not be verified.</option>
              <option>Date of birth documentation is inconsistent or unverifiable.</option>
              <option>Suspicious or potentially fraudulent information detected.</option>
              <option>Application reference has expired (30-day window exceeded).</option>
            </select>
            <textarea
              rows={3}
              placeholder="Or type a custom reason here..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-400 outline-none resize-none mb-6 text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setRejectionReason(''); }}
                className="flex-1 border-2 border-slate-300 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || isProcessing}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition disabled:bg-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
