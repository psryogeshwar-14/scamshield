import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ResultPage from './pages/ResultPage';
import SafetyActionsPage from './pages/SafetyActionsPage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import { ToastProvider } from './context/ToastProvider';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-200">
          <Navbar />
          <main className="flex-1 relative">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/result/:id" element={<ResultPage />} />
              <Route path="/safety/:id" element={<SafetyActionsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/tips" element={<AboutPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <footer className="py-8 border-t border-slate-900/80 bg-slate-950/70 backdrop-blur-md text-xs text-slate-500 mt-auto relative z-10">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
