import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sessionApi, walletApi, ApiError } from '../api/client';
import type { SessionSummary, Wallet } from '../types';
import { formatCurrency, formatTariffRate, formatEnergy } from '../utils/currency';
import { MotionButton } from '../components/animations';

export const SessionSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<boolean>(false);
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

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center gap-4 animate-fade-in">
        <div className="relative">
          <div className="w-12 h-12 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" />
        </div>
        <p className="text-slate-500 text-sm font-medium animate-pulse">Generating verified billing summary & invoice...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5 animate-scale-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Invoice Not Available</h2>
          <p className="text-slate-500 text-sm">{error || 'Session billing record could not be retrieved from the energy ledger.'}</p>
        </div>
        <Link
          to="/sessions"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm hover-lift active:scale-95"
        >
          &larr; Return to All Sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in-up">
      {/* Top Banner / Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/sessions"
          className="inline-flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 transition group"
        >
          <svg className="w-4 h-4 text-blue-600 group-hover:-translate-x-0.5 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Session History</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            Session: {summary.status}
          </span>
          <span
            className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border ${
              summary.paymentStatus === 'PAID'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200 shadow-xs'
                : summary.paymentStatus === 'REFUNDED'
                ? 'text-purple-700 bg-purple-50 border-purple-200'
                : 'text-amber-700 bg-amber-50 border-amber-200'
            }`}
          >
            Payment: {summary.paymentStatus || 'UNPAID'}
          </span>
        </div>
      </div>

      {paymentMessage && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between shadow-xs animate-scale-in ${
            paymentMessage.type === 'success'
              ? 'bg-blue-50 border border-blue-200 text-blue-800'
              : 'bg-rose-50 border border-rose-200 text-rose-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-current animate-ping" />
            <span>{paymentMessage.text}</span>
          </div>
          <button
            onClick={() => setPaymentMessage(null)}
            className="text-xs font-bold hover:underline ml-3 opacity-80 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Invoice Card */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs relative transition hover:shadow-md">
        {/* Invoice Header */}
        <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-xs">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">VoltFlow Energy Invoice</span>
            </div>
            <p className="text-xs font-mono text-blue-700 font-semibold">SESSION #{summary.sessionId} • TAX INVOICE</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 block font-medium">Total Billed Settlement</span>
            <div className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-slate-900 tracking-tight">
              {formatCurrency(summary.totalCost)}
            </div>
            <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider font-semibold">{summary.currency}</span>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100 text-xs">
            <div className="space-y-4">
              <div>
                <span className="text-blue-700 uppercase text-[10px] font-bold tracking-wider">Account / Driver</span>
                <p className="font-semibold text-slate-900 mt-1 text-sm">{summary.customerName}</p>
                <p className="text-slate-500 font-mono text-xs">{summary.customerEmail}</p>
              </div>
              <div>
                <span className="text-blue-700 uppercase text-[10px] font-bold tracking-wider">Connected EV</span>
                <p className="font-semibold text-slate-900 mt-1 text-sm">{summary.vehicleMakeModel}</p>
                <p className="text-slate-500 font-mono text-xs">License Plate: {summary.registrationNumber}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-blue-700 uppercase text-[10px] font-bold tracking-wider">Charging Facility</span>
                <p className="font-semibold text-slate-900 mt-1 text-sm">{summary.stationName}</p>
                <p className="text-slate-500 text-xs mt-0.5">{summary.stationAddress}</p>
              </div>
              <div>
                <span className="text-blue-700 uppercase text-[10px] font-bold tracking-wider">EVSE Dispenser Hardware</span>
                <p className="font-semibold text-slate-900 mt-1 text-sm font-mono">{summary.chargerCode}</p>
                <p className="text-slate-500 text-xs">Connector: <span className="text-blue-700 font-semibold">{summary.connectorType}</span></p>
              </div>
            </div>
          </div>

          {/* Timeline & Meter Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 text-[11px] font-medium">Session Duration</span>
              <p className="text-slate-900 font-mono font-bold text-sm mt-1">{summary.durationFormatted}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {new Date(summary.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &rarr;{' '}
                {new Date(summary.stopTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div>
              <span className="text-slate-500 text-[11px] font-medium">Meter Initial &rarr; Final</span>
              <p className="text-slate-900 font-mono tabular-nums font-bold text-sm mt-1">
                {formatEnergy(summary.startMeterKwh)} &rarr; {formatEnergy(summary.finalMeterKwh)}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Hardware kWh register</p>
            </div>

            <div>
              <span className="text-slate-500 text-[11px] font-medium">Net Delivered Energy</span>
              <p className="text-blue-700 font-mono tabular-nums font-bold text-sm mt-1">
                {formatEnergy(summary.energyConsumedKwh)}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Calculated delta</p>
            </div>
          </div>

          {/* Itemized Calculation Table */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Itemized Energy Billing Breakdown
            </h4>

            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between py-2 border-b border-slate-200 text-slate-700">
                <span>
                  Energy Delivery ({formatEnergy(summary.energyConsumedKwh)} &times; {formatTariffRate(summary.tariffRatePerKwh)})
                </span>
                <span className="font-mono tabular-nums text-slate-900 font-semibold">
                  {formatCurrency(summary.energyConsumedKwh * summary.tariffRatePerKwh)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-200 text-slate-500">
                <span>Session Connection & Dispenser Access Fee</span>
                <span className="font-mono tabular-nums text-slate-400">$0.00</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-200 text-slate-500">
                <span>Grid Capacity & Environmental Compliance Surcharges</span>
                <span className="font-mono tabular-nums text-slate-400">$0.00</span>
              </div>

              <div className="flex justify-between pt-3 text-sm font-bold text-slate-900">
                <span>Total Amount Due</span>
                <span className="font-mono tabular-nums text-blue-700 text-lg">
                  {formatCurrency(summary.totalCost)} {summary.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Settlement / Payment Action Card */}
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-4 relative overflow-hidden">
            {summary.paymentStatus === 'PAID' && (
              <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none select-none">
                <svg className="w-32 h-32 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div>
                <span className="text-xs uppercase font-bold text-blue-900 tracking-wider">Payment Settlement Status</span>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      summary.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs'
                        : summary.paymentStatus === 'REFUNDED'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${summary.paymentStatus === 'PAID' ? 'bg-emerald-600' : 'bg-current'}`} />
                    {summary.paymentStatus === 'PAID'
                      ? 'Settled (Paid)'
                      : summary.paymentStatus === 'REFUNDED'
                      ? 'Refunded to Wallet'
                      : 'Unpaid / Pending Settlement'}
                  </span>
                  {wallet && (
                    <span className="text-xs text-blue-700 font-mono font-semibold">
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
                        <span className="text-xs text-amber-800 font-medium">
                          Insufficient funds (${wallet.balance.toFixed(2)})
                        </span>
                        <Link
                          to="/wallet"
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition hover-lift active:scale-95"
                        >
                          Top Up Wallet &rarr;
                        </Link>
                      </div>
                    ) : (
                      <MotionButton
                        onClick={handlePay}
                        disabled={paying}
                        loading={paying}
                        variant="primary"
                        className="px-5 py-2.5 text-xs font-bold shadow-md shadow-blue-500/25"
                      >
                        <svg className="w-4 h-4 text-white fill-none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Settle ${summary.totalCost.toFixed(2)} with Wallet</span>
                      </MotionButton>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Legal / Billing Methodology Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-blue-700">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{summary.calculationMethod}</span>
            </div>
            <p className="leading-relaxed text-slate-500">
              Energy consumption certified by real-time hardware meter delta. Settled via VoltFlow Prepaid Wallet ledger with database-level pessimistic write locking and idempotent transaction guarantee.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="text-xs text-blue-600 hover:text-blue-700 transition font-medium"
          >
            &larr; Return to Cockpit
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/sessions"
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-300 transition shadow-xs"
            >
              Session History
            </Link>
            <MotionButton
              onClick={() => window.print()}
              variant="outline"
              className="px-5 py-2.5 text-xs font-bold"
            >
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Invoice Receipt</span>
            </MotionButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSummaryPage;