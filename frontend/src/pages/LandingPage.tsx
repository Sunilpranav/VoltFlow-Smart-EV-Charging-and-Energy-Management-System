import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="py-6 sm:py-14 space-y-20 sm:space-y-28">
      {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="relative text-center max-w-4xl mx-auto px-4 sm:px-6">
        {/* Subtle accent glow */}
        <div className="absolute inset-0 -top-8 bg-emerald-500/10 blur-3xl -z-10 rounded-full max-w-xl mx-auto h-64 pointer-events-none" />

        {/* Top Tag Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wide uppercase text-[11px]">Smart EV Charging & Energy Management Platform</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-6">
          High-performance charging. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Intelligent energy management.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
          A full-stack platform for electric vehicle drivers and station operators. Discover active charging hubs, run simulated high-power charging sessions, manage wallet credits with idempotent payments, and configure transparent tariffs.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/stations"
            className="w-full sm:w-auto px-7 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#080c14]"
          >
            <svg className="w-5 h-5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Explore Charging Stations</span>
          </Link>

          {isAuthenticated ? (
            <Link
              to={user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard'}
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-white font-semibold rounded-xl border border-slate-700/80 flex items-center justify-center gap-2 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-[#080c14]"
            >
              <span>{user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 'Go to Admin Operations →' : 'Driver Dashboard →'}</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold rounded-xl border border-slate-700/80 flex items-center justify-center gap-2 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-[#080c14]"
            >
              <span>Driver Sign In</span>
            </Link>
          )}
        </div>
      </section>

      {/* ── PLATFORM PILLARS (AUTHENTIC SPECIFICATIONS) ──────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 sm:p-7 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">Multi-Standard</div>
            <div className="text-xs text-slate-400 font-medium">CCS2, CHAdeMO & Type 2</div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">Live Simulation</div>
            <div className="text-xs text-slate-400 font-medium">Real-time kWh & Cost Metering</div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono">Dynamic Tariffs</div>
            <div className="text-xs text-slate-400 font-medium">Configurable Rates per Hub</div>
          </div>
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-bold text-teal-400 font-mono">Prepaid Wallet</div>
            <div className="text-xs text-slate-400 font-medium">Idempotent Top-Up & Debits</div>
          </div>
        </div>
      </section>

      {/* ── CORE CAPABILITIES ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Built for modern EV mobility ecosystems
          </h2>
          <p className="text-sm text-slate-400">
            Engineered from the ground up for public station discovery, session billing, and full administrative operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/90 hover:border-slate-700 transition duration-200 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Live Session Simulation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Experience authentic EV charging cycles. Track energy delivery (kWh), battery state of charge (SoC %), active power delivery, and cost accumulation in an interactive sandbox.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/90 hover:border-slate-700 transition duration-200 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Digital Wallet & Prepaid Plans</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Sandbox payment intents with simulated credit cards, automated post-session balance debits, prepaid credit packs, and strict idempotency keys to protect against duplicate charges.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/90 hover:border-slate-700 transition duration-200 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Station & Tariff Management</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Operator-configurable tariffs based on connector standards (CCS2, CHAdeMO, Type 2) and power ratings, ensuring clear cost per kilowatt-hour before charging begins.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/90 hover:border-slate-700 transition duration-200 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Vehicle Garage & Matching</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Register vehicles with battery capacity (kWh) and connector specifications. The system validates compatibility before authorizing stall connection and session start.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/90 hover:border-slate-700 transition duration-200 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Maintenance Ticketing Workflow</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Automated charger status updates when maintenance tickets are logged. When technicians resolve issues, chargers automatically return to available status for drivers.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/90 hover:border-slate-700 transition duration-200 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Full Administrative Audit Trail</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every sensitive financial mutation, administrative refund, and charger configuration update is tracked in searchable, timestamped audit records with sanitized payload logs.
            </p>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ─────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-slate-900 to-[#0c1220] border border-slate-800 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ready to explore the VoltFlow platform?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
            Discover charging hubs, test out charging sessions with the built-in simulator, and explore operational controls in the sandbox.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-7 py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl transition shadow-md shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#080c14]"
            >
              Create Free Driver Account
            </Link>
            <Link
              to="/stations"
              className="w-full sm:w-auto px-7 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-[#080c14]"
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
