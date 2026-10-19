import React, { useEffect, useState, useCallback } from 'react';
import { adminApi, ApiError } from '../../api/client';
import type { AdminAuditLog, PageResponse } from '../../types';

export const AdminAuditLogsPage: React.FC = () => {
  const [logsPage, setLogsPage] = useState<PageResponse<AdminAuditLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Selected row for detail modal
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const fetchLogs = useCallback(async (targetPage = 0) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getAuditLogs({
        action: actionFilter,
        entityType: entityFilter,
        page: targetPage,
        size: pageSize,
      });
      setLogsPage(res);
      setPage(targetPage);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load audit trail');
      }
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter, pageSize]);

  useEffect(() => {
    let isMounted = true;
    adminApi.getAuditLogs({
      action: actionFilter,
      entityType: entityFilter,
      page: 0,
      size: pageSize,
    })
      .then((res) => {
        if (isMounted) {
          setLogsPage(res);
          setPage(0);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load audit trail');
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
  }, [actionFilter, entityFilter, pageSize]);

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE') || action.includes('START')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (action.includes('DEACTIVATE') || action.includes('DELETE') || action.includes('CANCEL')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    if (action.includes('REFUND')) {
      return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
    }
    if (action.includes('MAINTENANCE') || action.includes('STOP')) {
      return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    }
    return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Security Audit Trail</span>
            {logsPage && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {logsPage.totalElements} records
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Immutable chronicle of administrative actions, hardware state mutations, and financial adjustments
          </p>
        </div>
        <button
          onClick={() => fetchLogs(page)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0e1524] border border-[#1e293b] hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Error Banner */}
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2 bg-[#0e1524] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="ALL">All Actions</option>
          <option value="CREATE_STATION">CREATE_STATION</option>
          <option value="UPDATE_STATION">UPDATE_STATION</option>
          <option value="DEACTIVATE_STATION">DEACTIVATE_STATION</option>
          <option value="CREATE_CHARGER">CREATE_CHARGER</option>
          <option value="UPDATE_CHARGER">UPDATE_CHARGER</option>
          <option value="DEACTIVATE_CHARGER">DEACTIVATE_CHARGER</option>
          <option value="CREATE_TARIFF">CREATE_TARIFF</option>
          <option value="UPDATE_TARIFF">UPDATE_TARIFF</option>
          <option value="DELETE_TARIFF">DELETE_TARIFF</option>
          <option value="CREATE_PLAN">CREATE_PLAN</option>
          <option value="UPDATE_PLAN">UPDATE_PLAN</option>
          <option value="DELETE_PLAN">DELETE_PLAN</option>
          <option value="CREATE_MAINTENANCE">CREATE_MAINTENANCE</option>
          <option value="UPDATE_MAINTENANCE">UPDATE_MAINTENANCE</option>
          <option value="REFUND_SESSION">REFUND_SESSION</option>
          <option value="START_SESSION">START_SESSION</option>
          <option value="STOP_SESSION">STOP_SESSION</option>
          <option value="WALLET_TOPUP">WALLET_TOPUP</option>
          <option value="WALLET_DEBIT">WALLET_DEBIT</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3.5 py-2 bg-[#0e1524] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="ALL">All Entity Types</option>
          <option value="STATION">STATION</option>
          <option value="CHARGER">CHARGER</option>
          <option value="TARIFF">TARIFF</option>
          <option value="PREPAID_PLAN">PREPAID_PLAN</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
          <option value="CHARGING_SESSION">CHARGING_SESSION</option>
          <option value="WALLET">WALLET</option>
          <option value="USER">USER</option>
        </select>

        {logsPage && (
          <div className="ml-auto text-xs text-slate-400">
            Total Audit Entries: <span className="font-semibold text-white font-mono">{logsPage.totalElements}</span>
          </div>
        )}
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Loading audit chronicle...</p>
        </div>
      ) : !logsPage || logsPage.content.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0e1524] border border-[#1e293b]">
          <div className="w-12 h-12 rounded-2xl bg-[#151e32] text-slate-500 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">No Audit Entries Found</h4>
          <p className="text-slate-400 text-xs">No audit logs match the current action or entity filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0e1524] border border-[#1e293b] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#080c14] text-[10px] uppercase text-slate-400 border-b border-[#1e293b] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Log ID</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Target Entity</th>
                  <th className="px-5 py-3.5">Performed By</th>
                  <th className="px-5 py-3.5">Details</th>
                  <th className="px-5 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60">
                {logsPage.content.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-[#151e32]/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-5 py-4 font-mono font-bold text-slate-300 whitespace-nowrap">
                      #{log.id}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full border tracking-wide uppercase ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">
                      {log.entityType ? (
                        <span className="text-slate-200">
                          {log.entityType} {log.entityId ? <span className="text-slate-500 font-semibold">#{log.entityId}</span> : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-300 whitespace-nowrap">
                      {log.actorEmail || <span className="text-slate-500 italic">SYSTEM</span>}
                    </td>
                    <td className="px-5 py-4 max-w-sm">
                      <div className="text-xs text-slate-300 truncate group-hover:text-emerald-300 transition-colors" title={log.details}>
                        {log.details || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-slate-400 font-mono whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-[#080c14] border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
            <div>
              Page <span className="font-semibold text-white font-mono">{logsPage.page + 1}</span> of{' '}
              <span className="font-semibold text-white font-mono">{Math.max(1, logsPage.totalPages)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={logsPage.first || loading}
                onClick={() => fetchLogs(page - 1)}
                className="px-3.5 py-1.5 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 border border-[#1e293b] disabled:opacity-40 transition cursor-pointer"
              >
                &larr; Previous
              </button>
              <button
                disabled={logsPage.last || loading}
                onClick={() => fetchLogs(page + 1)}
                className="px-3.5 py-1.5 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 border border-[#1e293b] disabled:opacity-40 transition cursor-pointer"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Inspect Audit Log Entry ────────────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-xl w-full bg-[#0e1524] border border-[#1e293b] rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Audit Entry #{selectedLog.id}</h3>
                <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border tracking-wide uppercase ${getActionBadge(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-lg bg-[#151e32] text-slate-400 hover:text-white flex items-center justify-center text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#080c14] border border-[#1e293b] text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Performed By:</span>
                  <span className="font-semibold text-white">{selectedLog.actorEmail || 'SYSTEM'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Timestamp:</span>
                  <span className="font-mono text-slate-200">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Entity Type:</span>
                  <span className="font-mono text-emerald-400">{selectedLog.entityType || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Entity ID:</span>
                  <span className="font-mono text-slate-200">{selectedLog.entityId || 'None'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Action Details & Payload:</label>
                <div className="p-4 rounded-xl bg-[#080c14] border border-[#1e293b] text-xs font-mono text-slate-300 whitespace-pre-wrap break-all max-h-60 overflow-y-auto selection:bg-emerald-500/30">
                  {selectedLog.details || 'No additional details recorded.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-[#1e293b]">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 text-xs font-semibold border border-[#1e293b] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
