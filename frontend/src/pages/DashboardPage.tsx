import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/client';
import type { CustomerDashboard } from '../types';
import { formatCurrency, formatEnergy } from '../utils/currency';

export const DashboardPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getDashboard();
      setDashboard(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load customer dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    dashboardApi.getDashboard()
      .then((data) => {
        if (isMounted) {
          setDashboard(data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load customer dashboard');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
        <div className="h-28 bg-slate-900/60 rounded-3xl border border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-900/60 rounded-2xl border border-slate-800" />
          <div className="h-64 bg-slate-900/60 rounded-2xl border border-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-8 bg-slate-900/80 border border-slate-800 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-12" role="alert">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Dashboard Offline</h2>
        <p className="text-xs sm:text-sm text-slate-400">{error || 'Unable to retrieve dashboard information.'}</p>
        <button
          onClick={() => {
            loadDashboard();
          }}
          className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs transition focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#080c14]"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { profile, vehicleCount, vehicles, availableStationCount, recommendedStations, recentActivity } = dashboard;
  const hasActiveSession = (dashboard.activeSessionCount ?? 0) > 0;

  return (
    <div className="space-y-8">
      {/* ── ACTIVE SESSION NOTICE (IF RUNNING) ─────────────────────────────── */}
      {hasActiveSession && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">Active Charging Session in Progress</div>
              <div className="text-xs text-slate-400">Your vehicle is currently connected and drawing energy.</div>
            </div>
          </div>
          <Link
            to="/sessions"
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-xl shadow transition"
          >
            View Live Session →
          </Link>
        </div>
      )}

      {/* ── DRIVER COCKPIT HERO ────────────────────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl backdrop-blur-md">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Driver Cockpit • Connected</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {profile.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {profile.email} • {profile.phone || 'No phone on record'} • Account Role:{' '}
            <span className="font-mono text-emerald-400 font-semibold">{profile.role}</span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Link
            to="/stations"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-[#080c14]"
          >
            <svg className="w-4 h-4 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Start Charging</span>
          </Link>
          <Link
            to="/wallet"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700/80 flex items-center justify-center gap-2 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-[#080c14]"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Top Up Wallet</span>
          </Link>
          <Link
            to="/vehicles"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700/80 flex items-center justify-center gap-2 transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-[#080c14]"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Vehicle</span>
          </Link>
        </div>
      </div>

      {/* ── METRIC STAT CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Prepaid Wallet */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 space-y-3 transition duration-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Wallet Balance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {formatCurrency(dashboard.walletBalance)}
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Sandbox Ledger</span>
            <Link to="/wallet" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Manage →
            </Link>
          </div>
        </div>

        {/* Card 2: Registered EVs */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 transition duration-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Registered EVs</span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center border border-slate-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">{vehicleCount}</div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">{vehicleCount === 1 ? '1 car linked' : `${vehicleCount} cars linked`}</span>
            <Link to="/vehicles" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Garage →
            </Link>
          </div>
        </div>

        {/* Card 3: Active Stations */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 transition duration-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Charging Hubs</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">{availableStationCount}</div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Available stations</span>
            <Link to="/stations" className="font-semibold text-teal-400 hover:text-teal-300">
              View Hubs →
            </Link>
          </div>
        </div>

        {/* Card 4: Energy Delivered */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 transition duration-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lifetime Energy</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {formatEnergy(dashboard.totalEnergyConsumedKwh)}
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Simulated delivery</span>
            <Link to="/sessions" className="font-semibold text-cyan-400 hover:text-cyan-300">
              Sessions →
            </Link>
          </div>
        </div>

        {/* Card 5: Energy Billed */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 transition duration-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Billed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {formatCurrency(dashboard.totalSpend)}
          </div>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            {hasActiveSession ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {dashboard.activeSessionCount} active session
              </span>
            ) : (
              <span className="text-slate-400">All settled</span>
            )}
            <Link to="/sessions" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Receipts →
            </Link>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN SECTION: VEHICLES & STATIONS ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Registered EVs Garage */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Connected Electric Vehicles</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {vehicles.length}
              </span>
            </h2>
            <Link to="/vehicles" className="text-xs font-semibold text-emerald-400 hover:underline">
              Manage Garage →
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center space-y-3 bg-slate-950/40">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">No vehicles registered to your profile.</p>
              <Link
                to="/vehicles"
                className="inline-block px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition"
              >
                Register your EV
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.slice(0, 3).map((v) => (
                <div
                  key={v.id}
                  className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white text-sm">
                      {v.make} {v.model}{' '}
                      {v.modelYear && <span className="text-slate-400 font-normal">({v.modelYear})</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                        {v.registrationNumber}
                      </span>
                      <span className="text-slate-400">{v.connectorType}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold font-mono text-emerald-400 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      {v.batteryCapacityKwh} kWh
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Operational Charging Hubs */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Operational Charging Hubs</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {recommendedStations.length}
              </span>
            </h2>
            <Link to="/stations" className="text-xs font-semibold text-emerald-400 hover:underline">
              Explore Network →
            </Link>
          </div>

          {recommendedStations.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center space-y-2 bg-slate-950/40">
              <p className="text-xs sm:text-sm text-slate-400">No charging hubs active at this moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedStations.map((s) => (
                <Link
                  key={s.id}
                  to={`/stations/${s.id}`}
                  className="block p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl hover:border-slate-700 transition group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm group-hover:text-emerald-400 transition">
                        {s.name}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-xs">{s.address}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-slate-900 text-emerald-400 border border-slate-800">
                        {s.availableChargers} / {s.totalChargers} Available
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ACTIVITY TIMELINE ──────────────────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight">Recent Activity Log</h2>
        {recentActivity.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center bg-slate-950/40">
            <p className="text-xs sm:text-sm text-slate-400">No recent driver activity recorded.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {recentActivity.map((log) => (
              <div key={log.id} className="py-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-slate-200">{log.action}</span>
                    <span className="text-slate-400 ml-2 font-mono">{log.details}</span>
                  </div>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">
                  {new Date(log.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
