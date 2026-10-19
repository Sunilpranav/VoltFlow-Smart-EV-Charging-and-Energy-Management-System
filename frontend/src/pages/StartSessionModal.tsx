import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleApi, stationApi, sessionApi, ApiError } from '../api/client';
import type { Vehicle, StationSummary, Charger } from '../types';
import { ModalWrapper, MotionButton } from '../components/animations';

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

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const currentCharger = chargers.find((c) => c.id === selectedChargerId);

  // Cross-reference connector compatibility
  const isCompatible =
    currentVehicle && currentCharger
      ? currentVehicle.connectorType === currentCharger.connectorType
      : true;

  const isChargerAvailable = currentCharger?.status === 'AVAILABLE';
  const canStart = Boolean(
    selectedVehicleId && selectedChargerId && isCompatible && isChargerAvailable && !submitting
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canStart) return;

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
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => !submitting && onClose()}
      titleId="start-session-title"
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-xs">
              <svg className="w-5 h-5 fill-current animate-pulse" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <div>
              <h2 id="start-session-title" className="text-lg font-bold text-slate-900 tracking-tight">
                Initiate Charging Session
              </h2>
              <p className="text-xs text-slate-500">Real-time telemetry and automated energy billing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-scale-in">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-mono">Loading EV fleet and available stations...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Vehicles Registered</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please link an electric vehicle to your driver profile before initiating a charging session.
            </p>
            <button
              onClick={() => {
                onClose();
                navigate('/vehicles');
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm hover-lift active:scale-95 cursor-pointer"
            >
              Add Vehicle to Garage
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Vehicle Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Select Vehicle
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-xs"
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Charging Hub
              </label>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-xs"
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
              <label htmlFor="modal-charger-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                3. EVSE Stall Port
              </label>
              <select
                id="modal-charger-select"
                value={selectedChargerId}
                onChange={(e) => setSelectedChargerId(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer shadow-xs"
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
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-2.5 text-xs hover-lift">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Connector Compatibility:</span>
                  {isCompatible ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span>✓ Compatible</span>
                      <span className="font-mono">({currentVehicle.connectorType})</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <span>✕ Incompatible</span>
                      <span className="font-mono">
                        ({currentVehicle.connectorType} vs {currentCharger.connectorType})
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Stall Status:</span>
                  <span className={`font-bold ${isChargerAvailable ? 'text-blue-700' : 'text-amber-700'}`}>
                    {currentCharger.status}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Est. Power Delivery:</span>
                  <span className="text-slate-900 font-mono font-bold">{currentCharger.maxPowerKw} kW Peak</span>
                </div>

                {!isChargerAvailable && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Stall is currently <strong>{currentCharger.status}</strong>. Please select an available charger.</span>
                  </div>
                )}

                {isChargerAvailable && !isCompatible && (
                  <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
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
              <MotionButton
                type="submit"
                disabled={!canStart}
                loading={submitting}
                variant="primary"
                className="w-full py-3.5 text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25"
              >
                <span>⚡ Confirm & Start Charging</span>
              </MotionButton>
            </div>
          </form>
        )}
      </div>
    </ModalWrapper>
  );
};

export default StartSessionModal;
