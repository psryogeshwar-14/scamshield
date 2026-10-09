import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge';
import Button from '../components/Button';
import ErrorAlert from '../components/ErrorAlert';
import { useToast } from '../hooks/useToast';
import api from '../api/client';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'url' | 'message' | 'high_risk'
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  const { addToast } = useToast();

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setError(null);
        const json = await api.getHistory(page, 10, filterType);
        if (!ignore) {
          setHistory(json.data || []);
          if (json.pagination) {
            setPagination(json.pagination);
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || 'Error communicating with history endpoint.');
          addToast('Could not load history', 'error');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [page, filterType, refreshKey, addToast]);

  const handleFilterChange = (newType) => {
    setLoading(true);
    setFilterType(newType);
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await api.deleteHistoryItem(deleteTarget.id);

      addToast('Security check deleted successfully', 'success');
      setHistory((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      addToast(err.message || 'Failed to delete record', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportJSON = () => {
    if (!history.length) {
      addToast('No records to export', 'info');
      return;
    }
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scamshield-history-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('History exported as JSON', 'success');
  };

  // Filter items in memory by search query and high_risk
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      if (filterType === 'high_risk' && item.riskLevel !== 'high_risk') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inputMatch = item.userInput?.toLowerCase().includes(q);
      const summaryMatch = item.summary?.toLowerCase().includes(q);
      const threatMatch = item.threatType?.toLowerCase().includes(q);
      return inputMatch || summaryMatch || threatMatch;
    });
  }, [history, filterType, searchQuery]);

  // Aggregate stats
  const totalCount = pagination.total || history.length;
  const safeCount = history.filter((h) => h.riskLevel === 'safe').length;
  const suspiciousCount = history.filter((h) => h.riskLevel === 'suspicious').length;
  const highRiskCount = history.filter((h) => h.riskLevel === 'high_risk').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in relative z-10">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Audit Logs & Telemetry
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Threat Inspection History
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Review past scans, identify recurring phishing trends, and inspect safety resolution status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportJSON}
            disabled={!history.length}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export Logs</span>
          </button>

          <Button variant="primary" size="sm" onClick={() => navigate('/')} aria-label="Start a new analysis">
            + New Scan
          </Button>
        </div>
      </div>

      {/* Metrics Overview Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Total Scans</span>
          <span className="text-2xl font-black text-white font-heading mt-1 block">{totalCount}</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/25">
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">Safe Targets</span>
          <span className="text-2xl font-black text-emerald-400 font-heading mt-1 block">{safeCount}</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/25">
          <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">Suspicious</span>
          <span className="text-2xl font-black text-amber-400 font-heading mt-1 block">{suspiciousCount}</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/25">
          <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider block">High Risk</span>
          <span className="text-2xl font-black text-rose-400 font-heading mt-1 block">{highRiskCount}</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search history by URL, keyword, or threat type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
          />
          <svg className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" role="tablist" aria-label="History filter">
          {[
            { id: 'all', label: 'All' },
            { id: 'url', label: 'Links' },
            { id: 'message', label: 'Messages' },
            { id: 'high_risk', label: 'High Risk' },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={filterType === tab.id}
              onClick={() => handleFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer ${
                filterType === tab.id
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="mb-6">
          <ErrorAlert title="History Error" message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* History List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-3" />
          <span className="text-xs text-slate-400 font-mono">Loading history records...</span>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto mb-3 text-xl">
            🔍
          </div>
          <h3 className="text-base font-bold text-slate-200 font-heading">No Matching Records Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try clearing your search query or switching filters.' : 'Analyze your first link or message on the home scanner.'}
          </p>
          <div className="mt-5">
            <Button variant="primary" size="sm" onClick={() => navigate('/')}>
              Launch Threat Scanner
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredHistory.map((item) => {
            const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const threatTitle = (item.threatType || 'unknown').replace(/_/g, ' ');

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.inputType === 'url' ? '🔗 URL' : '💬 Message'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{formattedDate}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs font-semibold text-slate-300 capitalize font-heading">
                      {threatTitle}
                    </span>
                  </div>

                  <p className="text-sm font-mono text-slate-200 truncate group-hover:text-blue-300 transition-colors">
                    {item.userInput}
                  </p>

                  {item.summary && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {item.summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <RiskBadge riskLevel={item.riskLevel} size="sm" />

                  <Link
                    to={`/result/${item.id}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-colors"
                  >
                    View Dossier
                  </Link>

                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                    aria-label="Delete this scan"
                    title="Delete record"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-mono">
            Page {page} of {pagination.totalPages} ({pagination.total} total)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-xl mb-4">
              🗑️
            </div>
            <h3 className="text-lg font-bold text-white font-heading">Delete Security Dossier?</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to delete the record for:
            </p>
            <p className="text-xs font-mono text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 mt-2 truncate">
              {deleteTarget.userInput}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              This action cannot be undone. Associated safety checklist states will be removed.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
