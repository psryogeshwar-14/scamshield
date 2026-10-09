import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import ShieldIcon from '../components/ShieldIcon';
import { useToast } from '../hooks/useToast';
import api from '../api/client';

const EXAMPLES = [
  {
    type: 'url',
    category: 'Phishing',
    label: 'PayPal Phishing Domain',
    badgeColor: 'border-rose-500/40 text-rose-300 bg-rose-950/40',
    value: 'http://secure-paypal-verify.login-update.xyz',
    description: 'Suspicious TLD + brand impersonation keywords',
  },
  {
    type: 'message',
    category: 'OTP Scam',
    label: 'Urgent Bank Block Threat',
    badgeColor: 'border-amber-500/40 text-amber-300 bg-amber-950/40',
    value: 'Your bank account will be blocked today. Share your OTP to stop it.',
    description: 'Urgency coercion + credential harvesting',
  },
  {
    type: 'url',
    category: 'Verified',
    label: 'Google Official Portal',
    badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40',
    value: 'https://www.google.com',
    description: 'Legitimate search engine over HTTPS',
  },
  {
    type: 'message',
    category: 'Job Fraud',
    label: 'Fake High-Pay Part-Time Job',
    badgeColor: 'border-purple-500/40 text-purple-300 bg-purple-950/40',
    value: 'Congratulations! You are selected for high-pay online part-time job. Earn $300/day. Join Telegram and pay $20 fee to start immediately.',
    description: 'Advance-fee fraud + Telegram pivot',
  },
];

const SCAN_STEPS = [
  'Parsing lexical and structural tokens...',
  'Evaluating 11-point heuristic threat model...',
  'Querying Google Safe Browsing v4 threat database...',
  'Synthesizing plain-language analysis with Gemini AI...',
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('url'); // 'url' | 'message'
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Rotate loading step messages for realism
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % SCAN_STEPS.length);
    }, 700);
    return () => clearInterval(interval);
  }, [loading]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setError(null);
  };

  const handleApplyExample = (example) => {
    setActiveTab(example.type);
    setInput(example.value);
    setError(null);
    addToast(`Loaded ${example.category} sample: ${example.label}`, 'info');
  };

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInput(text);
          setError(null);
          addToast('Pasted from clipboard!', 'success');
        }
      } else {
        addToast('Clipboard access not permitted by browser.', 'warning');
      }
    } catch {
      addToast('Could not read clipboard. Please paste manually.', 'info');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent duplicate concurrent in-flight submissions
    const trimmed = input.trim();

    if (!trimmed) {
      setError(
        activeTab === 'url'
          ? 'Please enter or paste a URL to analyze.'
          : 'Please enter or paste a message to analyze.'
      );
      return;
    }

    setError(null);
    setLoading(true);
    setStepIndex(0);

    try {
      const response =
        activeTab === 'url'
          ? await api.analyzeUrl(trimmed)
          : await api.analyzeMessage(trimmed);

      addToast('Threat analysis complete!', 'success');
      const resultData = response.data;
      navigate(`/result/${resultData.id || 'current'}`, { state: { result: resultData } });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during security analysis.');
      addToast('Analysis failed. Please check the notice.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const maxLength = activeTab === 'url' ? 2000 : 5000;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-10 xl:px-12 py-5 lg:py-6 animate-fade-in relative z-10 flex-1 flex flex-col justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-stretch w-full">
        {/* Left Column: Hero, Telemetry & Multi-Layer Threat Evaluation Pipeline */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs font-semibold text-blue-400 mb-4 shadow-[0_0_15px_rgba(59,130,246,0.15)] animate-float">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="font-mono tracking-wider uppercase">Cybersecurity Threat Defense Assistant</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-white mb-3 font-heading leading-[1.18]">
              Verify Links & Messages <br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                Before You Trust Them
              </span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              ScamShield identifies and analyzes cybersecurity threats across suspicious URLs and digital messages,
              translates technical evidence into plain language, and provides actionable, step-by-step security recommendations.
            </p>
          </div>

          {/* Live Telemetry Ticker Bar */}
          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Engine</div>
              <div className="font-bold text-slate-200 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                11 Heuristics
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Safe Browsing</div>
              <div className="font-bold text-blue-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Lookup v4 Live
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">AI Model</div>
              <div className="font-bold text-indigo-300 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                Gemini 2.5 Flash
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Privacy</div>
              <div className="font-bold text-slate-300 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                Privacy Shield
              </div>
            </div>
          </div>

          {/* Educational Protection Features Pipeline */}
          <div className="pt-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <span>Multi-Layer Threat Evaluation Pipeline</span>
            </h2>
            <div className="flex flex-col gap-2.5">
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 font-heading">
                    1. Structural Heuristics
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mt-0.5">
                    Unpacks IP hostnames, domain entropy, homoglyph lookalikes, URL shorteners, and urgent keyword triggers instantly.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 font-heading">
                    2. Google Safe Browsing v4
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mt-0.5">
                    Cross-references global threat feeds for malware distribution, deceptive websites, and known exploit kits.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 font-heading">
                    3. Actionable AI Defense
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mt-0.5">
                    Gemini synthesizes findings into simple plain English with a step-by-step checklist to keep your student accounts secure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Main Analyzer Card */}
        <div className="lg:col-span-7">
          <div className="glass-panel-elevated rounded-2xl sm:rounded-3xl p-5 sm:p-7 backdrop-blur-2xl relative overflow-hidden transition-all duration-300">
            {/* Glow orb background accents */}
            <div className="absolute top-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Tab selection */}
            <div
              className="grid grid-cols-2 p-1.5 bg-slate-950/90 rounded-2xl border border-slate-800/90 mb-5 relative"
              role="tablist"
              aria-label="Target type selector"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'url'}
                onClick={() => handleTabChange('url')}
                className={`py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer ${
                  activeTab === 'url'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Inspect Web URL</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'message'}
                onClick={() => handleTabChange('message')}
                className={`py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer ${
                  activeTab === 'message'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span>Inspect Message or Email</span>
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4">
                <ErrorAlert
                  title="Inspection Notice"
                  message={error}
                  onDismiss={() => setError(null)}
                />
              </div>
            )}

            {/* Form Area */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                {/* Input Header with Actions */}
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="target-input"
                    className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5"
                  >
                    <span>{activeTab === 'url' ? 'Suspicious URL to Analyze' : 'Message, SMS, or Email Text'}</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      ({activeTab === 'url' ? 'Domain, subdomain, path' : 'Text content & links'})
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Paste</span>
                    </button>

                    {input && (
                      <button
                        type="button"
                        onClick={() => setInput('')}
                        className="text-xs text-slate-400 hover:text-slate-200 font-medium px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}

                    <span className="text-xs font-mono text-slate-400">
                      {input.length}/{maxLength}
                    </span>
                  </div>
                </div>

                {/* Input Elements */}
                {activeTab === 'url' ? (
                  <div className="relative">
                    <input
                      id="target-input"
                      type="text"
                      autoComplete="off"
                      spellCheck="false"
                      placeholder="e.g. http://secure-paypal-verify.login-update.xyz or paste link"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        if (error) setError(null);
                      }}
                      disabled={loading}
                      maxLength={maxLength}
                      className="w-full px-4 py-3.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 text-sm font-mono transition-all shadow-inner"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      id="target-input"
                      rows={4}
                      placeholder="Paste the SMS, WhatsApp message, urgent email, or part-time job offer here. Include any links or payment instructions..."
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        if (error) setError(null);
                      }}
                      disabled={loading}
                      maxLength={maxLength}
                      className="w-full px-4 py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 text-sm leading-relaxed transition-all shadow-inner resize-y font-sans"
                    />
                  </div>
                )}

                <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="text-blue-400 font-bold" aria-hidden="true">ℹ</span>
                  <span>
                    {activeTab === 'url'
                      ? 'Checks IP-based hosts, punycode lookalikes, URL shorteners, domain entropy, and Safe Browsing status.'
                      : 'Checks urgency coercion, OTP extraction, crypto/Telegram pivots, and advance-fee recruitment fraud.'}
                  </span>
                </p>
              </div>

              {/* Quick Test Sample Cards */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                  One-Click Evaluation Scenarios (30s Quick Demo):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {EXAMPLES.map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyExample(ex)}
                      disabled={loading}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-blue-500/40 text-left transition-all active:scale-[0.98] group flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                    >
                      <span className={`text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border shrink-0 mt-0.5 ${ex.badgeColor}`}>
                        {ex.category}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-blue-300 truncate transition-colors">
                            {ex.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">{ex.type}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                          {ex.description}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit / High-Tech Radar Scanning Indicator */}
              <div className="pt-2">
                {loading ? (
                  <div className="py-6 px-4 rounded-xl bg-slate-950/80 border border-blue-500/30 flex flex-col items-center justify-center animate-fade-in shadow-xl">
                    <LoadingSpinner
                      message="Active Threat Assessment"
                      submessage={SCAN_STEPS[stepIndex]}
                    />
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-xl font-black text-base text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-500 hover:via-indigo-500 hover:to-sky-400 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all flex items-center justify-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 font-heading cursor-pointer"
                  >
                    <ShieldIcon size={20} color="#ffffff" />
                    <span>Launch Threat Analysis</span>
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Privacy protection notice */}
              <div className="pt-1 text-center text-xs text-slate-500 font-mono">
                🔒 Privacy Shield: Zero credentials, passwords, or OTPs stored.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
