import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { sessionApi, ApiError } from '../api/client';
import type { ChargingSession } from '../types';
import { StartSessionModal } from './StartSessionModal';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Charging Sessions & Billing</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Deterministic telemetry history, real-time power delivery tracking, and wallet settlement records.
          </p>
        </div>

        <button
          onClick={() => setIsStartModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition self-start sm:self-auto cursor-pointer"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span>Initiate Session</span>
        </button>
      </div>

      {/* Active Session Callout Banner */}
      {activeSession && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0e1524] to-[#11192e] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-5 h-5">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping absolute inset-0 m-auto" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 relative" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Active Charging in Progress</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  #{activeSession.id}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeSession.vehicleMakeModel || 'EV'} @ {activeSession.stationName} ({activeSession.chargerCode})
              </p>
            </div>
          </div>

          <Link
            to={`/sessions/${activeSession.id}`}
            className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
          >
            <span>Monitor Live Dispenser &rarr;</span>
          </Link>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3 overflow-x-auto no-scrollbar">
        {['ALL', 'CHARGING', 'COMPLETED', 'CANCELLED'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition shrink-0 cursor-pointer ${
              activeFilter === filter
                ? 'bg-[#151e32] text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#151e32]/50 border border-transparent'
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
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Fetching verified session telemetry...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchSessions(activeFilter)}
            className="text-xs underline font-bold hover:text-white"
          >
            Retry
          </button>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-[#0e1524] border border-[#1e293b] rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#151e32] text-slate-400 flex items-center justify-center mx-auto border border-[#1e293b]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">No Sessions Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {activeFilter === 'ALL'
                ? "You haven't initiated any charging sessions yet. Plug in your EV at an active station to simulate high-power fast charging."
                : `No sessions found with status "${activeFilter}".`}
            </p>
          </div>
          <button
            onClick={() => setIsStartModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer"
          >
            Start Your First Session
          </button>
        </div>
      ) : (
        <div className="bg-[#0e1524] border border-[#1e293b] rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080c14] border-b border-[#1e293b] text-slate-400 uppercase tracking-wider text-[10px] font-bold">
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
              <tbody className="divide-y divide-[#1e293b]/60">
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-[#151e32]/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white tabular-nums">
                      #{session.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{new Date(session.startTime).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{session.stationName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {session.chargerCode} • <span className="text-emerald-400">{session.connectorType}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{session.vehicleMakeModel || 'EV Vehicle'}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{session.vehiclePlate || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      {session.energyConsumedKwh != null ? (
                        <span className="text-emerald-400 font-bold">
                          {session.energyConsumedKwh.toFixed(2)} kWh
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Metering...</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono tabular-nums">
                      {session.status === 'CHARGING'
                        ? 'In Progress'
                        : session.durationMinutes != null
                        ? `${session.durationMinutes} min`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono tabular-nums">
                      ${session.tariffRatePerKwh.toFixed(2)}/kWh
                    </td>
                    <td className="py-3.5 px-4 font-mono tabular-nums">
                      {session.totalCost != null ? (
                        <span className="text-white font-bold">
                          ${session.totalCost.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          session.status === 'CHARGING'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : session.status === 'COMPLETED'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          session.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : session.paymentStatus === 'REFUNDED'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : session.status === 'COMPLETED'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'text-slate-500'
                        }`}
                      >
                        {session.paymentStatus || (session.status === 'COMPLETED' ? 'UNPAID' : '—')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {session.status === 'CHARGING' ? (
                        <Link
                          to={`/sessions/${session.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 font-bold text-[11px] transition"
                        >
                          Monitor Live &rarr;
                        </Link>
                      ) : session.status === 'COMPLETED' ? (
                        <Link
                          to={`/sessions/${session.id}/summary`}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                            session.paymentStatus === 'PAID'
                              ? 'bg-[#151e32] text-slate-300 hover:text-white hover:bg-[#1c2740] border border-[#1e293b]'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-bold'
                          }`}
                        >
                          {session.paymentStatus === 'PAID' ? 'Invoice Summary \u2192' : 'Settle Bill \u2192'}
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-500">—</span>
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
