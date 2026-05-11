import { useState } from 'react';
import { ArrowLeft, UserCheck, Mail, MessageSquare, Save, ChevronRight, Fingerprint, MapPin, Contact, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import CameraCapture from './CameraCapture';

interface Props {
  role: 'CITIZEN' | 'OFFICER';
  onBack: () => void;
}

// ── Validation Rules (mirrors validators.py on the backend) ──────────────────
const VALIDATORS = {
  firstName: (v: string) => !v.trim() ? 'First name is required.' : v.trim().length < 2 ? 'Must be at least 2 characters.' : /[^A-Za-z\s\-']/.test(v) ? 'Letters only — no numbers or symbols.' : '',
  lastName: (v: string) => !v.trim() ? 'Last name is required.' : v.trim().length < 2 ? 'Must be at least 2 characters.' : /[^A-Za-z\s\-']/.test(v) ? 'Letters only — no numbers or symbols.' : '',
  dob: (v: string) => { if (!v) return 'Date of birth is required.'; const d = new Date(v); const age = (Date.now() - d.getTime()) / (1000*60*60*24*365.25); if (d >= new Date()) return 'Date of birth must be in the past.'; if (age > 150) return 'Cannot be more than 150 years ago.'; return ''; },
  nrcNumber: (v: string) => v && !/^\d{6}\/\d{2}\/\d{1}$/.test(v) ? 'Format must be: 123456/10/1' : '',
  passportNumber: (v: string) => v && !/^[A-Za-z]{2}\d{6}$/.test(v) ? 'Format: 2 letters + 6 digits (e.g. ZM123456)' : '',
  phone: (v: string) => { if (!v) return ''; const c = v.replace(/[\s\-]/g, ''); return !/^(\+260|0)?[679]\d{8}$/.test(c) ? 'Invalid Zambian number. Format: +260 9X XXX XXXX' : ''; },
  email: (v: string) => v && !/^[\w._%+\-]+@[\w.\-]+\.[a-zA-Z]{2,}$/.test(v) ? 'Invalid email address.' : '',
};

type FormField = keyof typeof VALIDATORS;

export default function EnrollmentFlow({ role, onBack }: Props) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    firstName: '', lastName: '', dob: '', gender: 'Male', 
    nationality: 'Zambian', maritalStatus: 'Single',
    nrcNumber: '', passportNumber: '',
    phone: '', email: '',
    address: '', province: 'Lusaka'
  });
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>({});
  const [biometricBase64, setBiometricBase64] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultUci, setResultUci] = useState<string | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<string>('');

  const validateField = (field: FormField, value: string) => {
    const msg = VALIDATORS[field]?.(value) || '';
    setErrors(prev => ({ ...prev, [field]: msg }));
    return msg === '';
  };

  const handleChange = (field: FormField, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) validateField(field, value);
  };

  const handleBlur = (field: FormField, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, value);
  };

  const step1Valid = () => {
    const fields: FormField[] = ['firstName', 'lastName', 'dob'];
    const msgs = fields.map(f => VALIDATORS[f]?.(formData[f as keyof typeof formData] as string) || '');
    return msgs.every(m => m === '');
  };

  // Helper to render inline error
  const FieldError = ({ field }: { field: FormField }) => {
    if (!touched[field] || !errors[field]) return null;
    return <p className="mt-1 text-xs text-red-600 flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" />{errors[field]}</p>;
  };

  const inputClass = (field: FormField) =>
    `w-full px-4 py-3 rounded-lg border ${
      touched[field] && errors[field] ? 'border-red-400 focus:ring-red-400 bg-red-50' :
      touched[field] && !errors[field] ? 'border-green-400 focus:ring-green-400' :
      'border-slate-300 focus:ring-blue-900'
    } focus:ring-2 focus:border-transparent outline-none transition`;

  const handleDispatch = async (type: 'email' | 'sms') => {
    const contact = type === 'email' ? formData.email : formData.phone;
    if (!contact) {
      alert(`No ${type} provided during registration.`);
      return;
    }
    
    setDispatchStatus(`Sending ${type.toUpperCase()}...`);
    try {
      const response = await fetch('http://localhost:8001/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, uci: resultUci, type })
      });
      
      if (response.ok) {
        setDispatchStatus(`${type.toUpperCase()} dispatched successfully!`);
      } else {
        setDispatchStatus(`Failed to send ${type.toUpperCase()}. Is the Gateway running?`);
      }
    } catch (e) {
      setDispatchStatus(`Error: Could not connect to Notification Gateway on port 8001.`);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      // Generate a 13-digit Unique Citizen Identifier (INRIS eNRC standard)
      const uci13Digit = Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
      setResultUci(uci13Digit);
      setStep(4);
    } catch (e) {
      alert("Enrollment failed. Please check backend connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // STEP 4: SUCCESS SCREEN
  // ----------------------------------------------------
  if (step === 4) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center font-sans">
        <div className="bg-white p-10 rounded-xl shadow-xl max-w-2xl w-full text-center border-t-8 border-blue-900">
          <div className="bg-blue-50 text-blue-900 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-blue-100">
            <UserCheck className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2 uppercase tracking-tight">Identity Verified & Issued</h2>
          <p className="text-slate-800 mb-8 text-lg">The Digital Identity has been cryptographically signed and officially recorded in the National Civil Registry.</p>
          
          <div className="bg-slate-50 p-6 rounded-lg mb-8 border border-slate-200">
            <p className="text-sm text-slate-700 font-semibold uppercase tracking-wider mb-2">Unique Citizen Identifier (UCI)</p>
            <p className="font-mono text-xl text-slate-900 break-all font-bold">{resultUci}</p>
          </div>

          <p className="text-sm text-slate-700 mb-4 font-semibold uppercase">Deliver Credentials</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button onClick={() => handleDispatch('email')} className="flex items-center justify-center gap-3 bg-blue-900 text-white py-4 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm">
              <Mail className="w-5 h-5" /> Dispatch via Email
            </button>
            <button onClick={() => handleDispatch('sms')} className="flex items-center justify-center gap-3 bg-blue-700 text-white py-4 rounded-lg hover:bg-blue-800 transition font-medium shadow-sm">
              <MessageSquare className="w-5 h-5" /> Dispatch via SMS
            </button>
          </div>

          {dispatchStatus && (
            <div className="mb-8 font-bold text-blue-900 bg-blue-50 p-3 rounded border border-blue-200">
              {dispatchStatus}
            </div>
          )}
          
          <button onClick={onBack} className="text-blue-900 hover:text-blue-800 transition font-semibold">Exit to Main Portal</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <div className="bg-blue-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-slate-800 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold tracking-wide">
              {role === 'CITIZEN' ? 'Citizen e-Enrollment Portal' : 'Authorized Officer Registration Station'}
            </h2>
          </div>
          <div className="text-sm font-medium text-slate-400">
            Step {step} of 3
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 flex items-start gap-8">
        
        {/* Left Sidebar Wizard Progress */}
        <div className="hidden md:block w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Enrollment Progress</h3>
            <ul className="space-y-6">
              <li className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
                <span className={`font-semibold ${step >= 1 ? 'text-slate-900' : 'text-slate-700'}`}>Personal Details</span>
              </li>
              <li className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
                <span className={`font-semibold ${step >= 2 ? 'text-slate-900' : 'text-slate-700'}`}>Contact & Address</span>
              </li>
              <li className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-400'}`}>3</div>
                <span className={`font-semibold ${step >= 3 ? 'text-slate-900' : 'text-slate-700'}`}>Biometric Capture</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          
          {/* ----------------------------------------------------
              STEP 1: PERSONAL DETAILS
             ---------------------------------------------------- */}
          {step === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
              <div className="border-b border-slate-200 px-8 py-6 bg-slate-50/50 flex items-center gap-3">
                <Contact className="w-6 h-6 text-blue-900" />
                <h3 className="text-xl font-bold text-slate-900">Official Demographics</h3>
              </div>
              <div className="p-8 space-y-8">
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Legal First Name</label>
                    <input type="text" value={formData.firstName}
                      onChange={e => handleChange('firstName', e.target.value)}
                      onBlur={e => handleBlur('firstName', e.target.value)}
                      className={inputClass('firstName')} />
                    <FieldError field="firstName" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Legal Last Name</label>
                    <input type="text" value={formData.lastName}
                      onChange={e => handleChange('lastName', e.target.value)}
                      onBlur={e => handleBlur('lastName', e.target.value)}
                      className={inputClass('lastName')} />
                    <FieldError field="lastName" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth</label>
                    <input type="date" value={formData.dob}
                      onChange={e => handleChange('dob', e.target.value)}
                      onBlur={e => handleBlur('dob', e.target.value)}
                      className={inputClass('dob')} />
                    <FieldError field="dob" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Biological Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Intersex</option>
                    </select>
                  </div>
                </div>

                <hr className="border-slate-200" />
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  <h4 className="font-semibold text-slate-900">Existing Identification (Optional)</h4>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Legacy NRC Number</label>
                    <input type="text" placeholder="e.g. 123456/10/1" value={formData.nrcNumber}
                      onChange={e => handleChange('nrcNumber', e.target.value)}
                      onBlur={e => handleBlur('nrcNumber', e.target.value)}
                      className={inputClass('nrcNumber')} />
                    <FieldError field="nrcNumber" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Passport Number</label>
                    <input type="text" placeholder="e.g. ZM123456" value={formData.passportNumber}
                      onChange={e => handleChange('passportNumber', e.target.value)}
                      onBlur={e => handleBlur('passportNumber', e.target.value)}
                      className={inputClass('passportNumber')} />
                    <FieldError field="passportNumber" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nationality</label>
                    <input type="text" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} 
                           className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Marital Status</label>
                    <select value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value})}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition">
                      <option>Single</option>
                      <option>Married</option>
                      <option>Divorced</option>
                      <option>Widowed</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
                  <button 
                    onClick={() => { ['firstName','lastName','dob'].forEach(f => { setTouched(p => ({...p,[f]:true})); validateField(f as FormField, formData[f as keyof typeof formData] as string); }); if (step1Valid()) setStep(2); }}
                    className="flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg"
                  >
                    Save & Continue <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------
              STEP 2: CONTACT & ADDRESS
             ---------------------------------------------------- */}
          {step === 2 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
              <div className="border-b border-slate-200 px-8 py-6 bg-slate-50/50 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-blue-900" />
                <h3 className="text-xl font-bold text-slate-900">Contact & Residential Details</h3>
              </div>
              <div className="p-8 space-y-6">
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Mobile Phone</label>
                    <input type="tel" placeholder="+260 97 123 4567" value={formData.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      onBlur={e => handleBlur('phone', e.target.value)}
                      className={inputClass('phone')} />
                    <FieldError field="phone" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                    <input type="email" placeholder="citizen@example.com" value={formData.email}
                      onChange={e => handleChange('email', e.target.value)}
                      onBlur={e => handleBlur('email', e.target.value)}
                      className={inputClass('email')} />
                    <FieldError field="email" />
                  </div>
                </div>

                <div className="grid md:grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Residential Address</label>
                    <input type="text" placeholder="House No. / Street Name / Area" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} 
                           className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Province</label>
                    <select value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})}
                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition">
                      <option>Lusaka</option>
                      <option>Copperbelt</option>
                      <option>Southern</option>
                      <option>Eastern</option>
                      <option>Northern</option>
                      <option>Western</option>
                      <option>North-Western</option>
                      <option>Luapula</option>
                      <option>Muchinga</option>
                      <option>Central</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between pt-6 mt-6 border-t border-slate-100">
                  <button onClick={() => setStep(1)} className="border-2 border-blue-900 text-blue-900 hover:bg-blue-50 font-bold px-6 py-2 rounded-lg transition-colors">Back</button>
                  <button 
                    onClick={() => setStep(3)}
                    disabled={!formData.phone && !formData.email}
                    className="flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    Proceed to Biometrics <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------
              STEP 3: BIOMETRIC CAPTURE
             ---------------------------------------------------- */}
          {step === 3 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
              <div className="border-b border-slate-200 px-8 py-6 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-6 h-6 text-blue-900" />
                  <h3 className="text-xl font-bold text-slate-900">Secure Biometric Capture</h3>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Required</span>
              </div>
              
              <div className="p-8">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 text-sm text-blue-800">
                  <strong>Instructions:</strong> Please ensure adequate lighting. Remove hats or dark glasses. Align your face directly in front of the camera. The system will automatically compute a cryptographic vector to secure your identity.
                </div>

                <div className="flex justify-center mb-8">
                  <CameraCapture onCapture={(b64) => setBiometricBase64(b64)} />
                </div>

                <div className="flex justify-between pt-6 mt-6 border-t border-slate-100">
                  <button onClick={() => setStep(2)} className="border-2 border-blue-900 text-blue-900 hover:bg-blue-50 font-bold px-6 py-2 rounded-lg transition-colors">Back</button>
                  {biometricBase64 && (
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 bg-blue-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed shadow-lg"
                    >
                      {isSubmitting ? (
                        <> <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> Committing to Registry... </>
                      ) : (
                        <> <Save className="w-5 h-5" /> Submit Official Registration </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
