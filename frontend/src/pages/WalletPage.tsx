import React, { useState, useEffect, useCallback } from 'react';
import { walletApi, planApi, ApiError } from '../api/client';
import type { Wallet, WalletTransaction, PrepaidPlan, CustomerPlan } from '../types';

export const WalletPage: React.FC = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [plans, setPlans] = useState<PrepaidPlan[]>([]);
  const [myPlans, setMyPlans] = useState<CustomerPlan[]>([]);

  const [activeTab, setActiveTab] = useState<'transactions' | 'plans' | 'my-plans'>('transactions');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Top Up Modal State
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [topUpProcessing, setTopUpProcessing] = useState<boolean>(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);

  // Plan Purchase Modal / State
  const [purchasingPlanId, setPurchasingPlanId] = useState<number | null>(null);

  const loadWalletData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletData, txData, planData, myPlanData] = await Promise.all([
        walletApi.getWallet(),
        walletApi.getTransactions(),
        planApi.getPlans(),
        planApi.getMyPlans(),
      ]);
      setWallet(walletData);
      setTransactions(txData);
      setPlans(planData);
      setMyPlans(myPlanData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      walletApi.getWallet(),
      walletApi.getTransactions(),
      planApi.getPlans(),
      planApi.getMyPlans(),
    ])
      .then(([walletData, txData, planData, myPlanData]) => {
        if (isMounted) {
          setWallet(walletData);
          setTransactions(txData);
          setPlans(planData);
          setMyPlans(myPlanData);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load wallet data');
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

  // Escape key handler for TopUp modal
  useEffect(() => {
    if (!showTopUpModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !topUpProcessing) {
        setShowTopUpModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTopUpModal, topUpProcessing]);

  const handleSimulateTopUp = async (action: 'SUCCEED' | 'FAIL' | 'CANCEL') => {
    const amount = customAmount ? parseFloat(customAmount) : topUpAmount;
    if (isNaN(amount) || amount <= 0) {
      setTopUpError('Please enter a valid positive top-up amount');
      return;
    }

    setTopUpProcessing(true);
    setTopUpError(null);

    try {
      // 1. Create top-up intent
      const intent = await walletApi.createTopUpIntent(
        amount,
        `topup_${Date.now()}`,
        `Sandbox ${action} Top-Up`
      );

      // 2. Confirm intent with selected simulated outcome
      const confirmed = await walletApi.confirmTopUp(intent.intentId, action);

      if (confirmed.status === 'SUCCEEDED') {
        setSuccessMessage(`Successfully added $${amount.toFixed(2)} to your wallet (Sandbox simulation)`);
        setShowTopUpModal(false);
        setCustomAmount('');
        // Refresh wallet and transaction history
        await loadWalletData();
      } else if (confirmed.status === 'FAILED') {
        setTopUpError('Simulation: Card issuer declined the transaction (Simulated failure)');
      } else {
        setTopUpError('Simulation: Payment intent was cancelled by user');
      }
    } catch (err) {
      setTopUpError(err instanceof ApiError ? err.message : 'Top-up simulation request failed');
    } finally {
      setTopUpProcessing(false);
    }
  };

  const handlePurchasePlan = async (plan: PrepaidPlan) => {
    if (!wallet || wallet.balance < plan.price) {
      setError(`Insufficient wallet balance ($${wallet?.balance.toFixed(2) ?? '0.00'}). Please top up $${(plan.price - (wallet?.balance ?? 0)).toFixed(2)} to purchase this plan.`);
      return;
    }

    setPurchasingPlanId(plan.id);
    setError(null);
    setSuccessMessage(null);

    try {
      const idempotencyKey = `purchase_${plan.id}_${crypto.randomUUID()}`;
      const purchased = await planApi.purchasePlan(plan.id, idempotencyKey);
      setSuccessMessage(`Successfully purchased '${purchased.planName}'! Debited $${purchased.purchasePrice.toFixed(2)} and credited $${purchased.creditedAmount.toFixed(2)} to your wallet.`);
      await loadWalletData();
      setActiveTab('my-plans');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to purchase plan');
    } finally {
      setPurchasingPlanId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Sandbox Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Payment Sandbox & Virtual Energy Ledger</span>
              <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">Phase 5 Demo</span>
            </div>
            <p className="text-amber-400/80 text-[11px] mt-0.5">
              All transactions, top-ups, and prepaid plans are processed in a deterministic test sandbox. No real bank accounts or credit cards are charged.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowTopUpModal(true)}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition shrink-0 shadow-md shadow-amber-400/10 cursor-pointer"
        >
          ⚡ Top Up Demo Funds
        </button>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white p-1">&times;</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white p-1">&times;</button>
        </div>
      )}

      {/* Wallet Balance Hero Card */}
      <div className="bg-gradient-to-br from-[#11192e] via-[#0e1524] to-[#151e32] border border-[#1e293b] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Primary EV Charging Wallet
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-white tracking-tight">
                ${wallet ? wallet.balance.toFixed(2) : '0.00'}
              </span>
              <span className="text-sm font-mono text-slate-400 uppercase tracking-wider">
                {wallet?.currency || 'USD'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Wallet ID: <span className="font-mono text-slate-300">#{wallet?.walletId ?? '—'}</span> • Account:{' '}
              <span className="font-mono text-emerald-400">{wallet?.userEmail}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" />
              </svg>
              <span>Top Up Wallet (Demo)</span>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className="px-4 py-2.5 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-200 font-semibold text-xs border border-[#1e293b] transition flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Prepaid Energy Plans</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-[#151e32] text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#151e32]/50 border border-transparent'
          }`}
        >
          Transaction Ledger ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-[#151e32] text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#151e32]/50 border border-transparent'
          }`}
        >
          Prepaid Energy Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('my-plans')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'my-plans'
              ? 'bg-[#151e32] text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-[#151e32]/50 border border-transparent'
          }`}
        >
          My Purchased Plans ({myPlans.length})
        </button>
      </div>

      {/* Tab 1: Transaction Ledger */}
      {activeTab === 'transactions' && (
        <div className="bg-[#0e1524] border border-[#1e293b] rounded-3xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Fetching verified ledger records...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#151e32] text-slate-400 flex items-center justify-center mx-auto border border-[#1e293b]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-white">No Ledger Transactions Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Top up your virtual wallet or complete a simulated charging session to populate audit records here.
              </p>
              <button
                onClick={() => setShowTopUpModal(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md shadow-emerald-500/20"
              >
                Top Up $50 (Sandbox)
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080c14] border-b border-[#1e293b] text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Tx ID</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Balance After</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Idempotency Key</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/60 font-mono">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[#151e32]/40 transition">
                      <td className="py-3.5 px-4 text-white font-bold tabular-nums">#{tx.id}</td>
                      <td className="py-3.5 px-4 text-slate-300 text-[11px] font-sans">
                        {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tx.transactionType === 'CREDIT'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : tx.transactionType === 'DEBIT'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold tabular-nums">
                        <span className={tx.transactionType === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}>
                          {tx.transactionType === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-200 font-bold tabular-nums">
                        ${tx.balanceAfter.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-sans text-xs">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[10px] font-mono">
                        {tx.idempotencyKey}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-400 text-[11px] font-sans font-semibold">✓ {tx.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Prepaid Energy Plans */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const hasSufficient = wallet ? wallet.balance >= plan.price : false;
            const isPurchasing = purchasingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className="bg-[#0e1524] border border-[#1e293b] hover:border-emerald-500/40 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl transition group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      {plan.validityDays} Days Validity
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-semibold">USD</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-emerald-400 transition">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{plan.description}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#080c14] border border-[#1e293b] space-y-2.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-400 font-medium">Purchase Price:</span>
                      <span className="text-2xl font-black font-mono tabular-nums text-white">${plan.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Credited to Wallet:</span>
                      <span className="text-emerald-400 font-mono tabular-nums font-bold">${plan.creditAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Instant Bonus Added:</span>
                      <span className="text-teal-300 font-mono tabular-nums font-semibold">+${(plan.creditAmount - plan.price).toFixed(2)}</span>
                    </div>
                    {plan.energyAllowanceKwh && (
                      <div className="flex justify-between items-center text-xs border-t border-[#1e293b] pt-2">
                        <span className="text-slate-400">Energy Allowance:</span>
                        <span className="text-cyan-400 font-mono tabular-nums font-semibold">{plan.energyAllowanceKwh.toFixed(0)} kWh</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={() => handlePurchasePlan(plan)}
                    disabled={isPurchasing}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      hasSufficient
                        ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20'
                        : 'bg-[#151e32] text-slate-300 hover:text-white border border-[#1e293b]'
                    }`}
                  >
                    {isPurchasing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Processing Purchase...</span>
                      </>
                    ) : hasSufficient ? (
                      <>
                        <span>Purchase Package</span>
                        <span className="font-mono text-[11px] font-bold tabular-nums">(${plan.price.toFixed(2)})</span>
                      </>
                    ) : (
                      <span>Top Up to Purchase (${plan.price.toFixed(2)})</span>
                    )}
                  </button>

                  {!hasSufficient && (
                    <p className="text-[11px] text-center text-rose-400/90 font-mono">
                      Balance: ${wallet?.balance.toFixed(2) ?? '0.00'} (Need +${(plan.price - (wallet?.balance ?? 0)).toFixed(2)})
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: My Purchased Plans */}
      {activeTab === 'my-plans' && (
        <div className="bg-[#0e1524] border border-[#1e293b] rounded-3xl overflow-hidden shadow-xl">
          {myPlans.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#151e32] text-slate-400 flex items-center justify-center mx-auto border border-[#1e293b]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-white">No Active Plans Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                You haven&apos;t purchased any prepaid energy plans yet. Buy a plan to unlock bonus wallet credits and energy allowances.
              </p>
              <button
                onClick={() => setActiveTab('plans')}
                className="mt-2 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md shadow-emerald-500/20"
              >
                Browse Plans
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {myPlans.map((cp) => (
                <div
                  key={cp.id}
                  className="bg-[#080c14] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{cp.planName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {cp.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Purchased:</span>
                      <span className="font-mono text-white">{new Date(cp.purchasedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Expires:</span>
                      <span className="font-mono text-amber-400 font-semibold">{new Date(cp.expiresAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Credited:</span>
                      <span className="font-mono text-emerald-400 font-bold tabular-nums">${cp.creditedAmount.toFixed(2)}</span>
                    </div>
                    {cp.remainingEnergyKwh && (
                      <div className="flex justify-between text-slate-400 border-t border-[#1e293b] pt-1.5 mt-1.5">
                        <span>Allowance Remaining:</span>
                        <span className="font-mono text-cyan-300 font-semibold tabular-nums">{cp.remainingEnergyKwh.toFixed(0)} kWh</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="topup-modal-title"
        >
          <div className="relative w-full max-w-md bg-[#0e1524] border border-[#1e293b] rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 id="topup-modal-title" className="text-base font-bold text-white">Add Funds (Demo Sandbox)</h3>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                disabled={topUpProcessing}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                aria-label="Close dialog"
              >
                &times;
              </button>
            </div>

            {topUpError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{topUpError}</span>
              </div>
            )}

            {/* Quick Amount Chips */}
            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Select Top-Up Preset</label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setTopUpAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer ${
                      topUpAmount === amt && !customAmount
                        ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/20'
                        : 'bg-[#151e32] text-slate-300 hover:bg-[#1c2740] border border-[#1e293b]'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Or enter custom amount ($)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full bg-[#080c14] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
                />
              </div>
            </div>

            {/* Simulation Action Triggers */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                Simulate Payment Outcome:
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateTopUp('SUCCEED')}
                  disabled={topUpProcessing}
                  className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {topUpProcessing ? (
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>✓ Simulate Success (Add ${customAmount || topUpAmount})</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateTopUp('FAIL')}
                    disabled={topUpProcessing}
                    className="py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
                  >
                    Simulate Card Failure
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateTopUp('CANCEL')}
                    disabled={topUpProcessing}
                    className="py-2 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-400 hover:text-white text-xs font-semibold border border-[#1e293b] transition cursor-pointer"
                  >
                    Simulate Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
