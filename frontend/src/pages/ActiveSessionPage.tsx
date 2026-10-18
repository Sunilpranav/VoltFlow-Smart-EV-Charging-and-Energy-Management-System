import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { sessionApi, ApiError } from '../api/client';
import type { ChargingSession } from '../types';
import { formatCurrency, formatTariffRate } from '../utils/currency';

export const ActiveSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<ChargingSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Stop confirmation modal state
  const [showStopModal, setShowStopModal] = useState<boolean>(false);
  const [stopping, setStopping] = useState<boolean>(false);
  const [stopError, setStopError] = useState<string | null>(null);

  // Live simulation telemetry state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    sessionApi.getById(Number(id))
      .then((data) => {
        if (isMounted) {
          setSession(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to fetch session details');
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
  }, [id]);

  // Telemetry simulation timer
  useEffect(() => {
    if (!session || session.status !== 'CHARGING') return;

    const startMs = new Date(session.startTime).getTime();
    const updateTimer = () => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((now - startMs) / 1000));
      setElapsedSeconds(diffSecs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  // Escape key listener for stop modal
  useEffect(() => {
    if (!showStopModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !stopping) {
        setShowStopModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showStopModal, stopping]);

  const handleStopConfirmed = async () => {
    if (!session || stopping) return;
    setStopping(true);
    setStopError(null);

    try {
      await sessionApi.stop(session.id);
      setShowStopModal(false);
      navigate(`/sessions/${session.id}/summary`);
    } catch (err) {
      setStopError(err instanceof ApiError ? err.message : 'Failed to stop session');
      setStopping(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs">Synchronizing charging session telemetry...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Session Inaccessible</h2>
        <p className="text-slate-400 text-xs">{error || 'This session does not exist or you lack authorization.'}</p>
        <Link
          to="/sessions"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
        >
          Return to Sessions
        </Link>
      </div>
    );
  }

  // Format elapsed time (hh:mm:ss)
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Deterministic simulation calculations for live telemetry display
  const powerKw = session.maxPowerKw || 50;
  const simulatedKwh = powerKw * (elapsedSeconds / 3600);
  const simulatedCost = simulatedKwh * session.tariffRatePerKwh;
  const currentMeterKwh = session.startMeterKwh + simulatedKwh;

  const isCompleted = session.status === 'COMPLETED';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── TOP HEADER / BREADCRUMB ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link to="/sessions" className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition">
              ← Sessions
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">Session #{session.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Live Charging Cockpit
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
              session.status === 'CHARGING'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                session.status === 'CHARGING' ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
              }`}
            />
            {session.status}
          </span>
        </div>
      </div>

      {/* ── MAIN TELEMETRY GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visual Energy Dial */}
        <div className="lg:col-span-1 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="w-full flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400">EVSE Stall {session.chargerCode}</span>
            <span className="text-emerald-400 font-mono font-bold">{powerKw} kW DC</span>
          </div>

          {/* Central Pulsing Dial */}
          <div className="relative my-8 flex items-center justify-center">
            {/* Ambient halo glow */}
            <div className="absolute inset-0 bg-emerald-500/15 blur-2xl rounded-full" />

            <div
              className={`relative w-48 h-48 sm:w-52 sm:h-52 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-700 ${
                session.status === 'CHARGING'
                  ? 'border-emerald-500/40 bg-emerald-950/30 shadow-2xl shadow-emerald-500/20'
                  : 'border-cyan-500/40 bg-cyan-950/30'
              }`}
            >
              {session.status === 'CHARGING' ? (
                <>
                  <svg className="w-8 h-8 text-emerald-400 fill-current animate-pulse mb-1" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white tabular-nums">
                    {simulatedKwh.toFixed(2)}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold mt-0.5">
                    kWh Delivered
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-cyan-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white tabular-nums">
                    {session.energyConsumedKwh?.toFixed(2) ?? '0.00'}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold mt-0.5">
                    Final kWh
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="w-full pt-4 border-t border-slate-800">
            {session.status === 'CHARGING' ? (
              <button
                onClick={() => setShowStopModal(true)}
                className="w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                <span>Complete Charging & Settle</span>
              </button>
            ) : isCompleted ? (
              <Link
                to={`/sessions/${session.id}/summary`}
                className="w-full py-3 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>View Full Invoice & Receipt</span>
              </Link>
            ) : (
              <div className="text-xs text-slate-500 font-mono">Status: {session.status}</div>
            )}
          </div>
        </div>

        {/* Right 2 Columns: Live Telemetry Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Elapsed Time</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
                {session.status === 'CHARGING' ? timeFormatted : `${session.durationMinutes ?? 0}m`}
              </div>
              <span className="text-[10px] text-slate-500 block">
                {session.status === 'CHARGING' ? 'Live clock' : 'Final duration'}
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Charging Speed</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tabular-nums">
                {session.status === 'CHARGING' ? `${powerKw} kW` : '0 kW'}
              </div>
              <span className="text-[10px] text-slate-500 block">Delivery rate</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tariff Rate</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-teal-400 tabular-nums">
                {formatTariffRate(session.tariffRatePerKwh)}
              </div>
              <span className="text-[10px] text-slate-500 block">Per kWh locked</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accrued Cost</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
                {formatCurrency(session.status === 'CHARGING' ? simulatedCost : session.totalCost)}
              </div>
              <span className="text-[10px] text-slate-500 block">
                {session.status === 'CHARGING' ? 'Live accumulator' : 'Final total'}
              </span>
            </div>
          </div>

          {/* Hardware & Vehicle Configuration Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-white border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <span>Hardware & Station Parameters</span>
              <span className="text-xs font-mono text-emerald-400">Deterministic Telemetry Simulation</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Hub Location</span>
                <p className="text-white font-bold text-sm">{session.stationName}</p>
                <p className="text-slate-400 text-[11px]">{session.stationAddress || 'Municipal Fast Hub'}</p>
              </div>

              <div className="space-y-1 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Connected EV</span>
                <p className="text-white font-bold text-sm">{session.vehicleMakeModel || 'Electric Vehicle'}</p>
                <p className="text-emerald-400 text-[11px] font-mono">Plate: {session.vehiclePlate || 'N/A'}</p>
              </div>

              <div className="space-y-1 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Connector Standard</span>
                <p className="text-white font-mono font-bold text-sm">{session.connectorType}</p>
                <p className="text-slate-400 text-[11px]">Hardware lock verified</p>
              </div>

              <div className="space-y-1 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Meter Readings</span>
                <p className="text-white font-mono text-sm">
                  Start: {session.startMeterKwh.toFixed(2)} kWh
                </p>
                <p className="text-slate-400 font-mono text-[11px]">
                  Current: {session.status === 'CHARGING' ? currentMeterKwh.toFixed(2) : (session.finalMeterKwh?.toFixed(2) ?? '—')} kWh
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STOP CONFIRMATION MODAL ────────────────────────────────────────── */}
      {showStopModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stop-session-title"
        >
          <div className="relative w-full max-w-md bg-[#0e1524] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </div>
              <div>
                <h3 id="stop-session-title" className="text-base font-bold text-white tracking-tight">
                  Stop Charging Session?
                </h3>
                <p className="text-xs text-slate-400">Release EVSE stall and finalize billing</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Stopping will finalize energy delivery, calculate total charges at{' '}
              <strong className="text-white">{formatTariffRate(session.tariffRatePerKwh)}</strong>, release stall{' '}
              <strong className="text-emerald-400 font-mono">{session.chargerCode}</strong>, and transition to invoice settlement.
            </p>

            {stopError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {stopError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowStopModal(false)}
                disabled={stopping}
                className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                Continue Charging
              </button>
              <button
                type="button"
                onClick={handleStopConfirmed}
                disabled={stopping}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20 transition flex items-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                {stopping ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Finalizing...</span>
                  </>
                ) : (
                  <span>Yes, Stop Charging</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveSessionPage;
