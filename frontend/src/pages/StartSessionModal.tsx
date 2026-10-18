import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleApi, stationApi, sessionApi, ApiError } from '../api/client';
import type { Vehicle, StationSummary, Charger } from '../types';

interface StartSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStationId?: number;
  preselectedChargerId?: number;
}

export const StartSessionModal: React.FC<StartSessionModalProps> = ({
  isOpen,
  onClose,
  preselectedStationId,
  preselectedChargerId,
}) => {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stations, setStations] = useState<StationSummary[]>([]);
  const [chargers, setChargers] = useState<Charger[]>([]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | ''>('');
  const [selectedStationId, setSelectedStationId] = useState<number | ''>(preselectedStationId || '');
  const [selectedChargerId, setSelectedChargerId] = useState<number | ''>(preselectedChargerId || '');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial vehicles and stations
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    Promise.all([vehicleApi.list(), stationApi.list()])
      .then(([vList, sList]) => {
        if (!mounted) return;
        setVehicles(vList);
        setStations(sList);
        if (vList.length > 0) {
          setSelectedVehicleId((prev) => (prev ? prev : vList[0].id));
        }
        if (preselectedStationId) {
          setSelectedStationId(preselectedStationId);
        } else if (sList.length > 0) {
          setSelectedStationId((prev) => (prev ? prev : sList[0].id));
        }
      })
      .catch((err) => {
        if (mounted) setError(err instanceof ApiError ? err.message : 'Failed to load options');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, preselectedStationId]);

  // Load chargers whenever selected station changes
  useEffect(() => {
    if (!selectedStationId) return;

    let mounted = true;
    stationApi.getChargers(Number(selectedStationId))
      .then((cList) => {
        if (!mounted) return;
        setChargers(cList);
        if (preselectedChargerId && cList.some((c) => c.id === preselectedChargerId)) {
          setSelectedChargerId(preselectedChargerId);
        } else if (cList.length > 0) {
          const firstAvailable = cList.find((c) => c.status === 'AVAILABLE');
          setSelectedChargerId(firstAvailable ? firstAvailable.id : cList[0].id);
        } else {
          setSelectedChargerId('');
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load station chargers');
        }
      });

    return () => {
      mounted = false;
    };
  }, [selectedStationId, preselectedChargerId]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const currentVehicle = vehicles.find((v) => v.id === Number(selectedVehicleId));
  const currentCharger = chargers.find((c) => c.id === Number(selectedChargerId));

  // Compatibility and Availability validation
  const isCompatible =
    currentVehicle && currentCharger
      ? currentVehicle.connectorType.toUpperCase() === currentCharger.connectorType.toUpperCase()
      : false;

  const isChargerAvailable = currentCharger ? currentCharger.status === 'AVAILABLE' : false;

  const canStart = Boolean(
    selectedVehicleId &&
    selectedChargerId &&
    isCompatible &&
    isChargerAvailable &&
    !submitting
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canStart || !selectedVehicleId || !selectedChargerId || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const session = await sessionApi.start({
        vehicleId: Number(selectedVehicleId),
        chargerId: Number(selectedChargerId),
      });
      onClose();
      navigate(`/sessions/${session.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to start session');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-session-title"
    >
      <div className="relative w-full max-w-lg bg-[#0e1524] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <h2 id="start-session-title" className="text-lg font-bold text-white tracking-tight">
                Initiate Charging Session
              </h2>
              <p className="text-xs text-slate-400">Real-time telemetry and automated energy billing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading EV fleet and available stations...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-white">No Vehicles Registered</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Please link an electric vehicle to your driver profile before initiating a charging session.
            </p>
            <button
              onClick={() => {
                onClose();
                navigate('/vehicles');
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-400 text-slate-950 text-xs font-bold hover:bg-emerald-300 transition"
            >
              Add Vehicle to Garage
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vehicle Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Select Vehicle
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-500 transition"
                required
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} ({v.registrationNumber}) — {v.connectorType} ({v.batteryCapacityKwh} kWh)
                  </option>
                ))}
              </select>
            </div>

            {/* Station Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Charging Hub
              </label>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-500 transition"
                required
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.availableChargers}/{s.totalChargers} Available)
                  </option>
                ))}
              </select>
            </div>

            {/* Charger Selector */}
            <div className="space-y-1.5">
              <label htmlFor="modal-charger-select" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                3. EVSE Stall Port
              </label>
              <select
                id="modal-charger-select"
                value={selectedChargerId}
                onChange={(e) => setSelectedChargerId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-500 transition cursor-pointer"
                required
              >
                {chargers.map((c) => {
                  const isAvail = c.status === 'AVAILABLE';
                  return (
                    <option key={c.id} value={c.id} disabled={!isAvail}>
                      {c.chargerCode} — {c.connectorType} ({c.maxPowerKw} kW) [{c.status}] {!isAvail ? '(Unavailable)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Compatibility Summary Box */}
            {currentVehicle && currentCharger && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Connector Compatibility:</span>
                  {isCompatible ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span>✓ Compatible</span>
                      <span className="font-mono">({currentVehicle.connectorType})</span>
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <span>✕ Incompatible</span>
                      <span className="font-mono">
                        ({currentVehicle.connectorType} vs {currentCharger.connectorType})
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Stall Status:</span>
                  <span className={`font-bold ${isChargerAvailable ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {currentCharger.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Est. Power Delivery:</span>
                  <span className="text-white font-mono font-bold">{currentCharger.maxPowerKw} kW Peak</span>
                </div>

                {/* Helpful explanation alert if charger cannot be engaged */}
                {!isChargerAvailable && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Stall is currently <strong>{currentCharger.status}</strong>. Please select an available charger.</span>
                  </div>
                )}

                {isChargerAvailable && !isCompatible && (
                  <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Connector mismatch: vehicle has <strong>{currentVehicle.connectorType}</strong>, but stall delivers <strong>{currentCharger.connectorType}</strong>.</span>
                  </div>
                )}
              </div>
            )}

            {/* CTA Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!canStart}
                className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                  canStart
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.99] cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/80'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Engaging EVSE Relays...</span>
                  </>
                ) : (
                  <span>⚡ Confirm & Start Charging</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
