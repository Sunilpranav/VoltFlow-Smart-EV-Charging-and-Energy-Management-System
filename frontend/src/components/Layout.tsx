import React from 'react';
import { Navbar } from './Navbar';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 selection:bg-emerald-400 selection:text-slate-950 font-sans antialiased">
      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 z-[100] px-4 py-2 bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg outline-none ring-2 ring-emerald-300"
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 outline-none">
        {children}
      </main>

      <footer className="border-t border-slate-900 bg-[#060910] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">VoltFlow</span>
            <span>•</span>
            <span>Smart EV Charging & Energy Management Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Platform Connected • Simulated Grid Sandbox
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
