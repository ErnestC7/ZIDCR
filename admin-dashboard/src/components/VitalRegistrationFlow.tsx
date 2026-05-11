import { useState } from 'react';
import { ArrowLeft, Baby, HeartPulse, ActivitySquare, Save, Search, Download } from 'lucide-react';

export default function VitalRegistrationFlow({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'BIRTH' | 'DEATH'>('BIRTH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);

  // Form State
  const [birthData, setBirthData] = useState({ 
    childName: '', dateOfBirth: '', gender: 'Male', 
    locationType: 'Hospital', facilityName: '',
    motherNrc: '', fatherNrc: '',
    isOrphan: false, guardianNrc: '', institutionName: ''
  });

  const [deathData, setDeathData] = useState({ 
    deceasedNrc: '', dateOfDeath: '', 
    icd11Code: '', causeOfDeath: '', 
    certifyingDoctor: ''
  });

  const handleRegister = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const noticeRef = `NTC-${tab === 'BIRTH' ? 'B' : 'D'}-${Date.now().toString().slice(-8)}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Save to localStorage so OfficerReviewDashboard can find it
      const notice = {
        noticeRef,
        type: tab,
        issuedAt: new Date().toISOString(),
        expiresAt,
        status: 'PENDING_DNRPC',
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
        certificateNumber: null,
        ...(tab === 'BIRTH' ? {
          childName: birthData.childName,
          dateOfBirth: birthData.dateOfBirth,
          gender: birthData.gender,
          locationType: birthData.locationType,
          facilityName: birthData.facilityName,
          motherNrc: birthData.motherNrc,
          fatherNrc: birthData.fatherNrc,
          isOrphan: birthData.isOrphan,
          guardianNrc: birthData.guardianNrc,
          institutionName: birthData.institutionName,
        } : {
          deceasedNrc: deathData.deceasedNrc,
          dateOfDeath: deathData.dateOfDeath,
          icd11Code: deathData.icd11Code,
          causeOfDeath: deathData.causeOfDeath,
          certifyingDoctor: deathData.certifyingDoctor,
        })
      };

      const existing = JSON.parse(localStorage.getItem('zidcr_vital_notices') || '[]');
      existing.unshift(notice);
      localStorage.setItem('zidcr_vital_notices', JSON.stringify(existing));

      setCertificateId(noticeRef);
    } catch (e) {
      alert('Failed to issue notice. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (certificateId) {
    const noticeType = tab === 'BIRTH' ? 'Birth Notice' : 'Death Notice';
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center font-sans">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border-t-8 border-blue-900 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-900 px-8 py-6 text-white text-center">
            <ActivitySquare className="w-14 h-14 mx-auto mb-3 text-blue-300" />
            <h2 className="text-2xl font-extrabold uppercase tracking-tight">{noticeType} Issued</h2>
            <p className="text-blue-200 text-sm mt-1">Issued by this facility — Forwarded to DNRPC for approval</p>
          </div>

          <div className="p-8">
            {/* Notice Reference */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-5 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{noticeType} Reference Number</p>
              <p className="font-mono text-2xl font-bold text-slate-900 tracking-wider">{certificateId}</p>
              <p className="text-xs text-slate-500 mt-2">Births & Deaths Registration Act, Cap. 51 — Laws of Zambia</p>
            </div>

            {/* THIS IS A NOTICE — NOT A CERTIFICATE */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 mb-5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">!</div>
                <div>
                  <p className="font-bold text-amber-800 mb-1">This is a {noticeType} — Not a Certificate</p>
                  <p className="text-amber-700 text-sm">The official <strong>{tab === 'BIRTH' ? 'Birth Certificate' : 'Death Certificate'}</strong> will only be issued by the Department of National Registration, Passport & Citizenship (DNRPC) after reviewing and approving this notice. The parent or next of kin will be notified.</p>
                </div>
              </div>
            </div>

            {/* 30-day DNRPC window */}
            <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5">
              <Download className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800 text-sm">DNRPC Review Window: 30 Days</p>
                <p className="text-slate-600 text-sm mt-0.5">The DNRPC must approve or reject this notice by <strong>{expiryDate.toLocaleDateString('en-ZM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
              </div>
            </div>

            {/* Download notice */}
            <button className="flex items-center justify-center w-full gap-3 bg-blue-900 text-white py-4 rounded-lg hover:bg-blue-800 transition font-bold shadow-sm mb-3">
              <Download className="w-5 h-5" /> Download {noticeType} (For Parent / Next of Kin)
            </button>

            <button onClick={() => { setCertificateId(null); setBirthData({ childName: '', dateOfBirth: '', gender: 'Male', locationType: 'Hospital', facilityName: '', motherNrc: '', fatherNrc: '', isOrphan: false, guardianNrc: '', institutionName: '' }); }}
              className="w-full text-blue-900 hover:text-blue-700 transition font-semibold py-2">
              Issue Another Notice
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="bg-blue-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-blue-800 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold tracking-wide">Hospital & Clinic CRVS Portal</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setTab('BIRTH')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all ${tab === 'BIRTH' ? 'bg-blue-900 text-white shadow-lg scale-105' : 'bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50'}`}
          >
            <Baby className="w-6 h-6" /> Birth Registration
          </button>
          <button 
            onClick={() => setTab('DEATH')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all ${tab === 'DEATH' ? 'bg-blue-900 text-white shadow-lg scale-105' : 'bg-white text-blue-900 border-2 border-blue-900 hover:bg-blue-50'}`}
          >
            <HeartPulse className="w-6 h-6" /> Death Registration
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {tab === 'BIRTH' ? (
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between border-b pb-4 mb-6">
                <h3 className="text-xl font-bold text-slate-900">Minor / Newborn Registration</h3>
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                  <input type="checkbox" id="orphanToggle" checked={birthData.isOrphan} onChange={e => setBirthData({...birthData, isOrphan: e.target.checked})} className="w-4 h-4 text-blue-900 rounded focus:ring-blue-900 cursor-pointer" />
                  <label htmlFor="orphanToggle" className="font-bold text-blue-900 text-sm cursor-pointer">Register as Orphan / Ward of the State</label>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Child's Full Name</label>
                  <input type="text" value={birthData.childName} onChange={e => setBirthData({...birthData, childName: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date & Time of Birth</label>
                  <input type="datetime-local" value={birthData.dateOfBirth} onChange={e => setBirthData({...birthData, dateOfBirth: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Location Type</label>
                  <select value={birthData.locationType} onChange={e => setBirthData({...birthData, locationType: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none">
                    <option>Hospital / Clinic</option>
                    <option>Home Birth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Facility Name / Village Area</label>
                  <input type="text" value={birthData.facilityName} onChange={e => setBirthData({...birthData, facilityName: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none" />
                </div>
              </div>

              <h4 className="font-bold text-slate-900 mt-8 mb-4 border-b pb-2">
                {birthData.isOrphan ? 'Guardian / Institutional Linking (Parents Unknown)' : 'Lineage Linking (Parental NRCs)'}
              </h4>
              
              {birthData.isOrphan ? (
                <div className="grid md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Social Worker / Guardian NRC</label>
                    <input type="text" placeholder="Required" value={birthData.guardianNrc} onChange={e => setBirthData({...birthData, guardianNrc: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Orphanage / Institution Name</label>
                    <input type="text" placeholder="e.g. Kasisi Children's Home" value={birthData.institutionName} onChange={e => setBirthData({...birthData, institutionName: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Mother's NRC Number</label>
                    <input type="text" placeholder="Required" value={birthData.motherNrc} onChange={e => setBirthData({...birthData, motherNrc: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Father's NRC Number</label>
                    <input type="text" placeholder="Optional" value={birthData.fatherNrc} onChange={e => setBirthData({...birthData, fatherNrc: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 border-b pb-4">Mortality Registration</h3>
              <div className="flex gap-4 mb-6">
                <input type="text" placeholder="Scan or Enter Deceased NRC Number" value={deathData.deceasedNrc} onChange={e => setDeathData({...deathData, deceasedNrc: e.target.value})} className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-800 outline-none" />
                <button className="bg-slate-200 px-6 rounded-lg font-bold hover:bg-slate-300 transition flex items-center gap-2"><Search className="w-5 h-5"/> Lookup</button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date & Time of Death</label>
                  <input type="datetime-local" value={deathData.dateOfDeath} onChange={e => setDeathData({...deathData, dateOfDeath: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Certifying Doctor</label>
                  <input type="text" value={deathData.certifyingDoctor} onChange={e => setDeathData({...deathData, certifyingDoctor: e.target.value})} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-800 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">ICD-11 Cause of Death Code</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. 1B13" value={deathData.icd11Code} onChange={e => setDeathData({...deathData, icd11Code: e.target.value})} className="w-32 px-4 py-3 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-slate-800 outline-none" />
                    <input type="text" placeholder="Description (e.g. Malaria)" value={deathData.causeOfDeath} onChange={e => setDeathData({...deathData, causeOfDeath: e.target.value})} className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-800 outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end mb-16 md:mb-0">
             <button 
                onClick={handleRegister}
                disabled={isSubmitting}
                className="flex items-center justify-center w-full md:w-auto gap-2 bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-bold transition shadow-lg disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> Submitting...</>
                ) : (
                  <><Save className="w-5 h-5" /> Issue {tab === 'BIRTH' ? 'Birth Notice' : 'Death Notice'}</>
                )}
             </button>
          </div>
        </div>
      </div>

      {/* Mobile App Bottom Navigation (Only visible on phones) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
        <button onClick={() => setTab('BIRTH')} className={`flex flex-col items-center gap-1 ${tab === 'BIRTH' ? 'text-blue-900' : 'text-slate-400'}`}>
          <Baby className="w-6 h-6" />
          <span className="text-[10px] font-bold">Births</span>
        </button>
        <button onClick={() => setTab('DEATH')} className={`flex flex-col items-center gap-1 ${tab === 'DEATH' ? 'text-blue-900' : 'text-slate-400'}`}>
          <HeartPulse className="w-6 h-6" />
          <span className="text-[10px] font-bold">Deaths</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-slate-400">
          <ActivitySquare className="w-6 h-6" />
          <span className="text-[10px] font-bold">Sync</span>
        </button>
      </div>
    </div>
  );
}
