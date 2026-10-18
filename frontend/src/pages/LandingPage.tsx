import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="py-6 sm:py-14 space-y-20 sm:space-y-28 relative">
      {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="relative text-center max-w-4xl mx-auto px-4 sm:px-6">
        {/* Soft ambient royal blue glow */}
        <div className="absolute inset-0 -top-12 bg-gradient-to-r from-blue-200/50 via-sky-100/50 to-blue-100/30 blur-3xl -z-10 rounded-full max-w-2xl mx-auto h-72 pointer-events-none" />

        {/* Top Tag Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 mb-8 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-blue-500 -ml-4" />
          <span className="tracking-wider uppercase text-[11px] font-bold">Smart EV Charging & High-Speed Energy Network</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.14] mb-6">
          High-performance charging. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600">
            Intelligent Energy Management.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          An enterprise-grade platform for EV drivers and charging network operators. Real-time station discovery, automated dynamic tariffs, idempotent digital wallet billing, and live telemetry simulation.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/stations"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Explore Charging Stations</span>
          </Link>

          {isAuthenticated ? (
            <Link
              to={user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard'}
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition-all duration-200 hover:border-blue-400 active:scale-[0.98] shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>{user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 'Go to Admin Operations →' : 'Driver Dashboard →'}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition-all duration-200 hover:border-blue-400 active:scale-[0.98] shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>Driver Sign In</span>
            </Link>
          )}
        </div>

        {/* ── LIVE INTERACTIVE PREVIEW CARD WITH ANIMATION ──────────────────── */}
        <div className="mt-14 max-w-2xl mx-auto rounded-2xl p-6 bg-white border border-blue-100 shadow-xl shadow-blue-900/5 backdrop-blur-xl animate-float">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 animate-pulse">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Metro Supercharger Hub #4</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono border border-blue-200 font-semibold">Stall A2</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">Ultra-Fast 150 kW CCS2 Connector</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Charging Live</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5 pt-4 text-left">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Power Output</div>
              <div className="text-xl font-black text-slate-900 font-mono mt-0.5">142.6 <span className="text-xs text-blue-600 font-medium">kW</span></div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Energy Delivered</div>
              <div className="text-xl font-black text-blue-700 font-mono mt-0.5">38.4 <span className="text-xs text-blue-600 font-medium">kWh</span></div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Battery State</div>
              <div className="text-xl font-black text-slate-900 font-mono mt-0.5">78%</div>
            </div>
          </div>

          {/* Animated charging bar */}
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 p-0.5">
              <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-blue-400 h-full rounded-full w-3/4 relative">
                <div className="absolute inset-0 bg-white/40 animate-shimmer" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM PILLARS (SPECIFICATIONS) ────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 sm:p-7 bg-white border border-slate-200/90 rounded-2xl shadow-sm">
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">Multi-Standard</div>
            <div className="text-xs text-slate-500 font-medium">CCS2, CHAdeMO & Type 2</div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-blue-600 font-mono">Live Simulation</div>
            <div className="text-xs text-slate-500 font-medium">Real-time kWh & Cost Metering</div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-sky-600 font-mono">Dynamic Tariffs</div>
            <div className="text-xs text-slate-500 font-medium">Configurable Rates per Hub</div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">Prepaid Wallet</div>
            <div className="text-xs text-slate-500 font-medium">Idempotent Top-Up & Debits</div>
          </div>
        </div>
      </section>

      {/* ── CORE CAPABILITIES ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Built for modern EV mobility ecosystems
          </h2>
          <p className="text-sm text-slate-600">
            Engineered from the ground up for public station discovery, session billing, and full administrative operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 space-y-3.5 shadow-xs hover:scale-[1.01]">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Live Session Simulation</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Experience authentic EV charging cycles. Track energy delivery (kWh), battery state of charge (SoC %), active power delivery, and cost accumulation in an interactive sandbox.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 space-y-3.5 shadow-xs hover:scale-[1.01]">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-sky-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Digital Wallet & Prepaid Plans</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sandbox payment intents with simulated credit cards, automated post-session balance debits, prepaid credit packs, and strict idempotency keys to protect against duplicate charges.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 space-y-3.5 shadow-xs hover:scale-[1.01]">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-indigo-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Station & Tariff Management</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Operator-configurable tariffs based on connector standards (CCS2, CHAdeMO, Type 2) and power ratings, ensuring clear cost per kilowatt-hour before charging begins.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 space-y-3.5 shadow-xs hover:scale-[1.01]">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Vehicle Garage & Matching</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Register vehicles with battery capacity (kWh) and connector specifications. The system validates compatibility before authorizing stall connection and session start.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 space-y-3.5 shadow-xs hover:scale-[1.01]">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-sky-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Maintenance Ticketing Workflow</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Automated charger status updates when maintenance tickets are logged. When technicians resolve issues, chargers automatically return to available status for drivers.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 space-y-3.5 shadow-xs hover:scale-[1.01]">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-indigo-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Full Administrative Audit Trail</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every sensitive financial mutation, administrative refund, and charger configuration update is tracked in searchable, timestamped audit records with sanitized payload logs.
            </p>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ─────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-center space-y-6 shadow-2xl shadow-blue-600/20 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to explore the VoltFlow platform?
          </h2>
          <p className="text-blue-100 max-w-xl mx-auto text-sm sm:text-base">
            Discover charging hubs, test out charging sessions with the built-in simulator, and explore operational controls in the sandbox.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-blue-50 text-blue-900 font-bold rounded-xl transition-all duration-200 shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              Create Free Driver Account
            </Link>
            <Link
              to="/stations"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-800/80 hover:bg-blue-800 text-white font-semibold rounded-xl border border-blue-400/40 transition-all duration-200 hover:border-white focus:outline-none focus:ring-2 focus:ring-white"
            >
              Browse Charging Hubs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
