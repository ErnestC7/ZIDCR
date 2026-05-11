import { useState, useEffect } from 'react';
import { ArrowLeft, Server, Activity, Smartphone, CreditCard, ShieldAlert, Zap, RefreshCw } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  service: string;
  status: string;
  details: string;
  amount: number;
}

export default function GsbDashboard({ onBack }: { onBack: () => void }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testUci, setTestUci] = useState("ZMB-1234567890123");

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('http://localhost:8002/api/v1/gsb/monitoring/logs');
      const data = await res.json();
      if (data && data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error("Could not fetch GSB logs", e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerTestTransaction = async (network: string, isIso: boolean = false) => {
    try {
      await fetch('http://localhost:8002/api/v1/gsb/orchestrate/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenUci: testUci,
          network: network,
          amount: Math.floor(Math.random() * 5000) + 100,
          transactionType: "GOVERNMENT_PAYMENT",
          isoMessageSupport: isIso
        })
      });
      fetchLogs();
    } catch (e) {
      alert("GSB Sandbox backend is not running on port 8002.");
    }
  };

  const triggerKycConsent = async () => {
    try {
      await fetch('http://localhost:8002/api/v1/gsb/kyc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenUci: testUci,
          consentToken: "MOCK_QR_CONSENT_TOKEN_123",
          requestingAgency: "ZANACO_BANK"
        })
      });
      fetchLogs();
    } catch (e) {
      alert("GSB Sandbox backend is not running on port 8002.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 font-sans flex flex-col">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-slate-800 transition text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Server className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-bold tracking-wide text-white">Government Service Bus (GSB) Orchestrator</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-bold text-green-400 uppercase tracking-widest">Sandbox Live</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid lg:grid-cols-3 gap-8">
        
        {/* Left Panel: Trigger Sandbox Transactions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-700 pb-3">
              <Zap className="w-5 h-5 text-yellow-500" /> API Test Harness
            </h3>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Test Subject UCI</label>
              <input type="text" value={testUci} onChange={e => setTestUci(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 font-mono text-sm" />
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile Money Disbursal</p>
              <button onClick={() => triggerTestTransaction('MTN_MOMO')} className="w-full flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-500 font-bold py-3 px-4 rounded-lg transition">
                <div className="flex items-center gap-3"><Smartphone className="w-5 h-5" /> MTN MoMo API</div>
                <span>→</span>
              </button>
              <button onClick={() => triggerTestTransaction('AIRTEL_MONEY')} className="w-full flex items-center justify-between bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-500 font-bold py-3 px-4 rounded-lg transition">
                <div className="flex items-center gap-3"><Smartphone className="w-5 h-5" /> Airtel Money API</div>
                <span>→</span>
              </button>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-4">Card Networks (ISO 8583/20022)</p>
              <button onClick={() => triggerTestTransaction('VISA', true)} className="w-full flex items-center justify-between bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-500 font-bold py-3 px-4 rounded-lg transition">
                <div className="flex items-center gap-3"><CreditCard className="w-5 h-5" /> Visa Gateway</div>
                <span>→</span>
              </button>
              
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-4">Data Sharing Consent</p>
              <button onClick={triggerKycConsent} className="w-full flex items-center justify-between bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-500 font-bold py-3 px-4 rounded-lg transition">
                <div className="flex items-center gap-3"><ShieldAlert className="w-5 h-5" /> Verify KYC Request</div>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Monitoring Dashboard */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
            <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> Integration Live Monitor
              </h3>
              <button onClick={fetchLogs} className={`p-2 rounded-lg hover:bg-slate-700 transition ${isRefreshing ? 'animate-spin text-blue-500' : 'text-slate-400'}`}>
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 p-0 overflow-y-auto max-h-[700px] bg-slate-900/50">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-800/80 sticky top-0 backdrop-blur-md z-10 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {logs.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12 text-slate-500">No transactions recorded yet.</td></tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/50 transition font-mono text-sm">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="px-6 py-4 font-bold text-slate-300">{log.service}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            log.status === 'SUCCESS' || log.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                            log.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                            'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {log.details}
                          {log.amount > 0 && <span className="ml-2 font-bold text-slate-200">K{log.amount.toFixed(2)}</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
