import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in" role="main">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-4xl mb-6 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
        🛡️
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight mb-3">
        404 — Page Not Found
      </h1>
      <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
        The safety analysis page or resource you requested could not be located.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/25 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-950 cursor-pointer font-heading"
      >
        <span>←</span>
        <span>Back to Security Analyzer</span>
      </Link>
    </main>
  );
}
