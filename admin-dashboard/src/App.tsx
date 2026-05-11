import { useState } from 'react';
import ApplicationFlow from './components/ApplicationFlow';
import ApplicationStatus from './components/ApplicationStatus';
import OfficerReviewDashboard from './components/OfficerReviewDashboard';
import { ShieldCheck, UserPlus, FileText, Globe, Server, Search, Building2 } from 'lucide-react';
import VitalRegistrationFlow from './components/VitalRegistrationFlow';
import GsbDashboard from './components/GsbDashboard';
import LoginScreen, { PortalRole } from './components/LoginScreen';

const T = {
  EN: {
    title: "Zambia Integrated Digital ID & Civil Registry (ZIDCR)",
    official: "Official Portal",
    citizen: "Apply for National ID",
    citizen_sub: "Citizen Application",
    status: "Check Application Status",
    status_sub: "Track My Application",
    officer: "Officer Review & Approval",
    officer_sub: "DNRPC Officers Only",
    crvs: "Birth & Death Notices",
    crvs_sub: "Hospitals & Clinics Only",
    gsb: "Government Service Bus (GSB)",
    gsb_sub: "System Administrators Only",
    start: "Begin Application",
    track: "Track Application",
    review: "Review Applications",
    notice: "Issue Notice",
    view_gsb: "Open Sandbox"
  },
  BEMBA: {
    title: "Zambia Integrated Digital ID ne Civil Registry (ZIDCR)",
    official: "Chipata cha Boma",
    citizen: "Funjisha Ndalama ya ID",
    citizen_sub: "Pofunjisha",
    status: "Shicheka Ifyakufwailisha",
    status_sub: "Icheka Ifyakufwailisha",
    officer: "Kapokola wa Ndalama ya ID",
    officer_sub: "DNRPC Kapokola Fye",
    crvs: "Kulembesha Kubadwa na Ukufwa",
    crvs_sub: "Cipatala na Kiliniki Fye",
    gsb: "Government Service Bus (GSB)",
    gsb_sub: "System Administrators Fye",
    start: "Tatika Ukulembesha",
    track: "Icheka Ifyakufwailisha",
    review: "Shibilo Ifilombe",
    notice: "Pesha Ichibilo",
    view_gsb: "Ingila GSB Sandbox"
  },
  NYANJA: {
    title: "Zambia Integrated Digital ID ndi Civil Registry (ZIDCR)",
    official: "Chipata cha Boma",
    citizen: "Kulembetsa ID ya Dziko",
    citizen_sub: "Kulembetsa",
    status: "Onani Zomwe Mwafunsa",
    status_sub: "Tsatira Kulembetsa",
    officer: "Woyang'anira ID ya Dziko",
    officer_sub: "DNRPC Officers Okha",
    crvs: "Kuzindikira Kubadwa ndi Imfa",
    crvs_sub: "Chipatala ndi Kiliniki Okha",
    gsb: "Government Service Bus (GSB)",
    gsb_sub: "System Administrators Okha",
    start: "Yambani Kulembetsa",
    track: "Tsatira Kulembetsa",
    review: "Onani Zomwe Mwafunsa",
    notice: "Pereka Chidziwitso",
    view_gsb: "Tsegulani GSB Sandbox"
  }
};

function App() {
  const [role, setRole] = useState<'NONE' | 'CITIZEN' | 'STATUS' | 'OFFICER' | 'HOSPITAL' | 'GSB'>('NONE');
  const [loginTarget, setLoginTarget] = useState<PortalRole | null>(null);
  const [lang, setLang] = useState<'EN'|'BEMBA'|'NYANJA'>('EN');

  const t = T[lang] || T['EN'];

  if (loginTarget) {
    return (
      <LoginScreen
        role={loginTarget}
        onSuccess={() => { setRole(loginTarget); setLoginTarget(null); }}
        onCancel={() => setLoginTarget(null)}
      />
    );
  }

  if (role === 'CITIZEN') return <ApplicationFlow onBack={() => setRole('NONE')} />;
  if (role === 'STATUS')  return <ApplicationStatus onBack={() => setRole('NONE')} />;
  if (role === 'OFFICER') return <OfficerReviewDashboard onBack={() => setRole('NONE')} />;
  if (role === 'HOSPITAL') return <VitalRegistrationFlow onBack={() => setRole('NONE')} />;
  if (role === 'GSB')    return <GsbDashboard onBack={() => setRole('NONE')} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Official Government Header */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1 rounded border border-white/20">
              <img src="/COA2.jpg" alt="Zambia Coat of Arms" className="h-16" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-wide">{t.title}</h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-blue-100">
            <div className="flex items-center gap-2 bg-blue-800 px-3 py-1.5 rounded-lg border border-blue-700">
              <Globe className="w-4 h-4" />
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value as any)}
                className="bg-transparent text-white outline-none cursor-pointer font-bold"
              >
                <option value="EN" className="text-black">English</option>
                <option value="BEMBA" className="text-black">Bemba</option>
                <option value="NYANJA" className="text-black">Nyanja</option>
                <option value="EN" className="text-black">Tonga (Coming Soon)</option>
                <option value="EN" className="text-black">Lozi (Coming Soon)</option>
                <option value="EN" className="text-black">Kaonde (Coming Soon)</option>
                <option value="EN" className="text-black">Lunda (Coming Soon)</option>
              </select>
            </div>
            <a href="#" className="hover:text-white transition">{t.official}</a>
            <a href="#" className="hover:text-white transition">Verification</a>
            <a href="#" className="hover:text-white transition">Help Center</a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl font-extrabold text-slate-900 mb-4">Welcome</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Select the appropriate portal below. All access is monitored and logged.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl animate-fade-in" style={{ animationDelay: '0.1s' }}>

          {/* 1 — Citizen Application */}
          <button onClick={() => setRole('CITIZEN')}
            className="group bg-white p-10 rounded-xl border-2 border-slate-300 shadow-md hover:shadow-2xl hover:border-blue-900 transition-all text-left flex flex-col items-start focus:outline-none">
            <div className="bg-blue-100 p-4 rounded-lg mb-6 group-hover:bg-blue-900/20 transition-colors">
              <UserPlus className="w-8 h-8 text-blue-900" />
            </div>
            <div className="mb-2">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">{t.citizen_sub}</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{t.citizen}</h3>
            </div>
            <p className="text-slate-600 flex-1 text-sm leading-relaxed">
              Apply for your National ID (eNRC). Submit your personal details and receive a unique Application Reference Number. Your application will be reviewed by a DNRPC officer.
            </p>
            <div className="mt-8 flex items-center justify-center w-full bg-blue-900 text-white py-3 rounded-lg font-extrabold shadow-md hover:bg-blue-800 transition-colors">
              {t.start} <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          {/* 2 — Check Application Status */}
          <button onClick={() => setRole('STATUS')}
            className="group bg-white p-10 rounded-xl border-2 border-slate-300 shadow-md hover:shadow-2xl hover:border-teal-600 transition-all text-left flex flex-col items-start focus:outline-none">
            <div className="bg-teal-100 p-4 rounded-lg mb-6 group-hover:bg-teal-600/20 transition-colors">
              <Search className="w-8 h-8 text-teal-700" />
            </div>
            <div className="mb-2">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-widest">{t.status_sub}</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{t.status}</h3>
            </div>
            <p className="text-slate-600 flex-1 text-sm leading-relaxed">
              Already applied? Enter your Application Reference Number to see if your application is Pending, Approved, or Rejected — and if rejected, see the reason why.
            </p>
            <div className="mt-8 flex items-center justify-center w-full bg-teal-700 text-white py-3 rounded-lg font-extrabold shadow-md hover:bg-teal-600 transition-colors">
              {t.track} <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          {/* 3 — Officer Review (PROTECTED) */}
          <button onClick={() => setLoginTarget('OFFICER')}
            className="group bg-white p-10 rounded-xl border-2 border-slate-300 shadow-md hover:shadow-2xl hover:border-blue-900 transition-all text-left flex flex-col items-start focus:outline-none">
            <div className="bg-slate-200 p-4 rounded-lg mb-6 group-hover:bg-blue-900/20 transition-colors">
              <ShieldCheck className="w-8 h-8 text-slate-900 group-hover:text-blue-900 transition-colors" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.officer_sub}</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{t.officer}</h3>
              </div>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider self-start mt-1">Secured</span>
            </div>
            <p className="text-slate-600 flex-1 text-sm leading-relaxed">
              DNRPC officers review citizen applications, capture biometrics in-person, and issue or reject National ID credentials with documented reasons.
            </p>
            <div className="mt-8 flex items-center justify-center w-full bg-blue-900 text-white py-3 rounded-lg font-extrabold shadow-md hover:bg-blue-800 transition-colors">
              {t.review} <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          {/* 4 — Hospital Birth & Death Notices (PROTECTED) */}
          <button onClick={() => setLoginTarget('HOSPITAL')}
            className="group bg-white p-10 rounded-xl border-2 border-slate-300 shadow-md hover:shadow-2xl hover:border-red-700 transition-all text-left flex flex-col items-start focus:outline-none">
            <div className="bg-red-100 p-4 rounded-lg mb-6 group-hover:bg-red-200 transition-colors">
              <FileText className="w-8 h-8 text-red-700" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-widest">{t.crvs_sub}</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{t.crvs}</h3>
              </div>
              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider self-start mt-1">Secured</span>
            </div>
            <p className="text-slate-600 flex-1 text-sm leading-relaxed">
              Doctors, midwives, and authorised hospital personnel issue official Birth & Death Notices. Notices are automatically forwarded to DNRPC for final approval.
            </p>
            <div className="mt-8 flex items-center justify-center w-full bg-red-700 text-white py-3 rounded-lg font-extrabold shadow-md hover:bg-red-600 transition-colors">
              {t.notice} <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          {/* GSB Sandbox Dashboard Card */}
          <button
            onClick={() => setRole('GSB')}
            className="group bg-white p-10 rounded-xl border-2 border-slate-300 shadow-md hover:shadow-2xl hover:border-purple-700 transition-all text-left flex flex-col items-start focus:outline-none md:col-span-2"
          >
            <div className="bg-slate-200 p-4 rounded-lg mb-6 group-hover:bg-purple-200 transition-colors">
              <Server className="w-8 h-8 text-slate-900 group-hover:text-purple-700 transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">{t.gsb}</h3>
            <p className="text-slate-800 flex-1 font-medium">
              Integration middleware orchestrator. Test Mobile Money (MTN, Airtel), Card Networks (ISO 8583), and live KYC data sharing consent.
            </p>
            <div className="mt-4 flex items-center justify-center w-full bg-purple-900 text-white py-3 rounded-lg font-extrabold shadow-md hover:bg-purple-800 transition-colors">
              {t.view_gsb} <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 border-b border-white/20 pb-8">
            
            {/* Column 1 */}
            <div className="flex flex-col space-y-3">
              <h4 className="font-bold text-lg mb-2">Agency Information</h4>
              <a href="#" className="hover:underline text-gray-200">About</a>
              <a href="#" className="hover:underline text-gray-200">Budget & Performance</a>
              <a href="#" className="hover:underline text-gray-200">Archives</a>
              <a href="#" className="hover:underline text-gray-200">FAQ</a>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col space-y-3">
              <h4 className="font-bold text-lg mb-2">Policies & Legal</h4>
              <a href="#" className="hover:underline text-gray-200">Accessibility</a>
              <a href="#" className="hover:underline text-gray-200">Legal Policies & Disclaimers</a>
              <a href="#" className="hover:underline text-gray-200">Privacy</a>
              <a href="#" className="hover:underline text-gray-200">Data protection Act</a>
              <a href="#" className="hover:underline text-gray-200">Policy Statement</a>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col space-y-3">
              <h4 className="font-bold text-lg mb-2">Important Links</h4>
              <a href="#" className="hover:underline text-gray-200">For Employees</a>
              <a href="#" className="hover:underline text-gray-200">Office of the Inspector General</a>
              <a href="#" className="hover:underline text-gray-200">Vulnerability Disclosure</a>
              <a href="#" className="hover:underline text-gray-200">Multilingual</a>
              <a href="#" className="hover:underline text-gray-200">Vote.gov</a>
            </div>

            {/* Column 4 - Contact & Logo */}
            <div className="flex flex-col items-start space-y-4">
              <div>
                <img src="/COA2.jpg" alt="Zambia Coat of Arms" className="h-16" />
              </div>
              <p className="text-sm font-semibold mt-4">Have a question about Government Services?</p>
              <a href="#" className="text-sm hover:underline font-bold text-blue-200">
                Contact Ministry of Home Affairs and Internal Security
              </a>
            </div>
            
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-300">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Building2 className="w-5 h-5" />
              <span>© 2026 Government of the Republic of Zambia. All rights reserved.</span>
            </div>
            <span>Zambia Integrated Digital ID & Civil Registry</span>
          </div>

        </div>
      </footer>
    </div>
  );
}

export default App;
