import { useState } from 'react';
import { Shield, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

export type PortalRole = 'OFFICER' | 'HOSPITAL' | 'GSB';

interface Props {
  role: PortalRole;
  onSuccess: () => void;
  onCancel: () => void;
}

// Mock credentials per role — replace with real API call to officers table
const MOCK_CREDENTIALS: Record<PortalRole, { username: string; password: string; title: string; description: string }> = {
  OFFICER: {
    username: 'officer@mha.gov.zm',
    password: 'Officer@2026',
    title: 'National ID Officer Login',
    description: 'Authorized Government Registration Officers Only',
  },
  HOSPITAL: {
    username: 'hospital@mha.gov.zm',
    password: 'Hospital@2026',
    title: 'Hospital & Clinic CRVS Login',
    description: 'Authorized Medical Personnel & Health Workers Only',
  },
  GSB: {
    username: 'admin@mha.gov.zm',
    password: 'ZIDCRadmin@2026',
    title: 'GSB Orchestrator Login',
    description: 'Ministry System Administrators Only',
  },
};

export default function LoginScreen({ role, onSuccess, onCancel }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const creds = MOCK_CREDENTIALS[role];

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Both username and password are required.');
      return;
    }

    if (attempts >= 5) {
      setError('Account locked after 5 failed attempts. Contact your system administrator.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate API call delay
    await new Promise(r => setTimeout(r, 1000));

    if (username.trim() === creds.username && password === creds.password) {
      setIsLoading(false);
      onSuccess();
    } else {
      setAttempts(a => a + 1);
      setIsLoading(false);
      setError(`Invalid credentials. ${4 - attempts} attempt(s) remaining before lockout.`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Official Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-2 rounded-lg shadow-xl">
              <img src="/COA2.jpg" alt="Coat of Arms" className="h-16" />
            </div>
          </div>
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">
            Republic of Zambia
          </p>
          <h1 className="text-white text-xl font-extrabold uppercase tracking-wide">
            ZIDCR Secure Portal
          </h1>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-blue-900 px-8 py-5 border-b border-blue-800 flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-300 flex-shrink-0" />
            <div>
              <h2 className="text-white font-bold text-lg">{creds.title}</h2>
              <p className="text-blue-300 text-xs mt-0.5">{creds.description}</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 space-y-5">
            {error && (
              <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Official Email / Employee ID
              </label>
              <input
                type="email"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={creds.username}
                disabled={attempts >= 5}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••••••"
                  disabled={attempts >= 5}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Attempt indicator */}
            {attempts > 0 && attempts < 5 && (
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full ${i < attempts ? 'bg-red-500' : 'bg-slate-600'}`} />
                ))}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoading || attempts >= 5}
              className="w-full flex items-center justify-center gap-3 bg-blue-900 hover:bg-blue-800 text-white py-3.5 rounded-lg font-bold transition shadow-lg disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> Authenticating...</>
              ) : (
                <><LogIn className="w-5 h-5" /> Authenticate & Enter</>
              )}
            </button>

            <button
              onClick={onCancel}
              className="w-full text-slate-400 hover:text-white transition text-sm font-medium py-2"
            >
              ← Return to Main Portal
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-slate-600 text-xs mt-6">
          This system is for authorized personnel only. All access is logged and monitored.
          Unauthorized access is a criminal offence under the Zambia Cybersecurity Act.
        </p>
      </div>
    </div>
  );
}
