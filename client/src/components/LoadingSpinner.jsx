import React from 'react';

/**
 * LoadingSpinner — High-tech cybersecurity holographic radar scanner.
 * Renders glowing concentric rings with sweep animation and telemetry text.
 */
export default function LoadingSpinner({ message = 'Analyzing threat indicators…', submessage = '' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-6 text-center select-none"
    >
      {/* Holographic Radar Scanner */}
      <div className="relative w-24 h-24 mb-5 flex items-center justify-center">
        {/* Outer glowing boundary */}
        <div className="absolute inset-0 rounded-full border border-blue-500/20 bg-blue-950/20 shadow-[0_0_30px_rgba(59,130,246,0.2)] animate-pulse" />

        {/* Outer segmented ring */}
        <div className="absolute inset-1 rounded-full border border-dashed border-blue-400/30 animate-[spin_10s_linear_infinite]" />

        {/* Counter-rotating middle ring */}
        <div className="absolute inset-4 rounded-full border border-indigo-400/40 border-t-blue-400 animate-[spin_3s_linear_infinite_reverse]" />

        {/* Radar sweep beam */}
        <div
          className="absolute inset-2 rounded-full overflow-hidden animate-radar pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(59, 130, 246, 0.45) 360deg)',
          }}
        />

        {/* Crosshair grid lines */}
        <div className="absolute w-full h-[1px] bg-blue-500/20" />
        <div className="absolute h-full w-[1px] bg-blue-500/20" />

        {/* Inner core pulse */}
        <div className="relative z-10 w-6 h-6 rounded-full bg-blue-500/30 border border-blue-400 flex items-center justify-center shadow-[0_0_15px_#3b82f6]">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
        </div>
      </div>

      {/* Primary Message */}
      <p className="text-sm sm:text-base font-semibold text-slate-200 tracking-wide font-heading">
        {message}
      </p>

      {/* Submessage / Telemetry */}
      {submessage ? (
        <p className="text-xs text-slate-400 mt-1 font-mono tracking-tight">
          {submessage}
        </p>
      ) : (
        <div className="flex items-center gap-2 mt-1.5 text-xs text-blue-400/80 font-mono">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span>Cross-referencing Safe Browsing & AI Heuristics</span>
        </div>
      )}

      <span className="sr-only">{message}</span>
    </div>
  );
}
