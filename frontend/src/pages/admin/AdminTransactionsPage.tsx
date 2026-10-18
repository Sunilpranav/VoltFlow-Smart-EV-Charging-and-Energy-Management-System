import React, { useEffect, useState, useCallback } from 'react';
import { adminApi, ApiError } from '../../api/client';
import type { WalletTransaction, PageResponse } from '../../types';

export const AdminTransactionsPage: React.FC = () => {
  const [txPage, setTxPage] = useState<PageResponse<WalletTransaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const fetchTransactions = useCallback(async (targetPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getTransactions({
        type: typeFilter,
        page: targetPage,
        size: pageSize,
      });
      setTxPage(res);
      setPage(targetPage);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch financial ledger');
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter, page, pageSize]);

  useEffect(() => {
    let isMounted = true;
    adminApi.getTransactions({
      type: typeFilter,
      page: 0,
      size: pageSize,
    })
      .then((res) => {
        if (isMounted) {
          setTxPage(res);
          setPage(0);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to fetch financial ledger');
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
  }, [typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Financial Ledger & Transactions</span>
            {txPage && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {txPage.totalElements} records
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Immutable audit record of customer top-ups, charging debits, and administrative refunds
          </p>
        </div>
        <button
          onClick={() => fetchTransactions(page)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0e1524] border border-[#1e293b] hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Error alert */}
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1e293b] pb-3">
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            typeFilter === 'ALL'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-[#151e32] text-slate-400 hover:text-white border border-[#1e293b]'
          }`}
        >
          All Entries
        </button>
        <button
          onClick={() => setTypeFilter('CREDIT')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            typeFilter === 'CREDIT'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-[#151e32] text-slate-400 hover:text-white border border-[#1e293b]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Credits (Top-Ups)
        </button>
        <button
          onClick={() => setTypeFilter('DEBIT')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            typeFilter === 'DEBIT'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-[#151e32] text-slate-400 hover:text-white border border-[#1e293b]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Debits (Session Payments)
        </button>
        <button
          onClick={() => setTypeFilter('REFUND')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            typeFilter === 'REFUND'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-[#151e32] text-slate-400 hover:text-white border border-[#1e293b]'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          Refunds
        </button>

        {txPage && (
          <div className="ml-auto text-xs text-slate-400">
            Total Records: <span className="font-semibold text-white font-mono">{txPage.totalElements}</span>
          </div>
        )}
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Loading financial ledger...</p>
        </div>
      ) : !txPage || txPage.content.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0e1524] border border-[#1e293b]">
          <div className="w-12 h-12 rounded-2xl bg-[#151e32] text-slate-500 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">No Transactions Found</h4>
          <p className="text-slate-400 text-xs">No ledger records match the selected transaction filter.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0e1524] border border-[#1e293b] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#080c14] text-[10px] uppercase text-slate-400 border-b border-[#1e293b] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Tx ID</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Balance After</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5">Session / Ref</th>
                  <th className="px-5 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60">
                {txPage.content.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#151e32]/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-white whitespace-nowrap">
                      #{tx.id}
                      <div className="text-[10px] text-slate-500 font-normal">Wallet #{tx.walletId}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border tracking-wide uppercase ${
                          tx.transactionType === 'CREDIT'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : tx.transactionType === 'REFUND'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {tx.transactionType}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-xs sm:text-sm whitespace-nowrap">
                      <span
                        className={`font-mono tabular-nums ${
                          tx.transactionType === 'CREDIT' || tx.transactionType === 'REFUND'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {tx.transactionType === 'CREDIT' || tx.transactionType === 'REFUND' ? '+' : '-'}
                        ${Number(tx.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono tabular-nums text-slate-300 font-semibold whitespace-nowrap">
                      ${Number(tx.balanceAfter).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <div className="text-xs text-slate-200 line-clamp-1">{tx.description}</div>
                      {tx.idempotencyKey && (
                        <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5" title={tx.idempotencyKey}>
                          key: {tx.idempotencyKey.slice(0, 16)}...
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {tx.sessionId ? (
                        <span className="px-2 py-0.5 rounded-lg bg-[#151e32] border border-[#1e293b] text-xs font-mono text-emerald-400 font-semibold">
                          Session #{tx.sessionId}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-slate-400">{tx.referenceId || 'Direct'}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-xs text-slate-400 font-mono whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-[#080c14] border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
            <div>
              Page <span className="font-semibold text-white font-mono">{txPage.page + 1}</span> of{' '}
              <span className="font-semibold text-white font-mono">{Math.max(1, txPage.totalPages)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={txPage.first || loading}
                onClick={() => fetchTransactions(page - 1)}
                className="px-3.5 py-1.5 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 border border-[#1e293b] disabled:opacity-40 transition cursor-pointer"
              >
                &larr; Previous
              </button>
              <button
                disabled={txPage.last || loading}
                onClick={() => fetchTransactions(page + 1)}
                className="px-3.5 py-1.5 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 border border-[#1e293b] disabled:opacity-40 transition cursor-pointer"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
