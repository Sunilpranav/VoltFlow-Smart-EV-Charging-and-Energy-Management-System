import React, { useEffect, useState, useCallback } from 'react';
import { adminApi, ApiError } from '../../api/client';
import type { ChargingSession, PageResponse } from '../../types';

export const AdminSessionsPage: React.FC = () => {
  const [sessionsPage, setSessionsPage] = useState<PageResponse<ChargingSession> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  // Refund modal
  const [refundSession, setRefundSession] = useState<ChargingSession | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('Customer request - Admin portal');

  const fetchSessions = useCallback(async (targetPage = 0) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getSessions({
        status: statusFilter,
        paymentStatus: paymentFilter,
        page: targetPage,
        size: pageSize,
      });
      setSessionsPage(res);
      setPage(targetPage);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch charging sessions');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, paymentFilter, pageSize]);

  useEffect(() => {
    let isMounted = true;
    adminApi.getSessions({
      status: statusFilter,
      paymentStatus: paymentFilter,
      page: 0,
      size: pageSize,
    })
      .then((res) => {
        if (isMounted) {
          setSessionsPage(res);
          setPage(0);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to fetch charging sessions');
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
  }, [statusFilter, paymentFilter, pageSize]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const openRefundModal = (session: ChargingSession) => {
    setRefundSession(session);
    setRefundAmount(session.totalCost ? session.totalCost.toFixed(2) : '');
    setRefundReason('Customer refund - Charger interruption or rate adjustment');
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundSession) return;

    try {
      setActionLoading(true);
      setError(null);
      const parsedAmount = refundAmount ? parseFloat(refundAmount) : undefined;
      const res = await adminApi.refundSession(refundSession.id, {
        amount: parsedAmount,
        reason: refundReason,
      });

      showSuccess(`Refund of $${res.amountPaid.toFixed(2)} processed for session #${refundSession.id}. Customer wallet credited.`);
      setRefundSession(null);
      await fetchSessions(page);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Refund failed. Ensure session is PAID and amount is valid.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Charging Sessions & Telemetry</span>
            {sessionsPage && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {sessionsPage.totalElements} recorded
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time metering telemetry, customer session states, payment settlement, and refund actions
          </p>
        </div>
        <button
          onClick={() => fetchSessions(page)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0e1524] border border-[#1e293b] hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white ml-2 text-lg leading-none">&times;</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white ml-2 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-[#0e1524] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="ALL">All Session Statuses</option>
          <option value="CHARGING">CHARGING (Live)</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="PENDING">PENDING</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="FAILED">FAILED</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-3.5 py-2 bg-[#0e1524] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="ALL">All Payment Statuses</option>
          <option value="PAID">PAID</option>
          <option value="UNPAID">UNPAID</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>

        {sessionsPage && (
          <div className="ml-auto text-xs text-slate-400">
            Total Sessions: <span className="font-semibold text-white font-mono">{sessionsPage.totalElements}</span>
          </div>
        )}
      </div>

      {/* Sessions Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Loading charging telemetry...</p>
        </div>
      ) : !sessionsPage || sessionsPage.content.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0e1524] border border-[#1e293b]">
          <div className="w-12 h-12 rounded-2xl bg-[#151e32] text-slate-500 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">No Sessions Found</h4>
          <p className="text-slate-400 text-xs">No charging sessions match your filter criteria.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0e1524] border border-[#1e293b] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#080c14] text-[10px] uppercase text-slate-400 border-b border-[#1e293b] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Session</th>
                  <th className="px-5 py-3.5">Customer & Vehicle</th>
                  <th className="px-5 py-3.5">Station / Charger</th>
                  <th className="px-5 py-3.5">Energy Delivered</th>
                  <th className="px-5 py-3.5">Total Cost</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60">
                {sessionsPage.content.map((s) => (
                  <tr key={s.id} className="hover:bg-[#151e32]/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-white whitespace-nowrap">
                      #{s.id}
                      <div className="text-[10px] text-slate-500 font-normal">
                        {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                        {new Date(s.startTime).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-slate-200 font-semibold text-xs">{s.customerName || s.customerEmail}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {s.vehiclePlate || `${s.vehicleMakeModel || 'EV'}`}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-200 text-xs">{s.stationName}</div>
                      <div className="font-mono text-[11px] text-emerald-400">{s.chargerCode}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-bold text-white font-mono tabular-nums">
                        {s.energyConsumedKwh ? Number(s.energyConsumedKwh).toFixed(2) : '0.00'}
                      </span>{' '}
                      <span className="text-xs text-slate-400">kWh</span>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {s.startMeterKwh?.toFixed(1)} &rarr; {s.finalMeterKwh ? s.finalMeterKwh.toFixed(1) : '...'}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-400 text-xs sm:text-sm font-mono tabular-nums whitespace-nowrap">
                      ${s.totalCost ? Number(s.totalCost).toFixed(2) : '0.00'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border tracking-wide uppercase ${
                          s.status === 'CHARGING'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                            : s.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border tracking-wide uppercase ${
                          s.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : s.paymentStatus === 'REFUNDED'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {s.paymentStatus === 'PAID' ? (
                        <button
                          onClick={() => openRefundModal(s)}
                          className="px-3 py-1 text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition shadow-sm cursor-pointer"
                        >
                          Refund
                        </button>
                      ) : (
                        <span className="text-slate-600 text-xs italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-[#080c14] border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
            <div>
              Page <span className="font-semibold text-white font-mono">{sessionsPage.page + 1}</span> of{' '}
              <span className="font-semibold text-white font-mono">{Math.max(1, sessionsPage.totalPages)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={sessionsPage.first || loading}
                onClick={() => fetchSessions(page - 1)}
                className="px-3.5 py-1.5 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 border border-[#1e293b] disabled:opacity-40 transition cursor-pointer"
              >
                &larr; Previous
              </button>
              <button
                disabled={sessionsPage.last || loading}
                onClick={() => fetchSessions(page + 1)}
                className="px-3.5 py-1.5 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 border border-[#1e293b] disabled:opacity-40 transition cursor-pointer"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Process Refund ────────────────────────────────────────── */}
      {refundSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-[#0e1524] border border-[#1e293b] rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e293b]">
              <div>
                <h3 className="text-base font-bold text-white">Process Admin Refund</h3>
                <p className="text-xs text-slate-400">Credit refund directly to customer wallet</p>
              </div>
              <button
                onClick={() => setRefundSession(null)}
                className="w-8 h-8 rounded-lg bg-[#151e32] text-slate-400 hover:text-white flex items-center justify-center text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#080c14] border border-[#1e293b] text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Session:</span>
                  <span className="font-mono text-white font-bold">#{refundSession.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Customer:</span>
                  <span className="text-slate-200 font-medium">{refundSession.customerEmail}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Original Total Cost:</span>
                  <span className="font-bold text-emerald-400 font-mono tabular-nums">${Number(refundSession.totalCost).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Refund Amount ($) <span className="text-slate-500 font-normal">(Leave blank for full amount)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={refundSession.totalCost}
                  placeholder={`Full amount: $${Number(refundSession.totalCost).toFixed(2)}`}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Refund *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Charger failed mid-session, erroneous billing calculation..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setRefundSession(null)}
                  className="px-4 py-2 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 text-xs font-medium border border-[#1e293b] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Refunding...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
