import React, { useEffect, useState } from 'react';
import { vehicleApi } from '../api/client';
import type { Vehicle, VehicleRequest } from '../types';

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState<string>('75');
  const [connectorType, setConnectorType] = useState('CCS2');
  const [modelYear, setModelYear] = useState<string>('2024');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vehicleApi.list();
      setVehicles(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load registered vehicles.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    vehicleApi.list()
      .then((data) => {
        if (isMounted) {
          setVehicles(data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load registered vehicles.');
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

  const openAddModal = () => {
    setEditingVehicle(null);
    setMake('');
    setModel('');
    setRegistrationNumber('');
    setBatteryCapacityKwh('75');
    setConnectorType('CCS2');
    setModelYear('2024');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setMake(v.make);
    setModel(v.model);
    setRegistrationNumber(v.registrationNumber);
    setBatteryCapacityKwh(v.batteryCapacityKwh.toString());
    setConnectorType(v.connectorType);
    setModelYear(v.modelYear ? v.modelYear.toString() : '');
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingVehicle(null);
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const capacityNum = parseFloat(batteryCapacityKwh);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      setFormError('Battery capacity must be a positive number');
      return;
    }

    const yearNum = modelYear.trim() ? parseInt(modelYear, 10) : undefined;
    if (yearNum && (yearNum < 1990 || yearNum > 2030)) {
      setFormError('Please provide a realistic model year between 1990 and 2030');
      return;
    }

    const payload: VehicleRequest = {
      make: make.trim(),
      model: model.trim(),
      registrationNumber: registrationNumber.trim(),
      batteryCapacityKwh: capacityNum,
      connectorType: connectorType.trim(),
      modelYear: yearNum,
    };

    setSubmitting(true);
    try {
      if (editingVehicle) {
        await vehicleApi.update(editingVehicle.id, payload);
        setSuccessMsg(`Vehicle ${payload.registrationNumber} updated successfully.`);
      } else {
        await vehicleApi.create(payload);
        setSuccessMsg(`Vehicle ${payload.registrationNumber} registered successfully.`);
      }
      closeModal();
      await fetchVehicles();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Operation failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await vehicleApi.delete(id);
      setDeletingId(null);
      setSuccessMsg('Vehicle deleted successfully.');
      await fetchVehicles();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete vehicle.');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">EV Vehicle Fleet</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your registered electric vehicles, battery capacities, and charging connector standards.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Register New EV</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>
      )}

      {/* Global Error Notification */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-52 bg-[#0e1524] rounded-2xl border border-[#1e293b]"></div>
          <div className="h-52 bg-[#0e1524] rounded-2xl border border-[#1e293b]"></div>
          <div className="h-52 bg-[#0e1524] rounded-2xl border border-[#1e293b]"></div>
        </div>
      ) : vehicles.length === 0 ? (
        /* Empty State */
        <div className="p-12 bg-[#0e1524] border border-dashed border-[#1e293b] rounded-3xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-white tracking-tight">No EVs Registered Yet</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Add your electric vehicle to configure battery specifications, verify charging connector compatibility, and simulate real-time charging sessions.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            Register Your First EV
          </button>
        </div>
      ) : (
        /* Vehicles Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-[#0e1524] border border-[#1e293b] hover:border-emerald-500/40 rounded-2xl p-6 transition flex flex-col justify-between space-y-5 shadow-xl group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition tracking-tight">
                      {v.make} {v.model}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {v.modelYear ? `Model Year: ${v.modelYear}` : 'Year unspecified'}
                    </p>
                  </div>
                  {/* License Plate Badge */}
                  <span className="font-mono text-xs font-bold uppercase tracking-widest px-2.5 py-1 bg-[#080c14] text-emerald-400 rounded-lg border border-[#1e293b] shadow-inner">
                    {v.registrationNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-[#1e293b] text-xs">
                  <div className="bg-[#080c14] p-3 rounded-xl border border-[#1e293b]">
                    <span className="text-slate-400 block mb-1 text-[11px] font-medium">Battery Pack</span>
                    <span className="text-white font-bold text-sm font-mono tabular-nums">{v.batteryCapacityKwh} kWh</span>
                  </div>
                  <div className="bg-[#080c14] p-3 rounded-xl border border-[#1e293b]">
                    <span className="text-slate-400 block mb-1 text-[11px] font-medium">Connector</span>
                    <span className="text-emerald-400 font-semibold text-sm">{v.connectorType}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-[#1e293b]">
                <span className="text-[11px] text-slate-400 font-mono">
                  {v.createdAt ? `Added ${new Date(v.createdAt).toLocaleDateString()}` : 'Registered'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(v)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#151e32] hover:bg-[#1c2740] text-slate-200 border border-[#1e293b] transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingId(v.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1524] border border-[#1e293b] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <svg className="w-4 h-4 fill-none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {editingVehicle ? 'Edit EV Information' : 'Register Electric Vehicle'}
                </h2>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white text-lg p-1">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Make</label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Tesla, Hyundai, Rivian..."
                    className="w-full px-3 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Model 3, Ioniq 5, R1T..."
                    className="w-full px-3 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Registration / License Plate</label>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="EV-123-CA"
                  className="w-full px-3 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">Normalized to uppercase and trimmed for uniqueness.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Battery (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={batteryCapacityKwh}
                    onChange={(e) => setBatteryCapacityKwh(e.target.value)}
                    placeholder="75"
                    className="w-full px-3 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Model Year (optional)</label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    value={modelYear}
                    onChange={(e) => setModelYear(e.target.value)}
                    placeholder="2024"
                    className="w-full px-3 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Connector Standard</label>
                <select
                  value={connectorType}
                  onChange={(e) => setConnectorType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition cursor-pointer"
                >
                  <option value="CCS2">CCS2 (Combined Charging System Combo 2)</option>
                  <option value="Type 2">Type 2 (Mennekes AC)</option>
                  <option value="CHAdeMO">CHAdeMO (DC Fast)</option>
                  <option value="NACS">NACS / Tesla Supercharger</option>
                  <option value="GB/T">GB/T</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-[#151e32] hover:bg-[#1c2740] text-slate-300 rounded-xl text-xs font-medium border border-[#1e293b] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1524] border border-[#1e293b] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white tracking-tight">Delete Vehicle</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove this vehicle from your account? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-[#151e32] hover:bg-[#1c2740] text-slate-300 rounded-xl text-xs font-medium border border-[#1e293b] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/20 transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VehiclesPage;
