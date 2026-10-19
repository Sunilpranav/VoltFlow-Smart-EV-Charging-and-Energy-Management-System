import React, { useEffect, useState, useCallback } from 'react';
import { adminApi, ApiError } from '../../api/client';
import type { PrepaidPlan, CreatePlanRequest, UpdatePlanRequest } from '../../types';

export const AdminPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<PrepaidPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PrepaidPlan | null>(null);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    price: number;
    creditAmount: number;
    energyAllowanceKwh: number;
    validityDays: number;
    currency: string;
    active: boolean;
  }>({
    name: '',
    description: '',
    price: 50.0,
    creditAmount: 60.0,
    energyAllowanceKwh: 150.0,
    validityDays: 30,
    currency: 'USD',
    active: true,
  });

  const [confirmDeletePlan, setConfirmDeletePlan] = useState<PrepaidPlan | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getPlans();
      setPlans(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch prepaid packages');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    adminApi.getPlans()
      .then((data) => {
        if (isMounted) {
          setPlans(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to fetch prepaid packages');
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

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm({
      name: '',
      description: '',
      price: 50.0,
      creditAmount: 60.0,
      energyAllowanceKwh: 150.0,
      validityDays: 30,
      currency: 'USD',
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: PrepaidPlan) => {
    setEditingPlan(p);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      creditAmount: p.creditAmount,
      energyAllowanceKwh: p.energyAllowanceKwh || 0,
      validityDays: p.validityDays,
      currency: p.currency || 'USD',
      active: p.active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.price <= 0 || form.creditAmount <= 0 || form.validityDays < 1) {
      setError('Please provide valid plan details (price > $0, credit > $0, validity >= 1 day).');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      if (editingPlan) {
        const payload: UpdatePlanRequest = {
          name: form.name.trim(),
          description: form.description.trim(),
          price: form.price,
          creditAmount: form.creditAmount,
          energyAllowanceKwh: form.energyAllowanceKwh > 0 ? form.energyAllowanceKwh : undefined,
          validityDays: form.validityDays,
          currency: form.currency,
          active: form.active,
        };
        await adminApi.updatePlan(editingPlan.id, payload);
        showSuccess(`Plan "${form.name}" updated successfully.`);
      } else {
        const payload: CreatePlanRequest = {
          name: form.name.trim(),
          description: form.description.trim(),
          price: form.price,
          creditAmount: form.creditAmount,
          energyAllowanceKwh: form.energyAllowanceKwh > 0 ? form.energyAllowanceKwh : undefined,
          validityDays: form.validityDays,
          currency: form.currency,
          active: form.active,
        };
        await adminApi.createPlan(payload);
        showSuccess(`Plan "${form.name}" created successfully.`);
      }
      setIsModalOpen(false);
      await fetchPlans();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to save plan');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setActionLoading(true);
      setError(null);
      await adminApi.deletePlan(id);
      showSuccess('Prepaid plan deactivated.');
      setConfirmDeletePlan(null);
      await fetchPlans();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to deactivate plan');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = plans.filter((p) => {
    if (filterActive === 'ACTIVE') return p.active;
    if (filterActive === 'INACTIVE') return !p.active;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Prepaid Energy Plans</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {plans.length} configured
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure consumer charging packages, bonus wallet credits, and validity terms
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create New Package</span>
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
        <button
          onClick={() => setFilterActive('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            filterActive === 'ALL'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-[#151e32] text-slate-400 hover:text-white border border-[#1e293b]'
          }`}
        >
          All Plans ({plans.length})
        </button>
        <button
          onClick={() => setFilterActive('ACTIVE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            filterActive === 'ACTIVE'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-[#151e32] text-slate-400 hover:text-white border border-[#1e293b]'
          }`}
        >
          Active ({plans.filter((p) => p.active).length})
        </button>
        <button
          onClick={() => setFilterActive('INACTIVE')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            filterActive === 'INACTIVE'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-[#151e32] text-slate-400 hover:text-white border border-[#1e293b]'
          }`}
        >
          Inactive ({plans.filter((p) => !p.active).length})
        </button>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[260px] gap-3">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Loading prepaid energy packages...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0e1524] border border-[#1e293b]">
          <div className="w-12 h-12 rounded-2xl bg-[#151e32] text-slate-500 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">No Packages Found</h4>
          <p className="text-slate-400 text-xs">No prepaid plans match the current status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((plan) => {
            const bonus = plan.creditAmount - plan.price;
            return (
              <div
                key={plan.id}
                className="rounded-2xl bg-[#0e1524] border border-[#1e293b] hover:border-[#2a3a54] p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 shadow-lg relative overflow-hidden group"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${plan.active ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-slate-700'}`} />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border tracking-wide uppercase ${
                        plan.active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {plan.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">ID #{plan.id}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-emerald-300 transition-colors">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2 min-h-[32px]">{plan.description}</p>

                  <div className="p-4 rounded-xl bg-[#080c14] border border-[#1e293b] space-y-2.5 mb-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Package Price</span>
                      <span className="text-2xl font-black text-white font-mono tabular-nums">
                        ${Number(plan.price).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Wallet Credit</span>
                      <span className="font-bold text-emerald-400 font-mono tabular-nums">
                        ${Number(plan.creditAmount).toFixed(2)}
                        {bonus > 0 && (
                          <span className="text-[10px] text-teal-300 ml-1.5 px-1.5 py-0.5 rounded bg-teal-500/10 font-normal">
                            +${bonus.toFixed(2)} bonus
                          </span>
                        )}
                      </span>
                    </div>

                    {plan.energyAllowanceKwh ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Energy Allowance</span>
                        <span className="font-semibold text-slate-200 font-mono tabular-nums">
                          {plan.energyAllowanceKwh} kWh
                        </span>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1e293b]">
                      <span className="text-slate-400">Validity Period</span>
                      <span className="font-semibold text-slate-200">{plan.validityDays} Days</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1e293b]">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-200 text-xs font-semibold border border-[#1e293b] transition cursor-pointer"
                  >
                    Edit
                  </button>
                  {plan.active && (
                    <button
                      onClick={() => setConfirmDeletePlan(plan)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition cursor-pointer"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Create / Edit Plan ────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-lg w-full bg-[#0e1524] border border-[#1e293b] rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e293b]">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingPlan ? 'Edit Energy Package' : 'Create Energy Package'}
                </h3>
                <p className="text-xs text-slate-400">Configure bundle incentives and validity</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#151e32] text-slate-400 hover:text-white flex items-center justify-center text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starter Boost Pack"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Includes $60 in charging credit + 150 kWh priority allowance."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Credited Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.creditAmount}
                    onChange={(e) => setForm({ ...form, creditAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Energy Allowance (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Optional allowance"
                    value={form.energyAllowanceKwh}
                    onChange={(e) => setForm({ ...form, energyAllowanceKwh: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Validity (Days) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.validityDays}
                    onChange={(e) => setForm({ ...form, validityDays: parseInt(e.target.value, 10) || 30 })}
                    className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="planActiveToggle"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-[#080c14] border-[#1e293b]"
                />
                <label htmlFor="planActiveToggle" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Active (Available in customer store)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 text-xs font-medium border border-[#1e293b] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Deactivation ────────────────────────────────────────── */}
      {confirmDeletePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-[#0e1524] border border-rose-500/30 rounded-2xl shadow-2xl p-6 text-center animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Deactivate Plan</h3>
            <p className="text-xs text-slate-300 mb-6">
              Deactivate <span className="font-semibold text-white">"{confirmDeletePlan.name}"</span>? It will no longer be visible for customer purchase.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setConfirmDeletePlan(null)}
                className="px-4 py-2 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 text-xs font-medium border border-[#1e293b] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleDelete(confirmDeletePlan.id)}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Deactivating...' : 'Deactivate Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
