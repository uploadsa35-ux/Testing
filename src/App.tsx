import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, ArrowRight, Server, CheckCircle, AlertCircle, Send, Code } from 'lucide-react';

export default function App() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testPath, setTestPath] = useState('/health');
  const [testMethod, setTestMethod] = useState('GET');
  const [testBody, setTestBody] = useState('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch health:', err);
        setLoading(false);
      });
  }, []);

  const runTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const options: RequestInit = {
        method: testMethod,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      if (testMethod !== 'GET' && testMethod !== 'HEAD') {
        options.body = testBody;
      }

      const res = await fetch(`/proxy${testPath}`, options);
      const data = await res.json();
      setTestResult({
        status: res.status,
        ok: res.ok,
        data: data
      });
    } catch (err: any) {
      setTestResult({
        error: true,
        message: err.message
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">MCP API Proxy</h1>
          </div>
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-3 h-3 bg-gray-600 rounded-full animate-pulse" />
            ) : status?.status === 'ok' ? (
              <div className="flex items-center gap-2 text-xs font-medium text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                <CheckCircle className="w-3 h-3" />
                System Online
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-red-400 bg-red-400/10 px-3 py-1 rounded-full border border-red-400/20">
                <AlertCircle className="w-3 h-3" />
                System Offline
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Info & Status */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
                Secure Header Injection <br />
                <span className="text-orange-500">API Gateway</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                This proxy acts as a bridge between your web application and the MCP API, 
                automatically injecting the required <code className="text-orange-400 bg-orange-400/10 px-1 rounded">X-Api-Key</code> header.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Server className="w-4 h-4 text-orange-500" />
                  Configuration
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Target API</span>
                  <div className="font-mono text-sm bg-black/40 p-2 rounded border border-white/5 break-all">
                    {status?.target || 'Loading...'}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Proxy Endpoint</span>
                  <div className="font-mono text-sm bg-black/40 p-2 rounded border border-white/5">
                    {window.location.origin}/proxy/*
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500">How to use</h3>
              <div className="space-y-3">
                {[
                  "Replace your API base URL with the proxy URL.",
                  "All requests to /proxy will be forwarded to the target.",
                  "The X-Api-Key is injected server-side automatically.",
                  "CORS is handled by the proxy for your frontend."
                ].map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-orange-500">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-300">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Test Interface */}
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <h3 className="font-bold flex items-center gap-2">
                  <Code className="w-4 h-4 text-orange-500" />
                  Request Tester
                </h3>
                <div className="flex gap-1">
                  {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
                    <button
                      key={m}
                      onClick={() => setTestMethod(m)}
                      className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                        testMethod === m 
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                          : 'bg-white/5 text-gray-500 hover:bg-white/10'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Path</label>
                    <div className="flex">
                      <div className="bg-white/5 border border-white/10 border-r-0 px-4 flex items-center text-gray-500 text-sm rounded-l-xl">
                        /proxy
                      </div>
                      <input 
                        type="text" 
                        value={testPath}
                        onChange={(e) => setTestPath(e.target.value)}
                        className="flex-1 bg-transparent border border-white/10 px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50 rounded-r-xl"
                        placeholder="/v1/users"
                      />
                    </div>
                  </div>

                  {testMethod !== 'GET' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Request Body (JSON)</label>
                      <textarea 
                        value={testBody}
                        onChange={(e) => setTestBody(e.target.value)}
                        className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                  )}

                  <button 
                    onClick={runTest}
                    disabled={testLoading}
                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-xl shadow-orange-600/10"
                  >
                    {testLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Send Request
                        <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

                {testResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Response</label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        testResult.ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        HTTP {testResult.status || 'ERROR'}
                      </span>
                    </div>
                    <pre className="w-full max-h-64 overflow-auto bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-300">
                      {JSON.stringify(testResult.data || testResult, null, 2)}
                    </pre>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 text-center">
        <p className="text-gray-600 text-xs">
          Built with Node.js & Express &bull; Secure Proxy Gateway &bull; 2026
        </p>
      </footer>
    </div>
  );
}
