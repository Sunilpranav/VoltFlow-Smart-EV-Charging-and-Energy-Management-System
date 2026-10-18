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
      const idempotencyKey = `TOPUP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const intent = await walletApi.createTopUpIntent(amount, idempotencyKey, `Wallet Top Up ($${amount.toFixed(2)})`);

      if (action === 'SUCCEED') {
        const confirmed = await walletApi.confirmTopUp(intent.intentId, 'SUCCEED');
        setSuccessMessage(`Top up successful! Added $${confirmed.amount.toFixed(2)} to wallet.`);
        await loadWalletData();
        setShowTopUpModal(false);
      } else if (action === 'FAIL') {
        await walletApi.confirmTopUp(intent.intentId, 'FAIL');
        setTopUpError('Simulated Card Declined: NSF or invalid card credentials.');
      } else {
        await walletApi.confirmTopUp(intent.intentId, 'CANCEL');
        setShowTopUpModal(false);
      }
    } catch (err) {
      setTopUpError(err instanceof ApiError ? err.message : 'Failed to process top-up');
    } finally {
      setTopUpProcessing(false);
    }
  };

  const handlePurchasePlan = async (plan: PrepaidPlan) => {
    if (!wallet || wallet.balance < plan.price) {
      setError(`Insufficient wallet balance. You need $${(plan.price - (wallet?.balance || 0)).toFixed(2)} more to purchase ${plan.name}.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to purchase "${plan.name}" for $${plan.price.toFixed(2)}?`)) {
      return;
    }

    setPurchasingPlanId(plan.id);
    setError(null);
    setSuccessMessage(null);

    try {
      await planApi.purchasePlan(plan.id);
      setSuccessMessage(`Successfully purchased "${plan.name}"! Bonus credited to your wallet.`);
      await loadWalletData();
      setActiveTab('my-plans');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to complete plan purchase');
    } finally {
      setPurchasingPlanId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Sandbox Notice Banner */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span>Payment Sandbox & Virtual Energy Ledger</span>
              <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold border border-blue-200">Live Simulation</span>
            </div>
            <p className="text-slate-600 text-[11px] mt-0.5">
              All transactions, top-ups, and prepaid plans are processed in a deterministic test sandbox. No real bank accounts or credit cards are charged.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowTopUpModal(true)}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shrink-0 shadow-sm cursor-pointer hover:scale-105 active:scale-95"
        >
          ⚡ Top Up Demo Funds
        </button>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900 p-1">&times;</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 p-1">&times;</button>
        </div>
      )}

      {/* Wallet Balance Hero Card */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-600/15 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white border border-white/20">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Primary EV Charging Wallet
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black font-mono tabular-nums text-white tracking-tight">
                ${wallet ? wallet.balance.toFixed(2) : '0.00'}
              </span>
              <span className="text-sm font-mono text-blue-200 uppercase tracking-wider font-semibold">
                {wallet?.currency || 'USD'}
              </span>
            </div>
            <p className="text-xs text-blue-100">
              Wallet ID: <span className="font-mono font-bold text-white">#{wallet?.walletId ?? '—'}</span> • Account:{' '}
              <span className="font-mono text-white font-semibold">{wallet?.userEmail}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowTopUpModal(true)}
              className="px-6 py-3 rounded-xl bg-white hover:bg-blue-50 text-blue-900 font-bold text-xs shadow-lg shadow-blue-900/20 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current text-blue-600" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" />
              </svg>
              <span>Top Up Wallet (Demo)</span>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className="px-4 py-3 rounded-xl bg-blue-800/80 hover:bg-blue-800 text-white font-semibold text-xs border border-blue-400/40 transition flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Prepaid Energy Plans</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'transactions'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          Transaction Ledger ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'plans'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          Prepaid Energy Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('my-plans')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'my-plans'
              ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          My Purchased Plans ({myPlans.length})
        </button>
      </div>

      {/* Tab 1: Transaction Ledger */}
      {activeTab === 'transactions' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Fetching verified ledger records...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Ledger Transactions Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Top up your virtual wallet or complete a simulated charging session to populate audit records here.
              </p>
              <button
                onClick={() => setShowTopUpModal(true)}
                className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-sm"
              >
                Top Up $50 (Sandbox)
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider text-[10px] font-bold">
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
                <tbody className="divide-y divide-slate-100 font-mono">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-blue-50/30 transition">
                      <td className="py-3.5 px-4 text-slate-900 font-bold tabular-nums">#{tx.id}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px] font-sans">
                        {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tx.transactionType === 'CREDIT'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : tx.transactionType === 'DEBIT'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold tabular-nums">
                        <span className={tx.transactionType === 'CREDIT' ? 'text-blue-700' : 'text-rose-600'}>
                          {tx.transactionType === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 font-bold tabular-nums">
                        ${tx.balanceAfter.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-sans text-xs">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[10px] font-mono">
                        {tx.idempotencyKey}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-700 text-[11px] font-sans font-semibold">✓ {tx.status}</span>
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
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xs hover:shadow-md transition-all duration-300 hover:scale-[1.01] group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      {plan.validityDays} Days Validity
                    </span>
                    <span className="text-xs font-mono text-slate-400 font-semibold">USD</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{plan.description}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-500 font-medium">Purchase Price:</span>
                      <span className="text-2xl font-black font-mono tabular-nums text-slate-900">${plan.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Credited to Wallet:</span>
                      <span className="text-blue-700 font-mono tabular-nums font-bold">${plan.creditAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Instant Bonus Added:</span>
                      <span className="text-emerald-700 font-mono tabular-nums font-semibold">+${(plan.creditAmount - plan.price).toFixed(2)}</span>
                    </div>
                    {plan.energyAllowanceKwh && (
                      <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2">
                        <span className="text-slate-500">Energy Allowance:</span>
                        <span className="text-slate-900 font-mono tabular-nums font-semibold">{plan.energyAllowanceKwh.toFixed(0)} kWh</span>
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
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {isPurchasing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                    <p className="text-[11px] text-center text-rose-600 font-mono">
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
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          {myPlans.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-900">No Active Plans Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You haven&apos;t purchased any prepaid energy plans yet. Buy a plan to unlock bonus wallet credits and energy allowances.
              </p>
              <button
                onClick={() => setActiveTab('plans')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-sm"
              >
                Browse Plans
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {myPlans.map((cp) => (
                <div
                  key={cp.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{cp.planName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {cp.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Purchased:</span>
                      <span className="font-mono text-slate-800">{new Date(cp.purchasedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Expires:</span>
                      <span className="font-mono text-blue-700 font-semibold">{new Date(cp.expiresAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Credited:</span>
                      <span className="font-mono text-slate-900 font-bold tabular-nums">${cp.creditedAmount.toFixed(2)}</span>
                    </div>
                    {cp.remainingEnergyKwh && (
                      <div className="flex justify-between text-slate-500 border-t border-slate-200 pt-1.5 mt-1.5">
                        <span>Allowance Remaining:</span>
                        <span className="font-mono text-blue-700 font-semibold tabular-nums">{cp.remainingEnergyKwh.toFixed(0)} kWh</span>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="topup-modal-title"
        >
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 id="topup-modal-title" className="text-base font-bold text-slate-900">Add Funds (Demo Sandbox)</h3>
              </div>
              <button
                onClick={() => setShowTopUpModal(false)}
                disabled={topUpProcessing}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
                aria-label="Close dialog"
              >
                &times;
              </button>
            </div>

            {topUpError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{topUpError}</span>
              </div>
            )}

            {/* Quick Amount Chips */}
            <div className="space-y-2">
              <label className="text-xs text-slate-700 font-semibold">Select Top-Up Preset</label>
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
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
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
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Simulation Action Triggers */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] text-slate-700 uppercase font-bold tracking-wider">
                Simulate Payment Outcome:
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateTopUp('SUCCEED')}
                  disabled={topUpProcessing}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {topUpProcessing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                    className="py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer"
                  >
                    Simulate Card Failure
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateTopUp('CANCEL')}
                    disabled={topUpProcessing}
                    className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
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
