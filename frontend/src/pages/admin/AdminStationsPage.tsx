import React, { useEffect, useState, useCallback } from 'react';
import { adminApi, ApiError } from '../../api/client';
import type { Station, Charger, CreateStationRequest, CreateChargerRequest, UpdateChargerRequest } from '../../types';

const generateRandomChargerCode = (stationId: number) =>
  `VF-${stationId}-${Math.floor(100 + Math.random() * 900)}`;

export const AdminStationsPage: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedStationId, setExpandedStationId] = useState<number | null>(null);

  // Modals state
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [stationForm, setStationForm] = useState<CreateStationRequest>({
    name: '',
    address: '',
    latitude: 37.7749,
    longitude: -122.4194,
    status: 'ACTIVE',
  });

  const [isChargerModalOpen, setIsChargerModalOpen] = useState(false);
  const [selectedStationIdForCharger, setSelectedStationIdForCharger] = useState<number | null>(null);
  const [editingCharger, setEditingCharger] = useState<Charger | null>(null);
  const [chargerForm, setChargerForm] = useState<{
    chargerCode: string;
    connectorType: string;
    maxPowerKw: number;
    status: string;
  }>({
    chargerCode: '',
    connectorType: 'CCS2',
    maxPowerKw: 50.0,
    status: 'AVAILABLE',
  });

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    type: 'STATION' | 'CHARGER';
    id: number;
    title: string;
    name: string;
  } | null>(null);

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getStations();
      setStations(data);
      setExpandedStationId((prev) => (prev === null && data.length > 0 ? data[0].id : prev));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load stations');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    adminApi.getStations()
      .then((data) => {
        if (isMounted) {
          setStations(data);
          setExpandedStationId((prev) => (prev === null && data.length > 0 ? data[0].id : prev));
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load stations');
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

  // ── Station CRUD Handlers ──────────────────────────────────────────────────
  const openNewStationModal = () => {
    setEditingStation(null);
    setStationForm({
      name: '',
      address: '',
      latitude: 37.7749,
      longitude: -122.4194,
      status: 'ACTIVE',
    });
    setIsStationModalOpen(true);
  };

  const openEditStationModal = (st: Station) => {
    setEditingStation(st);
    setStationForm({
      name: st.name,
      address: st.address,
      latitude: st.latitude,
      longitude: st.longitude,
      status: st.status,
    });
    setIsStationModalOpen(true);
  };

  const handleSaveStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationForm.name.trim() || !stationForm.address.trim()) {
      setError('Station name and address are required');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      if (editingStation) {
        await adminApi.updateStation(editingStation.id, stationForm);
        showSuccess(`Station "${stationForm.name}" updated successfully.`);
      } else {
        await adminApi.createStation(stationForm);
        showSuccess(`Station "${stationForm.name}" created successfully.`);
      }
      setIsStationModalOpen(false);
      await fetchStations();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Operation failed');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateStation = async (id: number) => {
    try {
      setActionLoading(true);
      setError(null);
      await adminApi.deactivateStation(id);
      showSuccess('Station deactivated successfully.');
      setConfirmDeleteModal(null);
      await fetchStations();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to deactivate station');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ── Charger CRUD Handlers ──────────────────────────────────────────────────
  const openNewChargerModal = (stationId: number) => {
    setSelectedStationIdForCharger(stationId);
    setEditingCharger(null);
    setChargerForm({
      chargerCode: generateRandomChargerCode(stationId),
      connectorType: 'CCS2',
      maxPowerKw: 50.0,
      status: 'AVAILABLE',
    });
    setIsChargerModalOpen(true);
  };

  const openEditChargerModal = (stationId: number, ch: Charger) => {
    setSelectedStationIdForCharger(stationId);
    setEditingCharger(ch);
    setChargerForm({
      chargerCode: ch.chargerCode,
      connectorType: ch.connectorType,
      maxPowerKw: ch.maxPowerKw,
      status: ch.status,
    });
    setIsChargerModalOpen(true);
  };

  const handleSaveCharger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargerForm.chargerCode.trim() || chargerForm.maxPowerKw <= 0) {
      setError('Charger code and valid power (kW) are required');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      if (editingCharger) {
        const payload: UpdateChargerRequest = {
          chargerCode: chargerForm.chargerCode,
          connectorType: chargerForm.connectorType,
          maxPowerKw: chargerForm.maxPowerKw,
          status: chargerForm.status,
        };
        await adminApi.updateCharger(editingCharger.id, payload);
        showSuccess(`Charger "${chargerForm.chargerCode}" updated.`);
      } else if (selectedStationIdForCharger) {
        const payload: CreateChargerRequest = {
          stationId: selectedStationIdForCharger,
          chargerCode: chargerForm.chargerCode,
          connectorType: chargerForm.connectorType,
          maxPowerKw: chargerForm.maxPowerKw,
          status: chargerForm.status,
        };
        await adminApi.createCharger(payload);
        showSuccess(`Charger "${chargerForm.chargerCode}" deployed.`);
      }
      setIsChargerModalOpen(false);
      await fetchStations();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Operation failed');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateCharger = async (id: number) => {
    try {
      setActionLoading(true);
      setError(null);
      await adminApi.deactivateCharger(id);
      showSuccess('Charger deactivated successfully.');
      setConfirmDeleteModal(null);
      await fetchStations();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to deactivate charger');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered stations
  const filteredStations = stations.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || st.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Charging Stations & Dispensers</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Deploy charging stations, provision hardware dispensers, and manage operational availability.
          </p>
        </div>
        <button
          onClick={openNewStationModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Hub</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white p-1">&times;</button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search stations by name, address, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0e1524] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-[#0e1524] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-400 transition cursor-pointer"
        >
          <option value="ALL">All Station Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>
      </div>

      {/* Stations List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400">Loading infrastructure data...</p>
        </div>
      ) : filteredStations.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0e1524] border border-[#1e293b]">
          <p className="text-slate-400 text-xs sm:text-sm">No charging stations match your filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStations.map((station) => {
            const isExpanded = expandedStationId === station.id;
            return (
              <div
                key={station.id}
                className="rounded-3xl bg-[#0e1524] border border-[#1e293b] overflow-hidden shadow-xl transition hover:border-[#1e293b]/80"
              >
                {/* Station Card Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div
                    onClick={() => setExpandedStationId(isExpanded ? null : station.id)}
                    className="flex-1 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white hover:text-emerald-400 transition tracking-tight">
                        {station.name}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                          station.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : station.status === 'MAINTENANCE'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {station.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {station.address}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2 font-mono">
                      <span>Coordinates: <span className="text-slate-300">{station.latitude?.toFixed(4)}, {station.longitude?.toFixed(4)}</span></span>
                      <span>•</span>
                      <span>Dispensers: <span className="text-slate-200 font-bold">{station.totalChargers}</span></span>
                      <span>•</span>
                      <span>Available: <span className="text-emerald-400 font-bold">{station.availableChargers}</span></span>
                    </div>
                  </div>

                  {/* Station Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openNewChargerModal(station.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Deploy Dispenser</span>
                    </button>
                    <button
                      onClick={() => openEditStationModal(station)}
                      className="px-3 py-1.5 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-200 border border-[#1e293b] text-xs font-semibold transition cursor-pointer"
                    >
                      Edit
                    </button>
                    {station.status !== 'INACTIVE' && (
                      <button
                        onClick={() =>
                          setConfirmDeleteModal({
                            type: 'STATION',
                            id: station.id,
                            title: 'Deactivate Charging Station',
                            name: station.name,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition cursor-pointer"
                      >
                        Deactivate
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedStationId(isExpanded ? null : station.id)}
                      className="p-2 rounded-xl bg-[#151e32] text-slate-400 hover:text-white border border-[#1e293b] transition cursor-pointer"
                      title={isExpanded ? 'Collapse' : 'Expand chargers'}
                    >
                      <svg
                        className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Expanded Chargers Sub-panel */}
                {isExpanded && (
                  <div className="bg-[#080c14] border-t border-[#1e293b] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Station Charging Outlets ({station.chargers?.length || 0})
                      </span>
                    </div>

                    {!station.chargers || station.chargers.length === 0 ? (
                      <div className="p-6 text-center rounded-2xl bg-[#0e1524] border border-dashed border-[#1e293b]">
                        <p className="text-xs text-slate-400 mb-2">No chargers installed at this station yet.</p>
                        <button
                          onClick={() => openNewChargerModal(station.id)}
                          className="text-xs text-emerald-400 hover:underline font-bold"
                        >
                          + Deploy first charger
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {station.chargers.map((ch) => (
                          <div
                            key={ch.id}
                            className="p-4 rounded-2xl bg-[#0e1524] border border-[#1e293b] hover:border-emerald-500/40 transition flex flex-col justify-between gap-3 shadow-md"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono font-bold text-sm text-white">{ch.chargerCode}</span>
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                    ch.status === 'AVAILABLE'
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : ch.status === 'OCCUPIED'
                                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                      : ch.status === 'MAINTENANCE'
                                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                                  }`}
                                >
                                  {ch.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="px-2 py-0.5 rounded-lg bg-[#080c14] text-slate-300 font-mono text-[11px] border border-[#1e293b]">
                                  {ch.connectorType}
                                </span>
                                <span>•</span>
                                <span className="font-bold font-mono text-emerald-400">{ch.maxPowerKw} kW</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e293b]">
                              <button
                                onClick={() => openEditChargerModal(station.id, ch)}
                                className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-[#151e32] hover:bg-[#1c2740] rounded-lg transition border border-[#1e293b] cursor-pointer"
                              >
                                Edit
                              </button>
                              {ch.status !== 'INACTIVE' && (
                                <button
                                  onClick={() =>
                                    setConfirmDeleteModal({
                                      type: 'CHARGER',
                                      id: ch.id,
                                      title: 'Deactivate Charger Unit',
                                      name: ch.chargerCode,
                                    })
                                  }
                                  className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/20 bg-rose-500/10 rounded-lg transition border border-rose-500/20 cursor-pointer"
                                >
                                  Deactivate
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: Create / Edit Station ────────────────────────────────────────── */}
      {isStationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="max-w-lg w-full bg-[#0e1524] border border-[#1e293b] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {editingStation ? 'Edit Station Details' : 'Deploy New Charging Hub'}
              </h3>
              <button
                onClick={() => setIsStationModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveStation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Station Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Downtown High-Power Hub"
                  value={stationForm.name}
                  onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100 Market St, San Francisco, CA"
                  value={stationForm.address}
                  onChange={(e) => setStationForm({ ...stationForm, address: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-400 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={stationForm.latitude || ''}
                    onChange={(e) => setStationForm({ ...stationForm, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-400 font-mono transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={stationForm.longitude || ''}
                    onChange={(e) => setStationForm({ ...stationForm, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-400 font-mono transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Station Status</label>
                <select
                  value={stationForm.status}
                  onChange={(e) => setStationForm({ ...stationForm, status: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-400 transition cursor-pointer"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsStationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 text-xs font-medium border border-[#1e293b] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : editingStation ? 'Update Station' : 'Create Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Create / Edit Charger ────────────────────────────────────────── */}
      {isChargerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-[#0e1524] border border-[#1e293b] rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e293b]">
              <h3 className="text-lg font-bold text-white tracking-tight">
                {editingCharger ? 'Edit Charger Unit' : 'Deploy New Charger Dispenser'}
              </h3>
              <button
                onClick={() => setIsChargerModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCharger} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Charger Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VF-101-A"
                  value={chargerForm.chargerCode}
                  onChange={(e) => setChargerForm({ ...chargerForm, chargerCode: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Connector Standard</label>
                <select
                  value={chargerForm.connectorType}
                  onChange={(e) => setChargerForm({ ...chargerForm, connectorType: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-400 transition cursor-pointer"
                >
                  <option value="CCS2">CCS2 (DC Fast)</option>
                  <option value="CCS1">CCS1 (DC Combo)</option>
                  <option value="TYPE2">Type 2 (AC Mennekes)</option>
                  <option value="CHADEMO">CHAdeMO (DC)</option>
                  <option value="GBT">GB/T (China Standard)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Power (kW) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="500"
                    step="0.5"
                    value={chargerForm.maxPowerKw}
                    onChange={(e) => setChargerForm({ ...chargerForm, maxPowerKw: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Status</label>
                  <select
                    value={chargerForm.status}
                    onChange={(e) => setChargerForm({ ...chargerForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-400 transition cursor-pointer"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="OCCUPIED">OCCUPIED</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="OUT_OF_ORDER">OUT_OF_ORDER</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsChargerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 text-xs font-medium border border-[#1e293b] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Deploying...' : editingCharger ? 'Save Changes' : 'Deploy Charger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Deactivation ────────────────────────────────────────── */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full bg-[#0e1524] border border-rose-500/30 rounded-3xl shadow-2xl p-6 text-center space-y-4 animate-scale-in">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">{confirmDeleteModal.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to deactivate <span className="font-semibold text-white">"{confirmDeleteModal.name}"</span>?
              {confirmDeleteModal.type === 'STATION' && ' All non-charging chargers linked to this station will also be set to INACTIVE.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteModal(null)}
                className="px-4 py-2 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 text-xs font-medium border border-[#1e293b] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={() => {
                  if (confirmDeleteModal.type === 'STATION') {
                    handleDeactivateStation(confirmDeleteModal.id);
                  } else {
                    handleDeactivateCharger(confirmDeleteModal.id);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition shadow-md shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
