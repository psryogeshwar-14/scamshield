import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import { ToastProvider } from './context/ToastProvider';

const HomePage = lazy(() => import('./pages/HomePage'));
const ResultPage = lazy(() => import('./pages/ResultPage'));
const SafetyActionsPage = lazy(() => import('./pages/SafetyActionsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
          <Navbar />
          <main className="flex-1 relative">
            <Suspense
              fallback={
                <div className="py-24 flex items-center justify-center">
                  <LoadingSpinner message="Loading ScamShield module..." />
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/result/:id" element={<ResultPage />} />
                <Route path="/safety/:id" element={<SafetyActionsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/tips" element={<AboutPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>
          <footer className="py-6 sm:py-8 border-t border-slate-900/80 bg-slate-950/70 backdrop-blur-md text-xs text-slate-500 mt-auto relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-slate-400">ScamShield v1.0 • PromptWars X Error Zero</span>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <Link to="/" className="hover:text-blue-400 transition-colors">Scanner</Link>
                <span>•</span>
                <Link to="/history" className="hover:text-blue-400 transition-colors">History</Link>
                <span>•</span>
                <Link to="/tips" className="hover:text-blue-400 transition-colors">Threat Defense</Link>
              </div>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
