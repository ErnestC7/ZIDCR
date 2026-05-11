import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, FileText, Download } from 'lucide-react';

interface VitalNotice {
  noticeRef: string; type: 'BIRTH' | 'DEATH';
  issuedAt: string; expiresAt: string;
  status: 'PENDING_DNRPC' | 'CERTIFICATE_ISSUED' | 'REJECTED';
  reviewedAt: string | null; reviewedBy: string | null;
  rejectionReason: string | null; certificateNumber: string | null;
  childName?: string; dateOfBirth?: string; gender?: string;
  locationType?: string; facilityName?: string;
  motherNrc?: string; fatherNrc?: string;
  deceasedNrc?: string; dateOfDeath?: string;
  causeOfDeath?: string; certifyingDoctor?: string;
}

// Defined at module level — never recreated on re-render
const Badge = ({ status }: { status: string }) => {
  if (status === 'PENDING_DNRPC') return <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold"><Clock className="w-3 h-3" />PENDING DNRPC</span>;
  if (status === 'CERTIFICATE_ISSUED') return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle2 className="w-3 h-3" />CERTIFICATE ISSUED</span>;
  return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold"><XCircle className="w-3 h-3" />REJECTED</span>;
};

const OFFICER = 'Officer R. Banda';

export default function VitalNoticesReview() {
  const [notices, setNotices] = useState<VitalNotice[]>([]);
  const [selected, setSelected] = useState<VitalNotice | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING_DNRPC' | 'CERTIFICATE_ISSUED' | 'REJECTED'>('PENDING_DNRPC');
  const [rejectReason, setRejectReason] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => setNotices(JSON.parse(localStorage.getItem('zidcr_vital_notices') || '[]'));
  useEffect(() => { load(); }, []);

  const save = (updated: VitalNotice[]) => {
    localStorage.setItem('zidcr_vital_notices', JSON.stringify(updated));
    setNotices(updated);
  };

  const isExpired = (d: string) => new Date(d) < new Date();

  const handleIssueCertificate = async () => {
    if (!selected) return;
    setBusy(true);
    await new Promise(r => setTimeout(r, 1200));
    const certNum = `CERT-${selected.type === 'BIRTH' ? 'B' : 'D'}-${Date.now().toString().slice(-8)}`;
    save(notices.map(n => n.noticeRef === selected.noticeRef
      ? { ...n, status: 'CERTIFICATE_ISSUED' as const, reviewedAt: new Date().toISOString(), reviewedBy: OFFICER, certificateNumber: certNum }
      : n));
    setSelected(null); setBusy(false);
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) return;
    setBusy(true);
    await new Promise(r => setTimeout(r, 800));
    save(notices.map(n => n.noticeRef === selected.noticeRef
      ? { ...n, status: 'REJECTED' as const, reviewedAt: new Date().toISOString(), reviewedBy: OFFICER, rejectionReason: rejectReason }
      : n));
    setShowModal(false); setSelected(null); setRejectReason(''); setBusy(false);
  };

  const filtered = notices.filter(n => filter === 'ALL' || n.status === filter);

  return (
    <div className="flex gap-6 h-full">
      {/* List */}
      <div className={`${selected ? 'hidden md:block md:w-80' : 'w-full'} shrink-0 space-y-3`}>
        <div className="flex gap-2 flex-wrap mb-2">
          {[['ALL','All'], ['PENDING_DNRPC','Pending'], ['CERTIFICATE_ISSUED','Issued'], ['REJECTED','Rejected']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filter === v ? 'bg-blue-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'}`}>{l}</button>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No notices found</p>
          </div>
        )}
        {filtered.map(n => (
          <button key={n.noticeRef} onClick={() => setSelected(n)}
            className={`w-full bg-white rounded-xl border text-left p-4 transition hover:shadow-md ${selected?.noticeRef === n.noticeRef ? 'border-blue-900 ring-2 ring-blue-900/10' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${n.type === 'BIRTH' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{n.type}</span>
                <p className="font-mono text-xs text-slate-400 mt-1">{n.noticeRef}</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{n.type === 'BIRTH' ? (n.childName || '—') : (n.deceasedNrc || '—')}</p>
              </div>
              <Badge status={n.status} />
            </div>
            <p className="text-xs text-slate-500">Issued: {new Date(n.issuedAt).toLocaleDateString()}</p>
            {isExpired(n.expiresAt) && n.status === 'PENDING_DNRPC' && <p className="text-red-500 text-xs font-bold mt-1">REVIEW WINDOW EXPIRED</p>}
          </button>
        ))}
      </div>

      {/* Detail */}
      {selected && (
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${selected.type === 'BIRTH' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{selected.type} NOTICE</span>
                  <Badge status={selected.status} />
                </div>
                <p className="font-mono text-sm font-bold text-slate-800">{selected.noticeRef}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Details grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Notice Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selected.type === 'BIRTH' ? [
                    ['Child Name', selected.childName],
                    ['Date of Birth', selected.dateOfBirth],
                    ['Gender', selected.gender],
                    ['Facility', selected.facilityName],
                    ['Mother NRC', selected.motherNrc],
                    ['Father NRC', selected.fatherNrc],
                  ] : [
                    ['Deceased NRC', selected.deceasedNrc],
                    ['Date of Death', selected.dateOfDeath],
                    ['Cause of Death', selected.causeOfDeath],
                    ['Certifying Doctor', selected.certifyingDoctor],
                  ].map(([l, v]) => (
                    <div key={l} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-bold text-slate-400 uppercase">{l}</p>
                      <p className="font-medium text-slate-900 text-sm mt-0.5">{v || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 30-day window */}
              <div className={`flex items-center gap-3 p-3 rounded-lg text-sm ${isExpired(selected.expiresAt) && selected.status === 'PENDING_DNRPC' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>DNRPC review window expires: <strong>{new Date(selected.expiresAt).toLocaleDateString('en-ZM')}</strong>
                  {isExpired(selected.expiresAt) && selected.status === 'PENDING_DNRPC' && ' — OVERDUE'}
                </span>
              </div>

              {/* Certificate issued */}
              {selected.status === 'CERTIFICATE_ISSUED' && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
                  <p className="font-bold text-green-800">{selected.type === 'BIRTH' ? 'Birth' : 'Death'} Certificate Issued by {selected.reviewedBy}</p>
                  <p className="text-sm text-green-700 mt-1 font-mono font-bold">{selected.certificateNumber}</p>
                  <p className="text-xs text-green-600 mt-1">{selected.reviewedAt ? new Date(selected.reviewedAt).toLocaleString() : ''}</p>
                  <button className="mt-4 flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-600 transition">
                    <Download className="w-4 h-4" /> Download Certificate
                  </button>
                </div>
              )}

              {/* Rejected */}
              {selected.status === 'REJECTED' && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                  <XCircle className="w-8 h-8 text-red-500 mb-2" />
                  <p className="font-bold text-red-800">Rejected by {selected.reviewedBy}</p>
                  <p className="text-sm text-red-700 mt-1"><strong>Reason:</strong> {selected.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              {selected.status === 'PENDING_DNRPC' && (
                <div className="border-t border-slate-200 pt-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">DNRPC Decision</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <strong>If approved:</strong> DNRPC issues the official {selected.type === 'BIRTH' ? 'Birth' : 'Death'} Certificate. The hospital notice does <em>not</em> become a certificate — a new certificate number is generated by DNRPC.
                  </div>
                  <button onClick={handleIssueCertificate} disabled={busy}
                    className="w-full flex items-center justify-center gap-3 bg-green-700 hover:bg-green-600 text-white py-4 rounded-xl font-extrabold text-lg transition shadow-lg disabled:bg-slate-300 disabled:cursor-not-allowed">
                    {busy ? <><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />Processing...</> : <><CheckCircle2 className="w-6 h-6" />Approve & Issue {selected.type === 'BIRTH' ? 'Birth' : 'Death'} Certificate</>}
                  </button>
                  <button onClick={() => setShowModal(true)}
                    className="w-full flex items-center justify-center gap-2 border-2 border-red-400 text-red-600 hover:bg-red-50 py-3 rounded-xl font-bold transition">
                    <XCircle className="w-5 h-5" /> Reject Notice
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
            <XCircle className="w-10 h-10 text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Reject Vital Notice</h3>
            <p className="text-slate-600 text-sm mb-4">Provide a reason. The hospital will be notified and must re-issue a corrected notice.</p>
            <select className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none mb-3 text-slate-800"
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}>
              <option value="">— Select reason —</option>
              <option>Information on the notice is incomplete or inconsistent.</option>
              <option>Notice details do not match hospital records.</option>
              <option>ICD-11 cause of death code is invalid or missing.</option>
              <option>Certifying doctor credentials could not be verified.</option>
              <option>Duplicate notice detected for the same vital event.</option>
              <option>Parental NRC numbers are invalid or unverifiable.</option>
            </select>
            <textarea rows={3} placeholder="Or enter a custom reason..."
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 outline-none resize-none mb-6 text-sm" />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 border-2 border-slate-300 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || busy}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed">
                {busy ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
