import { useState } from 'react';
import { ArrowLeft, Search, Clock, CheckCircle2, XCircle, AlertTriangle, FileText } from 'lucide-react';

interface Props { onBack: () => void; }

interface Application {
  appNumber: string;
  firstName: string;
  lastName: string;
  dob: string;
  province: string;
  submittedAt: string;
  expiresAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  uci: string | null;
}

// Defined at module level — never recreated on re-render
const StatusBadge = ({ status, expired }: { status: string; expired: boolean }) => {
  if (expired && status === 'PENDING') {
    return (
      <span className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-full font-bold text-sm">
        <Clock className="w-4 h-4" /> EXPIRED
      </span>
    );
  }
  if (status === 'PENDING') return (
    <span className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full font-bold text-sm animate-pulse">
      <Clock className="w-4 h-4" /> PENDING REVIEW
    </span>
  );
  if (status === 'APPROVED') return (
    <span className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm">
      <CheckCircle2 className="w-4 h-4" /> APPROVED
    </span>
  );
  return (
    <span className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full font-bold text-sm">
      <XCircle className="w-4 h-4" /> REJECTED
    </span>
  );
};

interface Application {
  appNumber: string;
  firstName: string;
  lastName: string;
  dob: string;
  province: string;
  submittedAt: string;
  expiresAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  uci: string | null;
}

export default function ApplicationStatus({ onBack }: Props) {
  const [searchValue, setSearchValue] = useState('');
  const [result, setResult] = useState<Application | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!searchValue.trim()) return;
    setSearched(true);
    setNotFound(false);
    setResult(null);

    const apps: Application[] = JSON.parse(localStorage.getItem('zidcr_applications') || '[]');
    const found = apps.find(a =>
      a.appNumber.toLowerCase() === searchValue.trim().toLowerCase()
    );

    if (found) {
      setResult(found);
    } else {
      setNotFound(true);
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-blue-900 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-blue-800 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold">Check Application Status</h2>
            <p className="text-blue-300 text-xs">Department of National Registration, Passport & Citizenship</p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-blue-900" />
            <h3 className="text-xl font-bold text-slate-900">Track Your Application</h3>
          </div>
          <p className="text-slate-600 text-sm mb-6">Enter your Application Reference Number (e.g. APP-20260508-48291837) that was issued when you submitted your application.</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="APP-YYYYMMDD-XXXXXXXX"
              className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none font-mono transition"
            />
            <button onClick={handleSearch} className="flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow">
              <Search className="w-5 h-5" /> Search
            </button>
          </div>
        </div>

        {/* Not Found */}
        {notFound && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Application Not Found</h3>
            <p className="text-slate-600 text-sm">No application was found with that reference number. Please check the number and try again. Ensure you are entering the full number including "APP-".</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Status Banner */}
            <div className={`px-8 py-6 border-b ${
              result.status === 'APPROVED' ? 'bg-green-50 border-green-200' :
              result.status === 'REJECTED' ? 'bg-red-50 border-red-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Application Reference</p>
                  <p className="font-mono font-bold text-slate-900">{result.appNumber}</p>
                </div>
                <StatusBadge status={result.status} expired={isExpired(result.expiresAt)} />
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Applicant Details */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Applicant Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['Full Name', `${result.firstName} ${result.lastName}`],
                    ['Date of Birth', new Date(result.dob).toLocaleDateString('en-ZM')],
                    ['Province', result.province],
                    ['Submitted', new Date(result.submittedAt).toLocaleDateString('en-ZM')],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="font-semibold text-slate-900 text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expiry */}
              <div className={`flex items-start gap-3 p-4 rounded-lg ${isExpired(result.expiresAt) && result.status === 'PENDING' ? 'bg-slate-100' : 'bg-yellow-50'}`}>
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800 text-sm">Application Expiry</p>
                  <p className="text-slate-600 text-sm">{new Date(result.expiresAt).toLocaleDateString('en-ZM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  {isExpired(result.expiresAt) && result.status === 'PENDING' && (
                    <p className="text-red-600 font-bold text-sm mt-1">This application has expired. Please submit a new application.</p>
                  )}
                </div>
              </div>

              {/* Approved: show UCI */}
              {result.status === 'APPROVED' && result.uci && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your National ID Number (eNRC)</p>
                  <p className="font-mono text-3xl font-bold text-slate-900 tracking-widest">{result.uci}</p>
                  <p className="text-green-700 text-sm mt-3 font-medium">Approved by Officer: {result.reviewedBy}</p>
                  <p className="text-slate-500 text-xs mt-1">on {result.reviewedAt ? new Date(result.reviewedAt).toLocaleDateString('en-ZM') : ''}</p>
                </div>
              )}

              {/* Rejected: show reason */}
              {result.status === 'REJECTED' && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-800 mb-1">Application Rejected</p>
                      <p className="text-xs text-red-600 mb-3">Reviewed on {result.reviewedAt ? new Date(result.reviewedAt).toLocaleDateString('en-ZM') : ''} by Officer {result.reviewedBy}</p>
                      <div className="bg-white border border-red-200 rounded-lg p-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reason for Rejection</p>
                        <p className="text-slate-900 font-medium">{result.rejectionReason}</p>
                      </div>
                      <div className="flex items-start gap-2 mt-4 bg-yellow-50 p-3 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <p className="text-yellow-800 text-sm">You may correct the issues mentioned and submit a new application. Visit the nearest DNRPC office for assistance.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending guidance */}
              {result.status === 'PENDING' && !isExpired(result.expiresAt) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="font-bold text-blue-800 text-sm mb-1">Your application is under review</p>
                  <p className="text-blue-700 text-sm">A DNRPC officer is reviewing your submitted details. You will be contacted via phone or email once a decision has been made. Please ensure your contact information is reachable.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
