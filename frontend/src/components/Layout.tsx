import React from 'react';
import { Navbar } from './Navbar';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 selection:bg-blue-600 selection:text-white font-sans antialiased relative overflow-x-hidden">
      {/* Background ambient light mesh with gentle energy breathing */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[520px] bg-gradient-to-b from-blue-200/60 via-sky-100/40 to-transparent blur-3xl -z-10 pointer-events-none animate-energy opacity-80" />

      {/* Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 z-[100] px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg shadow-xl outline-none ring-2 ring-blue-400"
      >
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 outline-none animate-fade-in">
        {children}
      </main>

      <footer className="border-t border-slate-200/80 bg-white/90 py-6 text-center text-xs text-slate-500 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Volt<span className="text-blue-600">Flow</span></span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">Smart EV Charging & Energy Management Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80 shadow-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 -ml-3" />
              Platform Connected • Ultra-High Speed Grid
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
