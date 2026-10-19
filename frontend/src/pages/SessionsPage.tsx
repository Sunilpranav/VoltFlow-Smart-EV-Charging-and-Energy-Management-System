import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { sessionApi, ApiError } from '../api/client';
import type { ChargingSession } from '../types';
import { StartSessionModal } from './StartSessionModal';
import { MotionButton } from '../components/animations';

export const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isStartModalOpen, setIsStartModalOpen] = useState<boolean>(false);

  const fetchSessions = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionApi.list(status === 'ALL' ? undefined : status);
      setSessions(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    sessionApi.list(activeFilter === 'ALL' ? undefined : activeFilter)
      .then((data) => {
        if (isMounted) {
          setSessions(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load sessions');
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
  }, [activeFilter]);

  const activeSession = sessions.find((s) => s.status === 'CHARGING');

  const filteredSessions = sessions.filter((s) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CANCELLED') return s.status === 'CANCELLED' || s.status === 'FAILED';
    return s.status === activeFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Charging Sessions & Billing</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Deterministic telemetry history, real-time power delivery tracking, and wallet settlement records.
          </p>
        </div>

        <MotionButton
          onClick={() => setIsStartModalOpen(true)}
          variant="primary"
          className="px-5 py-2.5 text-xs font-bold shadow-md shadow-blue-500/20 self-start sm:self-auto"
        >
          <svg className="w-4 h-4 fill-current text-white animate-pulse" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span>Initiate Session</span>
        </MotionButton>
      </div>

      {/* Active Session Callout Banner */}
      {activeSession && (
        <div className="p-5 rounded-3xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-energy hover-lift">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-6 h-6">
              <span className="w-4 h-4 rounded-full bg-blue-600 animate-ping absolute inset-0 m-auto" />
              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 relative" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Active Charging in Progress</span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold border border-blue-200 shadow-xs">
                  Session #{activeSession.id}
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-0.5">
                {activeSession.vehicleMakeModel || 'EV'} @ {activeSession.stationName} ({activeSession.chargerCode})
              </p>
            </div>
          </div>

          <Link
            to={`/sessions/${activeSession.id}`}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 hover-lift cursor-pointer"
          >
            <span>Monitor Live Dispenser &rarr;</span>
          </Link>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        {['ALL', 'CHARGING', 'COMPLETED', 'CANCELLED'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
              activeFilter === filter
                ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            {filter === 'ALL'
              ? 'All Sessions'
              : filter === 'CHARGING'
              ? 'Active (Charging)'
              : filter === 'COMPLETED'
              ? 'Completed'
              : 'Cancelled / Interrupted'}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium font-mono">Fetching verified session telemetry...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-xs animate-scale-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchSessions(activeFilter)}
            className="text-xs underline font-bold hover:text-rose-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center space-y-4 shadow-xs animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-xs">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-900">No Sessions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeFilter === 'ALL'
                ? "You haven't initiated any charging sessions yet. Plug in your EV at an active station to simulate high-power fast charging."
                : `No sessions found with status "${activeFilter}".`}
            </p>
          </div>
          <button
            onClick={() => setIsStartModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer hover-lift active:scale-95"
          >
            Start Your First Session
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Session</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Station & Charger</th>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Delivered</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Rate</th>
                  <th className="py-3.5 px-4">Total Cost</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSessions.map((session, idx) => (
                  <tr
                    key={session.id}
                    style={{ animationDelay: `${Math.min(idx * 40, 280)}ms` }}
                    className="hover:bg-blue-50/40 transition-colors animate-fade-in"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 tabular-nums">
                      #{session.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{new Date(session.startTime).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-medium">{session.stationName}</div>
                      <div className="text-[11px] text-blue-700 font-mono mt-0.5">
                        {session.chargerCode} • <span className="text-blue-800 font-semibold">{session.connectorType}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-medium">{session.vehicleMakeModel || 'EV Vehicle'}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{session.vehiclePlate || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      {session.energyConsumedKwh != null ? (
                        <span className="text-blue-700 font-bold">
                          {session.energyConsumedKwh.toFixed(2)} kWh
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Metering...</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono tabular-nums">
                      {session.status === 'CHARGING'
                        ? 'In Progress'
                        : session.durationMinutes != null
                        ? `${session.durationMinutes} min`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono tabular-nums">
                      ${session.tariffRatePerKwh.toFixed(2)}/kWh
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      {session.totalCost != null ? (
                        <span className="text-slate-900 font-bold">
                          ${session.totalCost.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                          session.status === 'CHARGING'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : session.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                          session.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : session.paymentStatus === 'REFUNDED'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : session.status === 'COMPLETED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'text-slate-400'
                        }`}
                      >
                        {session.paymentStatus || (session.status === 'COMPLETED' ? 'UNPAID' : '—')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {session.status === 'CHARGING' ? (
                        <Link
                          to={`/sessions/${session.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-[11px] transition shadow-xs hover:scale-105 active:scale-95 hover-lift"
                        >
                          Monitor Live &rarr;
                        </Link>
                      ) : session.status === 'COMPLETED' ? (
                        <Link
                          to={`/sessions/${session.id}/summary`}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition shadow-xs hover:scale-105 active:scale-95 hover-lift ${
                            session.paymentStatus === 'PAID'
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                              : 'bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20'
                          }`}
                        >
                          {session.paymentStatus === 'PAID' ? 'Invoice Summary \u2192' : 'Settle Bill \u2192'}
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Start Session Modal */}
      <StartSessionModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
      />
    </div>
  );
};

export default SessionsPage;
