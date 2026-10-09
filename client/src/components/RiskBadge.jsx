import React from 'react';

/**
 * RiskBadge — displays security risk levels with accessible contrast, icons, and text labels.
 * Supports: "safe" | "low" | "suspicious" | "medium" | "high_risk" | "high" (case-insensitive)
 * Sizes:  "sm" | "md" | "lg" | "xl"
 */
const CONFIG = {
  safe: {
    label: 'Safe',
    icon: '✓',
    text: 'text-emerald-300',
    bg: 'bg-emerald-950/80',
    border: 'border-emerald-500/60',
    dot: 'bg-emerald-400 shadow-[0_0_10px_#10b981]',
  },
  low: {
    label: 'Low Risk',
    icon: '✓',
    text: 'text-emerald-300',
    bg: 'bg-emerald-950/80',
    border: 'border-emerald-500/60',
    dot: 'bg-emerald-400 shadow-[0_0_10px_#10b981]',
  },
  suspicious: {
    label: 'Suspicious',
    icon: '⚠',
    text: 'text-amber-300',
    bg: 'bg-amber-950/80',
    border: 'border-amber-500/60',
    dot: 'bg-amber-400 shadow-[0_0_10px_#f59e0b]',
  },
  medium: {
    label: 'Suspicious',
    icon: '⚠',
    text: 'text-amber-300',
    bg: 'bg-amber-950/80',
    border: 'border-amber-500/60',
    dot: 'bg-amber-400 shadow-[0_0_10px_#f59e0b]',
  },
  high_risk: {
    label: 'High Risk',
    icon: '✕',
    text: 'text-rose-300',
    bg: 'bg-rose-950/80',
    border: 'border-rose-500/60',
    dot: 'bg-rose-500 shadow-[0_0_10px_#f43f5e]',
  },
  high: {
    label: 'High Risk',
    icon: '✕',
    text: 'text-rose-300',
    bg: 'bg-rose-950/80',
    border: 'border-rose-500/60',
    dot: 'bg-rose-500 shadow-[0_0_10px_#f43f5e]',
  },
};

export default function RiskBadge({ riskLevel, size = 'md', className = '' }) {
  const normalizedKey = String(riskLevel || '').toLowerCase().trim();
  const cfg = CONFIG[normalizedKey] || {
    label: 'Unknown',
    icon: '?',
    text: 'text-slate-300',
    bg: 'bg-slate-900',
    border: 'border-slate-700',
    dot: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-1 gap-2',
    lg: 'text-sm sm:text-base px-4 py-1.5 gap-2.5 font-semibold',
    xl: 'text-lg sm:text-xl px-5 py-2.5 gap-3 font-bold',
  }[size] || 'text-xs px-3 py-1 gap-2';

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
    xl: 'w-3 h-3',
  }[size] || 'w-2 h-2';

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm backdrop-blur-md font-semibold select-none transition-all ${cfg.bg} ${cfg.border} ${cfg.text} ${sizeClasses} ${className}`}
      role="status"
      aria-label={`Risk assessment: ${cfg.label}`}
    >
      <span className={`rounded-full shrink-0 animate-pulse ${cfg.dot} ${dotSize}`} aria-hidden="true" />
      <span className="font-mono text-xs select-none" aria-hidden="true">{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}
