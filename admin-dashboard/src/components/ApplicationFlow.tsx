import { useState } from 'react';
import { ArrowLeft, ChevronRight, Contact, MapPin, CreditCard, Send, Clock, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';

// ── Real-time validation rules per field ──
type ValidationResult = { valid: boolean; message: string };

const FIELD_RULES: Record<string, {
  hint: string;
  validate: (v: string) => ValidationResult;
}> = {
  firstName: {
    hint: 'Letters and spaces only, min 2 characters (e.g. John)',
    validate: (v) => {
      if (!v.trim()) return { valid: false, message: 'First name is required.' };
      if (/[^a-zA-Z\s'-]/.test(v)) return { valid: false, message: 'Only letters, spaces, hyphens and apostrophes allowed.' };
      if (v.trim().length < 2) return { valid: false, message: 'Must be at least 2 characters.' };
      return { valid: true, message: 'Looks good!' };
    },
  },
  lastName: {
    hint: 'Letters and spaces only, min 2 characters (e.g. Mwale)',
    validate: (v) => {
      if (!v.trim()) return { valid: false, message: 'Last name is required.' };
      if (/[^a-zA-Z\s'-]/.test(v)) return { valid: false, message: 'Only letters, spaces, hyphens and apostrophes allowed.' };
      if (v.trim().length < 2) return { valid: false, message: 'Must be at least 2 characters.' };
      return { valid: true, message: 'Looks good!' };
    },
  },
  otherNames: {
    hint: 'Letters and spaces only (optional)',
    validate: (v) => {
      if (!v.trim()) return { valid: true, message: '' }; // optional
      if (/[^a-zA-Z\s'-]/.test(v)) return { valid: false, message: 'Only letters, spaces, hyphens and apostrophes allowed.' };
      return { valid: true, message: 'Looks good!' };
    },
  },
  dob: {
    hint: 'Select your date of birth (must be in the past)',
    validate: (v) => {
      if (!v) return { valid: false, message: 'Date of birth is required.' };
      if (new Date(v) >= new Date()) return { valid: false, message: 'Date of birth must be in the past.' };
      const age = (Date.now() - new Date(v).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age > 150) return { valid: false, message: 'Please enter a realistic date of birth.' };
      return { valid: true, message: `Age: ${Math.floor(age)} years` };
    },
  },
  nrcNumber: {
    hint: 'Format: 123456/10/1 (6 digits / 2 digits / 1 digit)',
    validate: (v) => {
      if (!v.trim()) return { valid: true, message: '' }; // optional
      if (/[^0-9/]/.test(v)) return { valid: false, message: 'Only numbers and forward slashes (/) allowed.' };
      if (!/^\d{6}\/\d{2}\/\d{1}$/.test(v)) return { valid: false, message: 'Must be format: 123456/10/1' };
      return { valid: true, message: 'Valid NRC format' };
    },
  },
  passportNumber: {
    hint: 'Letters and numbers, 6-9 characters (e.g. ZM123456)',
    validate: (v) => {
      if (!v.trim()) return { valid: true, message: '' }; // optional
      if (/[^a-zA-Z0-9]/.test(v)) return { valid: false, message: 'Only letters and numbers allowed.' };
      if (v.length < 6 || v.length > 9) return { valid: false, message: 'Must be 6-9 characters.' };
      return { valid: true, message: 'Valid passport format' };
    },
  },
  phone: {
    hint: 'Zambian number: +260 9X XXX XXXX or 09X XXX XXXX',
    validate: (v) => {
      if (!v.trim()) return { valid: true, message: '' }; // optional
      const c = v.replace(/[\s\-]/g, '');
      if (/[^0-9+\s\-]/.test(v)) return { valid: false, message: 'Only numbers, +, spaces and dashes allowed.' };
      if (!/^(\+260|0)?[679]\d{8}$/.test(c)) return { valid: false, message: 'Invalid. Use: +260 97X XXX XXX or 097X XXX XXX' };
      return { valid: true, message: 'Valid Zambian number' };
    },
  },
  email: {
    hint: 'Standard email format (e.g. name@example.com)',
    validate: (v) => {
      if (!v.trim()) return { valid: true, message: '' }; // optional
      if (!/^[\w._%+\-]+@[\w.\-]+\.[a-zA-Z]{2,}$/.test(v)) return { valid: false, message: 'Enter a valid email (e.g. name@example.com)' };
      return { valid: true, message: 'Valid email' };
    },
  },
  address: {
    hint: 'Street, area and town (e.g. Plot 123, Cairo Road, Lusaka)',
    validate: (v) => {
      if (!v.trim()) return { valid: true, message: '' }; // optional
      if (v.trim().length < 5) return { valid: false, message: 'Please provide a more detailed address.' };
      return { valid: true, message: 'Looks good!' };
    },
  },
};

// ── Field component with live validation feedback ──
const Field = ({ label, children, error, hint, valid }: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  valid?: boolean;
}) => (
  <div>
    <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
    {hint && !error && !valid && (
      <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />{hint}
      </p>
    )}
    {children}
    {error && (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium">
        <AlertCircle className="w-3 h-3" />{error}
      </p>
    )}
    {valid && !error && (
      <p className="mt-1 text-xs text-green-600 flex items-center gap-1 font-medium">
        <Check className="w-3 h-3" />Valid
      </p>
    )}
  </div>
);

// ── Dynamic input class: red for error, green for valid, default otherwise ──
const liveInputClass = (status: 'idle' | 'valid' | 'error') =>
  `w-full px-4 py-3 rounded-lg border transition focus:ring-2 focus:border-transparent outline-none ${
    status === 'error'
      ? 'border-red-400 bg-red-50 focus:ring-red-400 text-red-900'
      : status === 'valid'
        ? 'border-green-400 bg-green-50/30 focus:ring-green-400'
        : 'border-slate-300 focus:ring-blue-900'
  }`;

interface Props { onBack: () => void; }

// Simple application number generator
const generateAppNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10000000 + Math.random() * 90000000);
  return `APP-${date}-${rand}`;
};

// Save to localStorage so OfficerReviewDashboard can read it
const saveApplication = (app: object) => {
  const existing = JSON.parse(localStorage.getItem('zidcr_applications') || '[]');
  existing.unshift(app);
  localStorage.setItem('zidcr_applications', JSON.stringify(existing));
};

export default function ApplicationFlow({ onBack }: Props) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', otherNames: '', dob: '', gender: 'Male',
    nationality: 'Zambian', maritalStatus: 'Single',
    nrcNumber: '', passportNumber: '',
    phone: '', email: '', address: '', province: 'Lusaka'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [valids, setValids] = useState<Record<string, boolean>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationResult, setApplicationResult] = useState<{
    appNumber: string; expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Live validate a single field on every change
  const liveValidate = (field: string, value: string) => {
    const rule = FIELD_RULES[field];
    if (!rule) return;
    const result = rule.validate(value);
    setErrors(prev => {
      const next = { ...prev };
      if (!result.valid) next[field] = result.message;
      else delete next[field];
      return next;
    });
    setValids(prev => ({ ...prev, [field]: result.valid && value.trim().length > 0 }));
  };

  // Update a field + mark touched + run live validation
  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    liveValidate(field, value);
  };

  // Get the visual status for a field
  const fieldStatus = (field: string): 'idle' | 'valid' | 'error' => {
    if (!touched[field]) return 'idle';
    if (errors[field]) return 'error';
    if (valids[field]) return 'valid';
    return 'idle';
  };

  // Full batch validation (for form submission / step navigation)
  const validate = (fields: string[]) => {
    const newErrors: Record<string, string> = {};
    const newValids: Record<string, boolean> = {};
    const newTouched: Record<string, boolean> = { ...touched };
    for (const field of fields) {
      newTouched[field] = true;
      const rule = FIELD_RULES[field];
      if (rule) {
        const val = (formData as Record<string, string>)[field] || '';
        const result = rule.validate(val);
        if (!result.valid) newErrors[field] = result.message;
        newValids[field] = result.valid && val.trim().length > 0;
      }
    }
    setErrors(newErrors);
    setValids(prev => ({ ...prev, ...newValids }));
    setTouched(newTouched);
    return Object.keys(newErrors).length === 0;
  };

  // Field helper props
  const fieldProps = (field: string) => ({
    error: touched[field] ? errors[field] : undefined,
    hint: !touched[field] ? FIELD_RULES[field]?.hint : undefined,
    valid: touched[field] ? valids[field] : undefined,
  });

  const handleSubmit = async () => {
    if (!validate(['firstName', 'lastName', 'dob', 'phone', 'email', 'nrcNumber'])) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));

    const appNumber = generateAppNumber();
    const submittedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const application = {
      appNumber, submittedAt, expiresAt, status: 'PENDING',
      ...formData,
      reviewedAt: null, reviewedBy: null, rejectionReason: null, uci: null
    };

    saveApplication(application);
    setApplicationResult({ appNumber, expiresAt });
    setIsSubmitting(false);
    setStep(4);
  };

  const copyToClipboard = () => {
    if (applicationResult) {
      navigator.clipboard.writeText(applicationResult.appNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Field and inputClass are now at module level — see top of file

  // ── SUCCESS SCREEN ──
  if (step === 4 && applicationResult) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full border-t-8 border-blue-900 overflow-hidden">
          <div className="bg-blue-900 px-8 py-6 text-white text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-blue-300" />
            <h2 className="text-2xl font-extrabold uppercase tracking-tight">Application Submitted</h2>
            <p className="text-blue-200 text-sm mt-1">Your application is now awaiting review by the DNRPC</p>
          </div>

          <div className="p-8">
            {/* Application Number */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Your Application Reference Number</p>
              <p className="font-mono text-2xl font-bold text-slate-900 tracking-wider">{applicationResult.appNumber}</p>
              <button onClick={copyToClipboard} className="mt-3 flex items-center gap-2 mx-auto text-blue-700 hover:text-blue-900 text-sm font-semibold transition">
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy Number'}
              </button>
            </div>

            {/* Validity Warning */}
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6 flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-yellow-800 text-sm">Application valid for 30 days only</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Expires: <strong>{new Date(applicationResult.expiresAt).toLocaleDateString('en-ZM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                </p>
                <p className="text-yellow-700 text-sm mt-1">You must visit the nearest DNRPC office before this date to complete your registration with biometric capture.</p>
              </div>
            </div>

            {/* What happens next */}
            <div className="border border-slate-200 rounded-xl p-5 mb-6">
              <h3 className="font-bold text-slate-900 mb-4 uppercase text-sm tracking-wider">What happens next?</h3>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'A DNRPC officer will review your application details.', color: 'bg-blue-100 text-blue-800' },
                  { step: '2', text: 'You will be contacted to visit your nearest DNRPC office for biometric capture (fingerprints & face).', color: 'bg-blue-100 text-blue-800' },
                  { step: '3', text: 'Once approved, your 13-digit National ID (eNRC) will be issued.', color: 'bg-green-100 text-green-800' },
                  { step: '4', text: 'If rejected, you will receive a reason and may re-apply.', color: 'bg-red-100 text-red-800' },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${item.color}`}>{item.step}</span>
                    <p className="text-slate-700 text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status tracker prompt */}
            <div className="bg-slate-100 rounded-lg p-4 text-center text-sm text-slate-600 mb-6">
              Save your Application Number and use the <strong>Check Application Status</strong> option on the main portal to track your application.
            </div>

            <button onClick={onBack} className="w-full border-2 border-blue-900 text-blue-900 font-bold py-3 rounded-lg hover:bg-blue-50 transition">
              Return to Main Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-blue-900 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-blue-800 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-wide">National ID Application</h2>
              <p className="text-blue-300 text-xs">Department of National Registration, Passport & Citizenship</p>
            </div>
          </div>
          <div className="text-sm font-bold text-blue-300">Step {step} of 3</div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3 text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span><strong>This is an application only.</strong> Your National ID (eNRC) will be issued after a DNRPC officer reviews and approves your application and you complete biometric capture at a DNRPC office.</span>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <div className="hidden md:block w-56 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">Application Steps</h3>
            <ul className="space-y-5">
              {[{ n: 1, label: 'Personal Details' }, { n: 2, label: 'Contact & Address' }, { n: 3, label: 'Review & Submit' }].map(s => (
                <li key={s.n} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${step >= s.n ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{s.n}</div>
                  <span className={`font-semibold text-sm ${step >= s.n ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 px-8 py-5 bg-slate-50 flex items-center gap-3">
                <Contact className="w-5 h-5 text-blue-900" />
                <h3 className="text-lg font-bold text-slate-900">Personal Details</h3>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Field label="Legal First Name *" {...fieldProps('firstName')}>
                    <input type="text" value={formData.firstName} onChange={e => updateField('firstName', e.target.value)} className={liveInputClass(fieldStatus('firstName'))} placeholder="e.g. John" />
                  </Field>
                  <Field label="Legal Last Name *" {...fieldProps('lastName')}>
                    <input type="text" value={formData.lastName} onChange={e => updateField('lastName', e.target.value)} className={liveInputClass(fieldStatus('lastName'))} placeholder="e.g. Mwale" />
                  </Field>
                  <Field label="Other Names" {...fieldProps('otherNames')}>
                    <input type="text" value={formData.otherNames} onChange={e => updateField('otherNames', e.target.value)} className={liveInputClass(fieldStatus('otherNames'))} placeholder="e.g. Chanda" />
                  </Field>
                  <Field label="Date of Birth *" {...fieldProps('dob')}>
                    <input type="date" value={formData.dob} onChange={e => updateField('dob', e.target.value)} className={liveInputClass(fieldStatus('dob'))} />
                  </Field>
                  <Field label="Gender">
                    <select value={formData.gender} onChange={e => updateField('gender', e.target.value)} className={liveInputClass('idle')}>
                      <option>Male</option><option>Female</option>
                    </select>
                  </Field>
                  <Field label="Marital Status">
                    <select value={formData.maritalStatus} onChange={e => updateField('maritalStatus', e.target.value)} className={liveInputClass('idle')}>
                      <option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                    </select>
                  </Field>
                </div>

                <hr className="border-slate-200" />
                <div className="flex items-center gap-2 mb-2"><CreditCard className="w-4 h-4 text-slate-400" /><h4 className="font-semibold text-slate-900">Existing Identification (if any)</h4></div>
                <div className="grid md:grid-cols-2 gap-6">
                  <Field label="Legacy NRC Number" {...fieldProps('nrcNumber')}>
                    <input type="text" placeholder="e.g. 123456/10/1" value={formData.nrcNumber} onChange={e => updateField('nrcNumber', e.target.value)} className={liveInputClass(fieldStatus('nrcNumber'))} />
                  </Field>
                  <Field label="Passport Number" {...fieldProps('passportNumber')}>
                    <input type="text" placeholder="e.g. ZM123456" value={formData.passportNumber} onChange={e => updateField('passportNumber', e.target.value)} className={liveInputClass(fieldStatus('passportNumber'))} />
                  </Field>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button onClick={() => { if (validate(['firstName', 'lastName', 'dob', 'nrcNumber'])) setStep(2); }} className="flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow">
                    Continue <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Contact */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 px-8 py-5 bg-slate-50 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-900" />
                <h3 className="text-lg font-bold text-slate-900">Contact & Address</h3>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Field label="Mobile Phone" {...fieldProps('phone')}>
                    <input type="tel" placeholder="+260 97X XXX XXX" value={formData.phone} onChange={e => updateField('phone', e.target.value)} className={liveInputClass(fieldStatus('phone'))} />
                  </Field>
                  <Field label="Email Address" {...fieldProps('email')}>
                    <input type="email" placeholder="name@example.com" value={formData.email} onChange={e => updateField('email', e.target.value)} className={liveInputClass(fieldStatus('email'))} />
                  </Field>
                  <Field label="Province">
                    <select value={formData.province} onChange={e => updateField('province', e.target.value)} className={liveInputClass('idle')}>
                      {['Lusaka','Copperbelt','Southern','Eastern','Northern','Western','North-Western','Luapula','Muchinga','Central'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="Residential Address" {...fieldProps('address')}>
                    <input type="text" placeholder="Plot 123, Cairo Road, Lusaka" value={formData.address} onChange={e => updateField('address', e.target.value)} className={liveInputClass(fieldStatus('address'))} />
                  </Field>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <button onClick={() => setStep(1)} className="border-2 border-blue-900 text-blue-900 px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition">Back</button>
                  <button onClick={() => { if (validate(['phone', 'email'])) setStep(3); }} className="flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow">
                    Review Application <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 px-8 py-5 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Review & Submit Application</h3>
                <p className="text-sm text-slate-500 mt-1">Please confirm your details before submitting. You cannot edit after submission.</p>
              </div>
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {[
                    ['Full Name', `${formData.firstName} ${formData.otherNames} ${formData.lastName}`.trim()],
                    ['Date of Birth', formData.dob],
                    ['Gender', formData.gender],
                    ['Marital Status', formData.maritalStatus],
                    ['Legacy NRC', formData.nrcNumber || 'Not provided'],
                    ['Province', formData.province],
                    ['Phone', formData.phone || 'Not provided'],
                    ['Email', formData.email || 'Not provided'],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="font-semibold text-slate-900">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
                  By submitting, I declare that all information provided is true and accurate. I understand that providing false information is a criminal offence.
                </div>

                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="border-2 border-blue-900 text-blue-900 px-6 py-2 rounded-lg font-bold hover:bg-blue-50 transition">Back</button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-3 bg-blue-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed">
                    {isSubmitting ? <><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />Submitting...</> : <><Send className="w-5 h-5" />Submit Application</>}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
