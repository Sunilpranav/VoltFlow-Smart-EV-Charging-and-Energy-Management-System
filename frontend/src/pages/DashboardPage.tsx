import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/client';
import type { CustomerDashboard } from '../types';
import { CountUp, AnimatedProgressBar, Skeleton, MetricCardSkeleton, GlowCard } from '../components/animations';

export const DashboardPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<CustomerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardApi.getDashboard();
      setDashboard(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load customer dashboard overview.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    dashboardApi.getDashboard()
      .then((data) => {
        if (isMounted) {
          setDashboard(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load customer dashboard overview.');
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
      <div className="space-y-8 animate-fade-in">
        {/* Cockpit Header Skeleton */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>

        {/* 5 Metric Card Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>

        {/* 2 Column Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm animate-scale-in" role="alert">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-200 shadow-xs">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Dashboard Offline</h2>
        <p className="text-xs sm:text-sm text-slate-500">{error || 'Unable to retrieve dashboard information.'}</p>
        <button
          onClick={() => {
            loadDashboard();
          }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 hover-lift active:scale-95 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { profile, vehicleCount, vehicles, availableStationCount, recommendedStations, recentActivity } = dashboard;
  const hasActiveSession = (dashboard.activeSessionCount ?? 0) > 0;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* ── ACTIVE SESSION NOTICE (IF RUNNING) ─────────────────────────────── */}
      {hasActiveSession && (
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-energy hover-lift">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-blue-900">Active Charging Session in Progress</div>
              <div className="text-xs text-blue-700">Your vehicle is currently connected and drawing energy.</div>
            </div>
          </div>
          <Link
            to="/sessions"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition hover:scale-105 active:scale-95"
          >
            View Live Session →
          </Link>
        </div>
      )}

      {/* ── DRIVER COCKPIT HERO ────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs relative overflow-hidden group hover-lift">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Driver Cockpit • Connected</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {profile.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {profile.email} • {profile.phone || 'No phone on record'} • Account Role:{' '}
            <span className="font-mono text-blue-700 font-semibold px-2 py-0.5 rounded bg-blue-50 border border-blue-200">{profile.role}</span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto relative z-10">
          <Link
            to="/stations"
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 hover-lift"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Start Charging</span>
          </Link>
          <Link
            to="/wallet"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs border border-slate-300 flex items-center justify-center gap-2 transition-all duration-200 hover:border-blue-400 active:scale-[0.98] shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 hover-lift"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Top Up Wallet</span>
          </Link>
          <Link
            to="/vehicles"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs border border-slate-300 flex items-center justify-center gap-2 transition-all duration-200 hover:border-blue-400 active:scale-[0.98] shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 hover-lift"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Vehicle</span>
          </Link>
        </div>
      </div>

      {/* ── METRIC STAT CARDS WITH STAGGERED ENTRANCES & COUNTUP ────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Prepaid Wallet */}
        <GlowCard className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs animate-fade-in-up delay-75" maxTilt={6}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Wallet Balance</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            <CountUp value={dashboard.walletBalance ?? 0} decimals={2} prefix="$" />
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Sandbox Ledger</span>
            <Link to="/wallet" className="font-semibold text-blue-600 hover:text-blue-700 transition">
              Manage →
            </Link>
          </div>
        </GlowCard>

        {/* Card 2: Registered EVs */}
        <GlowCard className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs animate-fade-in-up delay-100" maxTilt={6}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Registered EVs</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            <CountUp value={vehicleCount} decimals={0} />
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">{vehicleCount === 1 ? '1 car linked' : `${vehicleCount} cars linked`}</span>
            <Link to="/vehicles" className="font-semibold text-blue-600 hover:text-blue-700 transition">
              Garage →
            </Link>
          </div>
        </GlowCard>

        {/* Card 3: Active Stations */}
        <GlowCard className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs animate-fade-in-up delay-150" maxTilt={6}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Charging Hubs</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            <CountUp value={availableStationCount} decimals={0} />
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Available stations</span>
            <Link to="/stations" className="font-semibold text-blue-600 hover:text-blue-700 transition">
              View Hubs →
            </Link>
          </div>
        </GlowCard>

        {/* Card 4: Energy Delivered */}
        <GlowCard className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs animate-fade-in-up delay-200" maxTilt={6}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Lifetime Energy</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            <CountUp value={dashboard.totalEnergyConsumedKwh ?? 0} decimals={2} suffix=" kWh" />
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Simulated delivery</span>
            <Link to="/sessions" className="font-semibold text-blue-600 hover:text-blue-700 transition">
              Sessions →
            </Link>
          </div>
        </GlowCard>

        {/* Card 5: Energy Billed */}
        <GlowCard className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs animate-fade-in-up delay-250" maxTilt={6}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Billed</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
            <CountUp value={dashboard.totalSpend ?? 0} decimals={2} prefix="$" />
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            {hasActiveSession ? (
              <span className="text-blue-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                {dashboard.activeSessionCount} active session
              </span>
            ) : (
              <span className="text-slate-400">All settled</span>
            )}
            <Link to="/sessions" className="font-semibold text-blue-600 hover:text-blue-700 transition">
              Receipts →
            </Link>
          </div>
        </GlowCard>
      </div>

      {/* ── TWO-COLUMN SECTION: VEHICLES & STATIONS ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Registered EVs Garage */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs hover-lift">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Connected Electric Vehicles</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono border border-blue-200">
                {vehicles.length}
              </span>
            </h2>
            <Link to="/vehicles" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
              Manage Garage →
            </Link>
          </div>

          {vehicles.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center border border-blue-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">No vehicles registered to your profile.</p>
              <Link
                to="/vehicles"
                className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm hover-lift"
              >
                Register your EV
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.slice(0, 3).map((v) => (
                <div
                  key={v.id}
                  className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 hover:bg-blue-50/20 transition-all hover-lift"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 text-sm">
                      {v.make} {v.model}{' '}
                      {v.modelYear && <span className="text-slate-400 font-normal">({v.modelYear})</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        {v.registrationNumber}
                      </span>
                      <span className="text-slate-500">{v.connectorType}</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-48 space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Capacity</span>
                      <span className="text-blue-700 font-bold">{v.batteryCapacityKwh} kWh</span>
                    </div>
                    <AnimatedProgressBar
                      value={Math.min(100, (v.batteryCapacityKwh / 100) * 100)}
                      height="h-1.5"
                      showShimmer={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Operational Charging Hubs */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs hover-lift">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Operational Charging Hubs</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono border border-blue-200">
                {recommendedStations.length}
              </span>
            </h2>
            <Link to="/stations" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
              Explore Network →
            </Link>
          </div>

          {recommendedStations.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2 bg-slate-50">
              <p className="text-xs sm:text-sm text-slate-500">No charging hubs active at this moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedStations.map((s) => (
                <Link
                  key={s.id}
                  to={`/stations/${s.id}`}
                  className="block p-4 bg-slate-50 border border-slate-200/80 rounded-2xl hover:border-blue-300 hover:bg-blue-50/20 transition-all group hover-lift"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                        {s.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{s.address}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{s.availableChargers} / {s.totalChargers} Available</span>
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
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs hover-lift">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Activity Log</h2>
        {recentActivity.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50">
            <p className="text-xs sm:text-sm text-slate-500">No recent driver activity recorded.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivity.map((log) => (
              <div key={log.id} className="py-3.5 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 animate-pulse" />
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-500 ml-2 font-mono">{log.details}</span>
                  </div>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
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
