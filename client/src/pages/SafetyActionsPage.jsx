import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { useToast } from '../hooks/useToast';
import api from '../api/client';

export default function SafetyActionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [data, setData] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchSafetyDetails() {
      try {
        setLoading(true);
        const json = await api.getHistoryById(id);
        const item = json.data;
        if (!isMounted) return;
        setData(item);

        if (item.safetyRecommendations && item.safetyRecommendations.length > 0) {
          setSteps(
            item.safetyRecommendations.map((r) => ({
              id: r.id,
              action: r.action,
              completed: Boolean(r.completed),
            }))
          );
        } else if (item.safetyStepsJson) {
          const parsed = JSON.parse(item.safetyStepsJson);
          setSteps(
            parsed.map((action, idx) => ({
              id: `step-${idx}`,
              action,
              completed: false,
            }))
          );
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSafetyDetails();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleToggle = async (stepId, current) => {
    const next = !current;
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, completed: next } : s))
    );

    if (id && !stepId.startsWith('step-')) {
      try {
        await api.updateRecommendation(id, stepId, next);
        addToast(
          next ? 'Protective action completed!' : 'Action marked incomplete',
          next ? 'success' : 'info'
        );
      } catch {
        // Revert optimistic state on failure
        setSteps((prev) =>
          prev.map((s) => (s.id === stepId ? { ...s, completed: current } : s))
        );
        addToast('Could not save protective action status. Please retry.', 'error');
      }
    } else {
      addToast(
        next ? 'Protective action completed!' : 'Action marked incomplete',
        next ? 'success' : 'info'
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 flex justify-center">
        <LoadingSpinner message="Retrieving safety protocol..." submessage="Compiling interactive mitigation steps..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <ErrorAlert title="Safety Record Not Found" message={error || 'Record not found in the database.'} />
        <div className="mt-5">
          <Button variant="primary" onClick={() => navigate('/')}>
            ← Back to Threat Scanner
          </Button>
        </div>
      </div>
    );
  }

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-12 sm:pb-16 animate-fade-in relative z-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to={`/result/${id}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-blue-400 transition-colors px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800"
        >
          <span>← Back to Security Verdict</span>
        </Link>
        <RiskBadge riskLevel={data.riskLevel} size="md" />
      </div>

      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
          Threat Mitigation Plan
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading mb-2">
          Interactive Defense Checklist
        </h1>
        <p className="text-xs sm:text-sm font-mono text-slate-400 truncate bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
          Target Payload: {data.userInput}
        </p>
      </div>

      {/* Progress Card */}
      <div className="glass-panel-elevated p-6 sm:p-7 rounded-3xl mb-8">
        <div className="flex items-center justify-between mb-3 text-sm font-semibold">
          <span className="text-slate-200 font-heading text-base">
            {completedCount} of {steps.length} defensive measures executed
          </span>
          <span className="text-blue-400 font-mono text-base font-bold">{progress}% Complete</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3 mb-8" role="group" aria-label="Interactive defensive measures checklist">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            onClick={() => handleToggle(step.id, step.completed)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle(step.id, step.completed);
              }
            }}
            role="checkbox"
            aria-checked={step.completed}
            tabIndex={0}
            className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              step.completed
                ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400 line-through'
                : 'glass-panel border-slate-800/90 hover:border-slate-700 text-slate-200'
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
                Directive {idx + 1}
              </span>
              <p className="text-sm font-medium leading-relaxed font-sans">
                {step.action}
              </p>
            </div>
          </div>
        ))}
      </div>

      {progress === 100 && (
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center mb-8 animate-fade-in shadow-[0_0_25px_rgba(16,185,129,0.2)]">
          <p className="text-base font-bold text-emerald-300 font-heading">
            🎉 All safety actions verified! Threat safely mitigated.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-800">
        <button
          onClick={() => navigate('/')}
          className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white cursor-pointer font-heading"
        >
          🔍 Inspect Another Item
        </button>
        <button
          onClick={() => navigate('/history')}
          className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-sm bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
        >
          📜 View History
        </button>
      </div>
    </div>
  );
}
