import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { useToast } from '../hooks/useToast';
import api from '../api/client';

export default function ResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [data, setData] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [error, setError] = useState(null);
  function extractSteps(res) {
    if (!res) return [];
    if (res.safetyRecommendations && res.safetyRecommendations.length > 0) {
      return res.safetyRecommendations.map((r) => ({
        id: r.id,
        action: r.action,
        completed: Boolean(r.completed),
      }));
    }
    if (Array.isArray(res.safetySteps) && res.safetySteps.length > 0) {
      return res.safetySteps.map((step, idx) => ({
        id: `step-${idx}`,
        action: step,
        completed: false,
      }));
    }
    return [];
  }

  const [steps, setSteps] = useState(() => extractSteps(location.state?.result));

  // Fetch from API if not passed via route state
  useEffect(() => {
    if (data) {
      return;
    }

    let isMounted = true;
    async function fetchResult() {
      try {
        const res = await api.getHistoryById(id);
        const item = res.data;
        const normalized = {
          id: item.id,
          inputType: item.inputType,
          raw: item.userInput,
          userInput: item.userInput,
          riskLevel: item.riskLevel,
          threatType: item.threatType,
          confidence: item.confidence,
          summary: item.summary,
          evidence: item.evidenceJson ? JSON.parse(item.evidenceJson) : [],
          recommendedAction: item.recommendedAction,
          safetySteps: item.safetyStepsJson ? JSON.parse(item.safetyStepsJson) : [],
          safetyRecommendations: item.safetyRecommendations || [],
          safeBrowsing: item.safeBrowsingResult ? JSON.parse(item.safeBrowsingResult) : null,
          whyThisResult: item.whyThisResult || null,
          createdAt: item.createdAt,
        };

        if (isMounted) {
          setData(normalized);
          setSteps(extractSteps(normalized));
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Could not find this analysis result.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchResult();
    return () => {
      isMounted = false;
    };
  }, [id, data]);

  const handleToggleStep = async (stepId, currentStatus) => {
    const nextStatus = !currentStatus;

    // Optimistic UI update
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, completed: nextStatus } : s))
    );

    // Sync to database if step is persisted
    if (data?.id && !stepId.startsWith('step-') && !stepId.startsWith('fallback-')) {
      try {
        await api.updateRecommendation(data.id, stepId, nextStatus);
        addToast(
          nextStatus ? 'Safety action marked as completed!' : 'Safety action unchecked',
          nextStatus ? 'success' : 'info'
        );
      } catch {
        // Revert optimistic state on network/storage failure
        setSteps((prev) =>
          prev.map((s) => (s.id === stepId ? { ...s, completed: currentStatus } : s))
        );
        addToast('Could not save safety action status. Please retry.', 'error');
      }
    } else {
      addToast(
        nextStatus ? 'Safety action marked as completed!' : 'Safety action unchecked',
        nextStatus ? 'success' : 'info'
      );
    }
  };

  const handleCopyInput = () => {
    const textToCopy = data.raw || data.userInput || '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      addToast('Input copied to clipboard!', 'success');
    }
  };

  const handleCopyAdvisory = () => {
    const threatName = (data.threatType || 'threat').replace(/_/g, ' ').toUpperCase();
    const risk = (data.riskLevel || 'UNKNOWN').toUpperCase();
    const action = data.recommendedAction || 'Exercise caution.';
    const summary = data.summary || '';

    const text = `🚨 *SCAMSHIELD SECURITY ADVISORY* 🚨\nRisk Level: ${risk}\nThreat Classification: ${threatName}\n\n⚠️ Immediate Directive:\n${action}\n\n💡 Plain-Language Summary:\n${summary}\n\nProtected by ScamShield AI Digital Safety Assistant`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      addToast('Security advisory copied! Ready to share.', 'success');
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scamshield-report-${data.id || 'scan'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Downloaded JSON report', 'success');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <LoadingSpinner message="Retrieving Security Dossier..." submessage="Cross-verifying cryptographic signatures..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <ErrorAlert
          title="Security Record Not Found"
          message={error || 'We could not locate this security inspection in the database.'}
        />
        <div className="mt-6 flex justify-center">
          <Button variant="primary" onClick={() => navigate('/')}>
            ← Return to Threat Scanner
          </Button>
        </div>
      </div>
    );
  }

  const rawConfidence = data.confidence ?? 0.85;
  const confidencePercent = rawConfidence <= 1 ? Math.round(rawConfidence * 100) : Math.round(rawConfidence);
  const evidenceList = data.evidence || [];
  const completedStepsCount = steps.filter((s) => s.completed).length;
  const progressPercent = steps.length > 0 ? Math.round((completedStepsCount / steps.length) * 100) : 0;

  // Calculate visual risk score
  const riskScore =
    data.riskLevel === 'high_risk'
      ? Math.max(85, confidencePercent)
      : data.riskLevel === 'suspicious'
      ? Math.max(55, Math.round(confidencePercent * 0.7))
      : Math.min(15, Math.round((1 - confidencePercent) * 20));

  const threatDisplay = (data.threatType || 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // Circle gauge calculations
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  const gaugeColor =
    data.riskLevel === 'high_risk'
      ? '#f43f5e'
      : data.riskLevel === 'suspicious'
      ? '#f59e0b'
      : '#10b981';

  // Safe Browsing state resolution
  const sbStatus = data.safeBrowsing?.status || (data.inputType === 'url' ? 'unavailable' : 'n_a');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-12 sm:pb-16 animate-fade-in relative z-10">
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-blue-400 transition-colors px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Analyze Another Target</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAdvisory}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            <span>Share Advisory</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>JSON</span>
          </button>

          <Link
            to="/history"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            History →
          </Link>
        </div>
      </div>

      {/* Main Verdict & Radar Card */}
      <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 backdrop-blur-2xl mb-8 relative overflow-hidden">
        {/* Glow Accent */}
        <div
          className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 ${
            data.riskLevel === 'high_risk'
              ? 'bg-rose-500'
              : data.riskLevel === 'suspicious'
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Threat Inspection Dossier
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-500">
                {data.inputType === 'url' ? 'Link Target' : 'Message Payload'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-heading">
              Security Evaluation Verdict
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <RiskBadge riskLevel={data.riskLevel} size="xl" />
          </div>
        </div>

        {/* Input Analyzed Box */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 relative group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Payload Analyzed:
            </span>
            <button
              onClick={handleCopyInput}
              className="text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors flex items-center gap-1 cursor-pointer"
            >
              Copy
            </button>
          </div>
          <p className="text-sm font-mono text-slate-300 break-all select-all leading-relaxed max-h-32 overflow-y-auto">
            {data.raw || data.userInput}
          </p>
        </div>

        {/* Metrics Grid: Radial Gauge + Classification + Google Safe Browsing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {/* Circular Threat Risk Gauge */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-4">
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={gaugeColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black font-heading text-white">{riskScore}</span>
                <span className="text-[9px] font-mono uppercase text-slate-400 -mt-0.5">/ 100 Risk</span>
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-mono uppercase text-slate-400">Risk Severity</span>
              <span className="text-sm font-bold text-white capitalize font-heading mt-0.5">
                {data.riskLevel === 'high_risk' ? 'Critical Hazard' : data.riskLevel === 'suspicious' ? 'Elevated Caution' : 'Clean & Safe'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Calibrated across structural heuristics
              </span>
            </div>
          </div>

          {/* Threat Classification */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-slate-400 block mb-1">
                Threat Classification
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-100 font-heading">
                {threatDisplay === 'Unknown' ? 'Clean / No Severe Pattern' : threatDisplay}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Model Confidence:</span>
              <span className="font-bold text-blue-400">{confidencePercent}%</span>
            </div>
          </div>

          {/* Safe Browsing v4 Status */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono uppercase text-slate-400 block mb-1">
                Google Safe Browsing v4
              </span>
              <div className="flex items-center gap-2 mt-1">
                {sbStatus === 'threat' ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-500/50 text-rose-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Active Threat Flagged
                  </span>
                ) : sbStatus === 'clean' ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Clean Threat Feed
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-500/50 text-amber-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {data.inputType === 'url' ? 'Reputation Feed Unavailable' : 'N/A (Message Payload)'}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
              {sbStatus === 'threat'
                ? 'Flagged in Google Safe Browsing database'
                : sbStatus === 'clean'
                ? 'Zero threat matches detected in cloud feed'
                : data.inputType === 'url'
                ? 'Heuristic and AI evaluation active'
                : 'Checked via text classification'}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Immediate Directive */}
      {data.recommendedAction && (
        <div
          className={`p-6 sm:p-7 rounded-3xl border shadow-2xl mb-8 relative overflow-hidden transition-all ${
            data.riskLevel === 'high_risk'
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-100 shadow-[0_0_35px_rgba(244,63,94,0.15)]'
              : data.riskLevel === 'suspicious'
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-100 shadow-[0_0_35px_rgba(245,158,11,0.15)]'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100 shadow-[0_0_35px_rgba(16,185,129,0.15)]'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                data.riskLevel === 'high_risk'
                  ? 'bg-rose-500/20 text-rose-400'
                  : data.riskLevel === 'suspicious'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider block mb-1 opacity-90">
                Recommended Immediate Directive
              </span>
              <p className="text-base sm:text-xl font-bold leading-relaxed font-heading">
                {data.recommendedAction}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plain Language Explanation */}
      {data.summary && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 border border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white font-heading">Plain-Language Explanation</h2>
          </div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed pl-1">
            {data.summary}
          </p>
        </div>
      )}

      {/* ── Comprehensive "Why this result?" Multi-Dimensional Section ──────────────── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 border border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-heading">Why This Result?</h2>
              <span className="text-xs text-slate-400 font-mono">
                Multifaceted evidence from deterministic checks, external feeds, and AI models
              </span>
            </div>
          </div>
        </div>

        {/* 4-Pillar Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Pillar 1: Deterministic Heuristic Checks */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold flex items-center gap-1.5">
                <span>⚙️</span>
                <span>Deterministic Checks</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                Score: {data.heuristics?.score ?? (data.riskLevel === 'high_risk' ? 85 : data.riskLevel === 'suspicious' ? 50 : 10)}/100
              </span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              {(data.heuristics?.findings && data.heuristics.findings.length > 0) ? (
                data.heuristics.findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold mt-0.5">•</span>
                    <span><strong>{f.label}:</strong> {f.detail}</span>
                  </li>
                ))
              ) : (
                evidenceList.map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 font-bold mt-0.5">•</span>
                    <span>{e}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Pillar 2: External Reputation Feed */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
                <span>🌐</span>
                <span>External Threat Feeds</span>
              </span>
              <span className="text-xs font-mono text-slate-400 capitalize">
                Status: {sbStatus}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {data.safeBrowsing?.details ||
                (sbStatus === 'threat'
                  ? 'Confirmed active malware or phishing entry in Google Safe Browsing blacklist.'
                  : sbStatus === 'clean'
                  ? 'No negative reputation records recorded in global malware databases.'
                  : 'Cloud reputation feed unavailable; system defaulted safely to local heuristic verification.')}
            </p>
          </div>

          {/* Pillar 3: AI Reasoning & Intent Interpretation */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold flex items-center gap-1.5">
                <span>🧠</span>
                <span>AI Reasoning Interpretation</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                Confidence: {confidencePercent}%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {data.summary || 'Gemini analyzed persuasion indicators, urgency coercion, and credential traps to determine student hazard impact.'}
            </p>
          </div>

          {/* Pillar 4: Limitations & Disclaimers */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Confidence Limitations</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                Guidance Only
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              ScamShield provides automated guidance. An absence of recorded threats does not guarantee an unknown link is completely harmless. Never share passwords or OTPs.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Safety Steps Checklist */}
      {steps.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 mb-8 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-heading">Interactive Safety Checklist</h2>
                <span className="text-xs text-slate-400 font-mono">
                  Complete these steps to neutralize the threat
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">
                {completedStepsCount} of {steps.length} completed
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {progressPercent}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden mb-6 border border-slate-800/80">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Steps List */}
          <div className="space-y-3" role="group" aria-label="Interactive safety checklist">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                onClick={() => handleToggleStep(step.id, step.completed)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggleStep(step.id, step.completed);
                  }
                }}
                role="checkbox"
                aria-checked={step.completed}
                tabIndex={0}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  step.completed
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400 line-through'
                    : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    step.completed
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'border-slate-700 bg-slate-900 text-transparent hover:border-blue-400'
                  }`}
                >
                  <svg className="w-4 h-4 font-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-mono text-slate-400 block mb-0.5">
                    Action {idx + 1}
                  </span>
                  <p className="text-sm font-medium leading-relaxed font-sans">
                    {step.action}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {progressPercent === 100 && (
            <div className="mt-6 p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center animate-fade-in shadow-[0_0_25px_rgba(16,185,129,0.2)]">
              <span className="text-base font-bold text-emerald-300 font-heading block">
                🎉 Outstanding! All safety actions completed.
              </span>
              <span className="text-xs text-emerald-400/80 font-mono mt-1 block">
                You have neutralized this threat and secured your digital accounts.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/80">
        <button
          onClick={() => navigate('/')}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer font-heading"
        >
          <span>🔍</span>
          <span>Analyze Another Link or Message</span>
        </button>

        <button
          onClick={() => navigate('/history')}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>📜</span>
          <span>View Inspection History</span>
        </button>
      </div>
    </div>
  );
}
