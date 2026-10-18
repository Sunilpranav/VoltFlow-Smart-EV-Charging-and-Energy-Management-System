import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sessionApi, walletApi, ApiError } from '../api/client';
import type { SessionSummary, Wallet } from '../types';
import { formatCurrency, formatTariffRate, formatEnergy } from '../utils/currency';

export const SessionSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<boolean>(false);
  const [refunding, setRefunding] = useState<boolean>(false);
  const [paymentMessage, setPaymentMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    Promise.all([
      sessionApi.getSummary(Number(id)),
      walletApi.getWallet().catch(() => null),
    ])
      .then(([summaryData, walletData]) => {
        if (isMounted) {
          setSummary(summaryData);
          if (walletData) setWallet(walletData);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load session summary');
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

  const handlePay = async () => {
    if (!summary) return;
    setPaying(true);
    setPaymentMessage(null);
    try {
      const res = await sessionApi.pay(summary.sessionId);
      setSummary((prev) => (prev ? { ...prev, paymentStatus: 'PAID' } : null));
      setWallet((prev) => (prev ? { ...prev, balance: res.remainingWalletBalance } : null));
      setPaymentMessage({
        text: `Payment of ${formatCurrency(res.amountPaid)} settled successfully! Transaction ID: #${res.transactionId}`,
        type: 'success',
      });
    } catch (err) {
      setPaymentMessage({
        text: err instanceof ApiError ? err.message : 'Failed to settle session payment',
        type: 'error',
      });
    } finally {
      setPaying(false);
    }
  };

  const handleRefund = async () => {
    if (!summary) return;
    if (!window.confirm('Are you sure you want to refund this session payment back to your wallet?')) return;
    setRefunding(true);
    setPaymentMessage(null);
    try {
      const res = await sessionApi.refund(summary.sessionId);
      setSummary((prev) => (prev ? { ...prev, paymentStatus: 'REFUNDED' } : null));
      setWallet((prev) => (prev ? { ...prev, balance: res.remainingWalletBalance } : null));
      setPaymentMessage({
        text: `Refund of ${formatCurrency(res.amountPaid)} returned to wallet! Transaction ID: #${res.transactionId}`,
        type: 'success',
      });
    } catch (err) {
      setPaymentMessage({
        text: err instanceof ApiError ? err.message : 'Failed to refund session payment',
        type: 'error',
      });
    } finally {
      setRefunding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Generating verified billing summary & invoice...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg shadow-rose-500/10">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Invoice Not Available</h2>
          <p className="text-slate-400 text-sm">{error || 'Session billing record could not be retrieved from the energy ledger.'}</p>
        </div>
        <Link
          to="/sessions"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-white text-xs font-semibold border border-[#1e293b] transition"
        >
          &larr; Return to All Sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner / Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/sessions"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition group"
        >
          <svg className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Session History</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
            Session: {summary.status}
          </span>
          <span
            className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border ${
              summary.paymentStatus === 'PAID'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : summary.paymentStatus === 'REFUNDED'
                ? 'text-purple-400 bg-purple-500/10 border-purple-500/30'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
            }`}
          >
            Payment: {summary.paymentStatus || 'UNPAID'}
          </span>
        </div>
      </div>

      {paymentMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between shadow-lg ${
            paymentMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-current" />
            <span>{paymentMessage.text}</span>
          </div>
          <button
            onClick={() => setPaymentMessage(null)}
            className="text-xs font-bold hover:underline ml-3 opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Invoice Card */}
      <div className="bg-[#0e1524] border border-[#1e293b] rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Invoice Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#11192e] via-[#0e1524] to-[#11192e] border-b border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-sm shadow-emerald-500/20">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">VoltFlow Energy Invoice</span>
            </div>
            <p className="text-xs font-mono text-slate-400">SESSION #{summary.sessionId} • TAX INVOICE</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block font-medium">Total Billed Settlement</span>
            <div className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-emerald-400 tracking-tight">
              {formatCurrency(summary.totalCost)}
            </div>
            <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">{summary.currency}</span>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-[#1e293b] text-xs">
            <div className="space-y-4">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Account / Driver</span>
                <p className="font-semibold text-white mt-1 text-sm">{summary.customerName}</p>
                <p className="text-slate-400 font-mono text-xs">{summary.customerEmail}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Connected EV</span>
                <p className="font-semibold text-white mt-1 text-sm">{summary.vehicleMakeModel}</p>
                <p className="text-slate-400 font-mono text-xs">License Plate: {summary.registrationNumber}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Charging Facility</span>
                <p className="font-semibold text-white mt-1 text-sm">{summary.stationName}</p>
                <p className="text-slate-400 text-xs mt-0.5">{summary.stationAddress}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">EVSE Dispenser Hardware</span>
                <p className="font-semibold text-white mt-1 text-sm font-mono">{summary.chargerCode}</p>
                <p className="text-slate-400 text-xs">Connector: <span className="text-emerald-400 font-medium">{summary.connectorType}</span></p>
              </div>
            </div>
          </div>

          {/* Timeline & Meter Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#080c14] border border-[#1e293b] text-xs">
            <div>
              <span className="text-slate-400 text-[11px] font-medium">Session Duration</span>
              <p className="text-white font-mono font-bold text-sm mt-1">{summary.durationFormatted}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {new Date(summary.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &rarr;{' '}
                {new Date(summary.stopTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] font-medium">Meter Initial &rarr; Final</span>
              <p className="text-white font-mono tabular-nums font-bold text-sm mt-1">
                {formatEnergy(summary.startMeterKwh)} &rarr; {formatEnergy(summary.finalMeterKwh)}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Hardware kWh register</p>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] font-medium">Net Delivered Energy</span>
              <p className="text-emerald-400 font-mono tabular-nums font-bold text-sm mt-1">
                {formatEnergy(summary.energyConsumedKwh)}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Calculated delta</p>
            </div>
          </div>

          {/* Itemized Calculation Table */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Itemized Energy Billing Breakdown
            </h4>

            <div className="space-y-2 text-xs bg-[#080c14] p-4 rounded-2xl border border-[#1e293b]">
              <div className="flex justify-between py-2 border-b border-[#1e293b] text-slate-300">
                <span>
                  Energy Delivery ({formatEnergy(summary.energyConsumedKwh)} &times; {formatTariffRate(summary.tariffRatePerKwh)})
                </span>
                <span className="font-mono tabular-nums text-white font-semibold">
                  {formatCurrency(summary.energyConsumedKwh * summary.tariffRatePerKwh)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#1e293b] text-slate-400">
                <span>Session Connection & Dispenser Access Fee</span>
                <span className="font-mono tabular-nums text-slate-400">$0.00</span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#1e293b] text-slate-400">
                <span>Grid Capacity & Environmental Compliance Surcharges</span>
                <span className="font-mono tabular-nums text-slate-400">$0.00</span>
              </div>

              <div className="flex justify-between pt-3 text-sm font-bold text-white">
                <span>Total Amount Due</span>
                <span className="font-mono tabular-nums text-emerald-400 text-lg">
                  {formatCurrency(summary.totalCost)} {summary.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Settlement / Payment Action Card */}
          <div className="p-5 rounded-2xl bg-[#11192e] border border-[#1e293b] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Payment Settlement Status</span>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      summary.paymentStatus === 'PAID'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : summary.paymentStatus === 'REFUNDED'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {summary.paymentStatus === 'PAID'
                      ? 'Settled (Paid)'
                      : summary.paymentStatus === 'REFUNDED'
                      ? 'Refunded to Wallet'
                      : 'Unpaid / Pending Settlement'}
                  </span>
                  {wallet && (
                    <span className="text-xs text-slate-400 font-mono">
                      (Wallet Balance: ${(wallet.balance ?? 0).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {summary.paymentStatus !== 'PAID' && summary.paymentStatus !== 'REFUNDED' && (
                  <>
                    {wallet && wallet.balance < summary.totalCost ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-400 font-medium">
                          Insufficient funds (${wallet.balance.toFixed(2)})
                        </span>
                        <Link
                          to="/wallet"
                          className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md shadow-amber-400/20 transition"
                        >
                          Top Up Wallet &rarr;
                        </Link>
                      </div>
                    ) : (
                      <button
                        onClick={handlePay}
                        disabled={paying}
                        className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
                      >
                        {paying ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            <span>Settling Transaction...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 fill-none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>Settle ${summary.totalCost.toFixed(2)} with Wallet</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}

                {summary.paymentStatus === 'PAID' && (
                  <button
                    onClick={handleRefund}
                    disabled={refunding}
                    className="px-3.5 py-2 rounded-xl bg-[#151e32] hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 font-semibold text-xs border border-[#1e293b] hover:border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
                    title="Refund settlement back to your wallet ledger"
                  >
                    {refunding ? (
                      <>
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Refunding...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span>Request Wallet Refund</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Legal / Billing Methodology Notice */}
          <div className="p-4 rounded-2xl bg-[#080c14] border border-[#1e293b] text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{summary.calculationMethod}</span>
            </div>
            <p className="leading-relaxed">
              Energy consumption certified by real-time hardware meter delta. Settled via VoltFlow Prepaid Wallet ledger with database-level pessimistic write locking and idempotent transaction guarantee.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-[#080c14] border-t border-[#1e293b] flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="text-xs text-slate-400 hover:text-white transition font-medium"
          >
            &larr; Return to Cockpit
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/sessions"
              className="px-4 py-2 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-xs font-semibold text-slate-200 border border-[#1e293b] transition"
            >
              Session History
            </Link>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Invoice Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSummaryPage;
