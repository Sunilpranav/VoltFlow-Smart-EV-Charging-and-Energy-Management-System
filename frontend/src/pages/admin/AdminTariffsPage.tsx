import React, { useEffect, useState, useCallback } from 'react';
import { adminApi, ApiError } from '../../api/client';
import type { Tariff, CreateTariffRequest, UpdateTariffRequest } from '../../types';

export const AdminTariffsPage: React.FC = () => {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [connectorFilter, setConnectorFilter] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState<Tariff | null>(null);
  const [form, setForm] = useState<{
    name: string;
    ratePerKwh: number;
    connectorType: string;
    currency: string;
    active: boolean;
  }>({
    name: '',
    ratePerKwh: 0.35,
    connectorType: 'CCS2',
    currency: 'USD',
    active: true,
  });

  const [deleteModalTariff, setDeleteModalTariff] = useState<Tariff | null>(null);

  const fetchTariffs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getTariffs();
      setTariffs(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch tariffs');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    adminApi.getTariffs()
      .then((data) => {
        if (isMounted) {
          setTariffs(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to fetch tariffs');
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
    setEditingTariff(null);
    setForm({
      name: '',
      ratePerKwh: 0.35,
      connectorType: 'CCS2',
      currency: 'USD',
      active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (t: Tariff) => {
    setEditingTariff(t);
    setForm({
      name: t.name,
      ratePerKwh: t.ratePerKwh,
      connectorType: t.connectorType || '',
      currency: t.currency || 'USD',
      active: t.active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.ratePerKwh <= 0) {
      setError('Name and a rate greater than $0.00 are required.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      if (editingTariff) {
        const payload: UpdateTariffRequest = {
          name: form.name.trim(),
          ratePerKwh: form.ratePerKwh,
          connectorType: form.connectorType ? form.connectorType : undefined,
          currency: form.currency,
          active: form.active,
        };
        await adminApi.updateTariff(editingTariff.id, payload);
        showSuccess(`Tariff "${form.name}" updated successfully.`);
      } else {
        const payload: CreateTariffRequest = {
          name: form.name.trim(),
          ratePerKwh: form.ratePerKwh,
          connectorType: form.connectorType ? form.connectorType : undefined,
          currency: form.currency,
          active: form.active,
        };
        await adminApi.createTariff(payload);
        showSuccess(`Tariff "${form.name}" created successfully.`);
      }
      setIsModalOpen(false);
      await fetchTariffs();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to save tariff');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setActionLoading(true);
      setError(null);
      await adminApi.deleteTariff(id);
      showSuccess('Tariff deactivated successfully.');
      setDeleteModalTariff(null);
      await fetchTariffs();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to delete tariff');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = tariffs.filter((t) => {
    if (statusFilter === 'ACTIVE' && !t.active) return false;
    if (statusFilter === 'INACTIVE' && t.active) return false;
    if (connectorFilter !== 'ALL' && (t.connectorType || 'DEFAULT') !== connectorFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Tariff Schedules & Energy Pricing</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Define dynamic energy rates per kWh tailored to connector standards and grid load conditions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create New Tariff</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white p-1">&times;</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white p-1">&times;</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3.5 py-2 bg-[#0e1524] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-400 transition cursor-pointer"
        >
          <option value="ALL">All Tariffs</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>

        <select
          value={connectorFilter}
          onChange={(e) => setConnectorFilter(e.target.value)}
          className="px-3.5 py-2 bg-[#0e1524] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-400 transition cursor-pointer"
        >
          <option value="ALL">All Connector Types</option>
          <option value="CCS2">CCS2</option>
          <option value="CCS1">CCS1</option>
          <option value="TYPE2">TYPE2</option>
          <option value="CHADEMO">CHADEMO</option>
          <option value="GBT">GBT</option>
          <option value="DEFAULT">Default / Fallback</option>
        </select>

        <div className="ml-auto text-xs text-slate-400 font-mono">
          Showing <span className="font-bold text-white">{filtered.length}</span> of {tariffs.length} tariffs
        </div>
      </div>

      {/* Tariffs Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[250px] gap-3">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">Loading tariff rates...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0e1524] border border-[#1e293b]">
          <p className="text-slate-400 text-xs sm:text-sm">No tariffs match your selected criteria.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#0e1524] border border-[#1e293b] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#080c14] text-[10px] uppercase text-slate-400 border-b border-[#1e293b] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Tariff Name</th>
                  <th className="px-5 py-3.5">Connector Type</th>
                  <th className="px-5 py-3.5">Rate Per kWh</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Last Updated</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-[#151e32]/40 transition">
                    <td className="px-5 py-4 font-bold text-white">
                      {t.name}
                      <div className="text-[11px] text-slate-500 font-mono font-normal">ID: #{t.id}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#080c14] text-slate-300 font-mono text-xs border border-[#1e293b]">
                        {t.connectorType || 'ALL / DEFAULT'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold font-mono tabular-nums text-emerald-400 text-base">
                      ${Number(t.ratePerKwh).toFixed(2)} <span className="text-xs text-slate-400 font-normal font-sans">/ kWh</span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                          t.active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {t.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                      {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(t)}
                          className="px-3 py-1.5 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-200 text-xs font-semibold border border-[#1e293b] transition cursor-pointer"
                        >
                          Edit
                        </button>
                        {t.active && (
                          <button
                            onClick={() => setDeleteModalTariff(t)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition cursor-pointer"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: Create / Edit Tariff ────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-[#0e1524] border border-[#1e293b] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {editingTariff ? 'Edit Tariff Rate' : 'Create Tariff Schedule'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tariff Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DC Fast CCS2 Peak Rate"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Connector Standard</label>
                <select
                  value={form.connectorType}
                  onChange={(e) => setForm({ ...form, connectorType: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-400 transition cursor-pointer"
                >
                  <option value="">Default (Applies to all connectors)</option>
                  <option value="CCS2">CCS2</option>
                  <option value="CCS1">CCS1</option>
                  <option value="TYPE2">TYPE2</option>
                  <option value="CHADEMO">CHADEMO</option>
                  <option value="GBT">GBT</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Note: Only one active tariff can exist per connector type for a given currency.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rate ($ / kWh) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.ratePerKwh}
                    onChange={(e) => setForm({ ...form, ratePerKwh: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="activeToggle"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-[#080c14] border-[#1e293b]"
                />
                <label htmlFor="activeToggle" className="text-xs sm:text-sm text-slate-300 font-medium">
                  Active (Immediately apply to live charging sessions)
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
                  className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : editingTariff ? 'Save Changes' : 'Create Tariff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Delete ────────────────────────────────────────── */}
      {deleteModalTariff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-[#0e1524] border border-rose-500/30 rounded-3xl shadow-2xl p-6 text-center space-y-4 animate-scale-in">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Deactivate Tariff</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deactivate <span className="font-semibold text-white">"{deleteModalTariff.name}"</span>? New sessions will fallback to default tariffs.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModalTariff(null)}
                className="px-4 py-2 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 text-xs font-medium border border-[#1e293b] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleDelete(deleteModalTariff.id)}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Deactivating...' : 'Deactivate Tariff'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

