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
    setSubmitting(true);

    const capNum = parseFloat(batteryCapacityKwh);
    if (isNaN(capNum) || capNum <= 0) {
      setFormError('Battery capacity must be a positive number.');
      setSubmitting(false);
      return;
    }

    const payload: VehicleRequest = {
      make: make.trim(),
      model: model.trim(),
      registrationNumber: registrationNumber.trim().toUpperCase(),
      batteryCapacityKwh: capNum,
      connectorType,
      modelYear: modelYear ? parseInt(modelYear, 10) : undefined,
    };

    try {
      if (editingVehicle) {
        await vehicleApi.update(editingVehicle.id, payload);
        setSuccessMsg('Vehicle updated successfully.');
      } else {
        await vehicleApi.create(payload);
        setSuccessMsg('Vehicle registered successfully.');
      }
      closeModal();
      await fetchVehicles();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to save vehicle.');
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">EV Vehicle Fleet</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your registered electric vehicles, battery capacities, and charging connector standards.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Register New EV</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 p-1">✕</button>
        </div>
      )}

      {/* Global Error Notification */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900 p-1">✕</button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="h-52 bg-white rounded-2xl border border-slate-200"></div>
          <div className="h-52 bg-white rounded-2xl border border-slate-200"></div>
          <div className="h-52 bg-white rounded-2xl border border-slate-200"></div>
        </div>
      ) : vehicles.length === 0 ? (
        /* Empty State */
        <div className="p-12 bg-white border border-dashed border-slate-200 rounded-3xl text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center border border-blue-200">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">No EVs Registered Yet</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Add your electric vehicle to configure battery specifications, verify charging connector compatibility, and simulate real-time charging sessions.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition cursor-pointer hover:scale-105"
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
              className="bg-white border border-slate-200 hover:border-blue-400 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between space-y-5 shadow-xs hover:shadow-md hover:scale-[1.01] group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition tracking-tight">
                      {v.make} {v.model}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {v.modelYear ? `Model Year: ${v.modelYear}` : 'Year unspecified'}
                    </p>
                  </div>
                  {/* License Plate Badge */}
                  <span className="font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                    {v.registrationNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-1 text-[11px] font-medium">Battery Pack</span>
                    <span className="text-slate-900 font-bold text-sm font-mono tabular-nums">{v.batteryCapacityKwh} kWh</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block mb-1 text-[11px] font-medium">Connector</span>
                    <span className="text-blue-700 font-semibold text-sm">{v.connectorType}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 font-mono">
                  {v.createdAt ? `Added ${new Date(v.createdAt).toLocaleDateString()}` : 'Registered'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(v)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingId(v.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                  <svg className="w-4 h-4 fill-none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {editingVehicle ? 'Edit EV Information' : 'Register Electric Vehicle'}
                </h2>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 text-lg p-1">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Make</label>
                  <input
                    type="text"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Tesla, Hyundai, Rivian..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Model 3, Ioniq 5, R1T..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Registration / License Plate</label>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="EV-123-CA"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">Normalized to uppercase and trimmed for uniqueness.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Battery (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={batteryCapacityKwh}
                    onChange={(e) => setBatteryCapacityKwh(e.target.value)}
                    placeholder="75"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model Year (optional)</label>
                  <input
                    type="number"
                    min="1990"
                    max="2030"
                    value={modelYear}
                    onChange={(e) => setModelYear(e.target.value)}
                    placeholder="2024"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Connector Standard</label>
                <select
                  value={connectorType}
                  onChange={(e) => setConnectorType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="CCS2">CCS2 (Combined Charging System Combo 2)</option>
                  <option value="Type 2">Type 2 (Mennekes AC)</option>
                  <option value="CHAdeMO">CHAdeMO (DC Fast)</option>
                  <option value="NACS">NACS / Tesla Supercharger</option>
                  <option value="GB/T">GB/T</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer hover:scale-105 active:scale-95"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Delete Vehicle</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove this vehicle from your account? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition cursor-pointer"
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
