import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { sessionApi, ApiError } from '../api/client';
import type { ChargingSession } from '../types';
import { formatCurrency, formatTariffRate } from '../utils/currency';
import { ChargingRing, ModalWrapper, GlowCard, EnergyFlow, MotionButton } from '../components/animations';

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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
          <div className="absolute inset-0 rounded-full border border-blue-400/40 animate-pulse-ring" />
        </div>
        <p className="text-slate-600 text-xs font-semibold tracking-wider uppercase font-mono animate-pulse">
          Synchronizing charging session telemetry...
        </p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4 animate-scale-in">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Session Inaccessible</h2>
        <p className="text-slate-500 text-xs">{error || 'This session does not exist or you lack authorization.'}</p>
        <Link
          to="/sessions"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm hover-lift"
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
    <div className="space-y-6 animate-fade-in-up">
      {/* ── TOP HEADER / BREADCRUMB ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link to="/sessions" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition flex items-center gap-1 group">
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Sessions</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-mono text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Session #{session.id}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Live Charging Cockpit
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs transition-colors ${
              session.status === 'CHARGING'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : isCompleted
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                session.status === 'CHARGING' ? 'bg-blue-600 animate-ping' : isCompleted ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
            {session.status}
          </span>
        </div>
      </div>

      {/* ── MAIN TELEMETRY GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visual Energy Dial with 3D Tilt GlowCard */}
        <GlowCard
          className="lg:col-span-1 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-xs"
          glowColor="rgba(56, 189, 248, 0.2)"
          maxTilt={6}
        >
          <div className="w-full flex items-center justify-between text-xs">
            <span className="font-mono text-slate-500 font-medium">EVSE Stall {session.chargerCode}</span>
            <span className="text-blue-700 font-mono font-bold bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              {powerKw} kW DC
            </span>
          </div>

          {/* Central High Priority Animated Charging Ring */}
          <div className="my-6">
            <ChargingRing
              kwh={session.status === 'CHARGING' ? simulatedKwh : (session.energyConsumedKwh ?? 0)}
              powerKw={powerKw}
              status={session.status}
              size={270}
              strokeWidth={14}
              subLabel={session.status === 'CHARGING' ? 'Live Energy' : 'Total Delivered'}
            />
          </div>

          {/* Action Trigger */}
          <div className="w-full pt-4 border-t border-slate-100">
            {session.status === 'CHARGING' ? (
              <MotionButton
                variant="danger"
                size="md"
                onClick={() => setShowStopModal(true)}
                className="w-full"
                icon={
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                }
              >
                Complete Charging & Settle
              </MotionButton>
            ) : isCompleted ? (
              <Link
                to={`/sessions/${session.id}/summary`}
                className="w-full block"
              >
                <MotionButton
                  variant="primary"
                  size="md"
                  className="w-full"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                >
                  View Full Invoice & Receipt
                </MotionButton>
              </Link>
            ) : (
              <div className="text-xs text-slate-500 font-mono">Status: {session.status}</div>
            )}
          </div>
        </GlowCard>

        {/* Right 2 Columns: Live Telemetry Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics Cards with 3D Tilt GlowCard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <GlowCard className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-xs animate-fade-in-up delay-75">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Elapsed Time</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tabular-nums flex items-center gap-1.5">
                {session.status === 'CHARGING' && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                )}
                <span>{session.status === 'CHARGING' ? timeFormatted : `${session.durationMinutes ?? 0}m`}</span>
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">
                {session.status === 'CHARGING' ? 'Live clock' : 'Final duration'}
              </span>
            </GlowCard>

            <GlowCard className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-xs animate-fade-in-up delay-100">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Charging Speed</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-blue-700 tabular-nums">
                {session.status === 'CHARGING' ? `${powerKw} kW` : '0 kW'}
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">Delivery rate</span>
            </GlowCard>

            <GlowCard className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-xs animate-fade-in-up delay-150">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tariff Rate</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-indigo-700 tabular-nums">
                {formatTariffRate(session.tariffRatePerKwh)}
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">Per kWh locked</span>
            </GlowCard>

            <GlowCard className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-1 shadow-xs animate-fade-in-up delay-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Accrued Cost</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tabular-nums">
                {formatCurrency(session.status === 'CHARGING' ? simulatedCost : session.totalCost)}
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">
                {session.status === 'CHARGING' ? 'Live accumulator' : 'Final total'}
              </span>
            </GlowCard>
          </div>

          {/* Animated Energy Conduit Flow Visualizer */}
          <EnergyFlow
            active={session.status === 'CHARGING'}
            powerKw={powerKw}
            fromLabel={`EVSE Stall ${session.chargerCode}`}
            toLabel={session.vehicleMakeModel || 'EV Battery'}
            className="animate-fade-in-up delay-200"
          />

          {/* Hardware & Vehicle Configuration Box */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs animate-fade-in-up delay-250">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Hardware & Station Parameters</span>
              <span className="text-xs font-mono text-blue-600 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Deterministic Telemetry Simulation
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover-lift">
                <span className="text-blue-700 text-[10px] font-bold uppercase tracking-wider block">Hub Location</span>
                <p className="text-slate-900 font-bold text-sm">{session.stationName}</p>
                <p className="text-slate-500 text-[11px]">{session.stationAddress || 'Municipal Fast Hub'}</p>
              </div>

              <div className="space-y-1 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover-lift">
                <span className="text-blue-700 text-[10px] font-bold uppercase tracking-wider block">Connected EV</span>
                <p className="text-slate-900 font-bold text-sm">{session.vehicleMakeModel || 'Electric Vehicle'}</p>
                <p className="text-slate-500 text-[11px] font-mono">Plate: {session.vehiclePlate || 'N/A'}</p>
              </div>

              <div className="space-y-1 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover-lift">
                <span className="text-blue-700 text-[10px] font-bold uppercase tracking-wider block">Connector Standard</span>
                <p className="text-slate-900 font-mono font-bold text-sm">{session.connectorType}</p>
                <p className="text-slate-500 text-[11px]">Hardware lock verified</p>
              </div>

              <div className="space-y-1 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover-lift">
                <span className="text-blue-700 text-[10px] font-bold uppercase tracking-wider block">Meter Readings</span>
                <p className="text-slate-900 font-mono text-sm">
                  Start: {session.startMeterKwh.toFixed(2)} kWh
                </p>
                <p className="text-slate-500 font-mono text-[11px]">
                  Current: {session.status === 'CHARGING' ? currentMeterKwh.toFixed(2) : (session.finalMeterKwh?.toFixed(2) ?? '—')} kWh
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STOP CONFIRMATION MODAL WITH ANIMATED SCALE & BACKDROP BLUR ──────── */}
      <ModalWrapper
        isOpen={showStopModal}
        onClose={() => !stopping && setShowStopModal(false)}
        titleId="stop-session-title"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-xs">
              <svg className="w-5 h-5 fill-current animate-pulse" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </div>
            <div>
              <h3 id="stop-session-title" className="text-base font-bold text-slate-900 tracking-tight">
                Stop Charging Session?
              </h3>
              <p className="text-xs text-slate-500">Release EVSE stall and finalize billing</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Stopping will finalize energy delivery, calculate total charges at{' '}
            <strong className="text-slate-900">{formatTariffRate(session.tariffRatePerKwh)}</strong>, release stall{' '}
            <strong className="text-blue-700 font-mono">{session.chargerCode}</strong>, and transition to invoice settlement.
          </p>

          {stopError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-shake">
              {stopError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <MotionButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowStopModal(false)}
              disabled={stopping}
            >
              Continue Charging
            </MotionButton>
            <MotionButton
              type="button"
              variant="danger"
              size="sm"
              onClick={handleStopConfirmed}
              loading={stopping}
            >
              Yes, Stop Charging
            </MotionButton>
          </div>
        </div>
      </ModalWrapper>
    </div>
  );
};

export default ActiveSessionPage;
