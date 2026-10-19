import React, { useEffect, useState, useCallback } from 'react';
import { adminApi, ApiError } from '../../api/client';
import type { MaintenanceRecord, Station, CreateMaintenanceRequest, UpdateMaintenanceRequest, MaintenanceSeverity, MaintenanceStatus } from '../../types';

export const AdminMaintenancePage: React.FC = () => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateMaintenanceRequest>({
    chargerId: 0,
    category: 'HARDWARE',
    description: '',
    severity: 'MEDIUM',
    assignedTechnician: '',
  });

  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [updateForm, setUpdateForm] = useState<UpdateMaintenanceRequest>({
    status: 'IN_PROGRESS',
    assignedTechnician: '',
    resolutionNotes: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [mRes, stList] = await Promise.all([
        adminApi.getMaintenanceRecords(),
        adminApi.getStations(),
      ]);
      const recordList = Array.isArray(mRes) ? mRes : (mRes?.content || []);
      setRecords(recordList);
      setStations(stList);
      if (stList.length > 0 && stList[0].chargers && stList[0].chargers.length > 0) {
        setCreateForm((prev) => ({ ...prev, chargerId: stList[0].chargers[0].id }));
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load maintenance records');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      adminApi.getMaintenanceRecords(),
      adminApi.getStations(),
    ])
      .then(([mRes, stList]) => {
        if (isMounted) {
          const recordList = Array.isArray(mRes) ? mRes : (mRes?.content || []);
          setRecords(recordList);
          setStations(stList);
          if (stList.length > 0 && stList[0].chargers && stList[0].chargers.length > 0) {
            setCreateForm((prev) => ({ ...prev, chargerId: stList[0].chargers[0].id }));
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to load maintenance records');
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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.chargerId || !createForm.description.trim()) {
      setError('Please select a charger and enter issue details.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await adminApi.createMaintenance(createForm);
      showSuccess('Maintenance ticket created. High/Critical issues automatically set charger to MAINTENANCE.');
      setIsCreateModalOpen(false);
      setCreateForm({
        chargerId: stations[0]?.chargers?.[0]?.id || 0,
        category: 'HARDWARE',
        description: '',
        severity: 'MEDIUM',
        assignedTechnician: '',
      });
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create ticket');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const openUpdateModal = (record: MaintenanceRecord) => {
    setEditingRecord(record);
    setUpdateForm({
      status: record.status,
      assignedTechnician: record.assignedTechnician || '',
      resolutionNotes: record.resolutionNotes || '',
    });
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      setActionLoading(true);
      setError(null);
      await adminApi.updateMaintenance(editingRecord.id, updateForm);
      showSuccess(`Ticket #${editingRecord.id} updated. Resolving ticket restores charger to AVAILABLE.`);
      setEditingRecord(null);
      await loadData();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update ticket');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const allChargers = stations.flatMap((s) =>
    (s.chargers || []).map((c) => ({
      ...c,
      stationName: s.name,
    }))
  );

  const recordList = Array.isArray(records) ? records : [];
  const filteredRecords = recordList.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && r.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Maintenance & Service Dispatch</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {recordList.length} tickets
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Track hardware defects, dispatch service technicians, and resolve operational outages
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Report Issue / Schedule</span>
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

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-[#0e1524] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="REPORTED">REPORTED</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3.5 py-2 bg-[#0e1524] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="ALL">All Severities</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH (Auto-offline)</option>
          <option value="CRITICAL">CRITICAL (Auto-offline)</option>
        </select>

        <div className="ml-auto text-xs text-slate-400">
          Showing <span className="font-semibold text-white font-mono">{filteredRecords.length}</span> tickets
        </div>
      </div>

      {/* Maintenance Tickets Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[260px] gap-3">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Loading service records...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0e1524] border border-[#1e293b]">
          <div className="w-12 h-12 rounded-2xl bg-[#151e32] text-slate-500 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">No Tickets Found</h4>
          <p className="text-slate-400 text-xs">No maintenance records match the selected status or severity filters.</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0e1524] border border-[#1e293b] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#080c14] text-[10px] uppercase text-slate-400 border-b border-[#1e293b] font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Ticket</th>
                  <th className="px-5 py-3.5">Charger & Station</th>
                  <th className="px-5 py-3.5">Issue & Category</th>
                  <th className="px-5 py-3.5">Severity</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Technician</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60">
                {filteredRecords.map((m) => (
                  <tr key={m.id} className="hover:bg-[#151e32]/40 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-white whitespace-nowrap">
                      #{m.id}
                      <div className="text-[10px] text-slate-500 font-normal">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-emerald-400">{m.chargerCode}</div>
                      <div className="text-xs text-slate-400">{m.stationName}</div>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <div className="text-slate-200 font-medium text-xs line-clamp-2">{m.description}</div>
                      <span className="inline-block px-2 py-0.5 rounded bg-[#151e32] border border-[#1e293b] text-[10px] font-semibold text-slate-400 mt-1 uppercase">
                        {m.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border tracking-wide uppercase ${
                          m.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                            : m.severity === 'HIGH'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : m.severity === 'MEDIUM'
                            ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {m.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border tracking-wide uppercase ${
                          m.status === 'RESOLVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : m.status === 'IN_PROGRESS'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : m.status === 'REPORTED'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-300 whitespace-nowrap">
                      {m.assignedTechnician ? (
                        <span className="font-medium text-slate-200">{m.assignedTechnician}</span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openUpdateModal(m)}
                        className="px-3 py-1.5 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-emerald-400 hover:text-emerald-300 text-xs font-semibold border border-[#1e293b] transition cursor-pointer"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: Create Maintenance Ticket ────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-lg w-full bg-[#0e1524] border border-[#1e293b] rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e293b]">
              <div>
                <h3 className="text-base font-bold text-white">Log Maintenance Ticket</h3>
                <p className="text-xs text-slate-400">Dispatch repair request to service technicians</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#151e32] text-slate-400 hover:text-white flex items-center justify-center text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Charger *</label>
                <select
                  value={createForm.chargerId}
                  onChange={(e) => setCreateForm({ ...createForm, chargerId: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500/50"
                >
                  {allChargers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.chargerCode} &bull; {c.stationName} ({c.connectorType}, {c.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="HARDWARE">HARDWARE</option>
                    <option value="SOFTWARE">SOFTWARE</option>
                    <option value="ELECTRICAL">ELECTRICAL</option>
                    <option value="PHYSICAL_DAMAGE">PHYSICAL_DAMAGE</option>
                    <option value="ROUTINE">ROUTINE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Severity *</label>
                  <select
                    value={createForm.severity}
                    onChange={(e) => setCreateForm({ ...createForm, severity: e.target.value as MaintenanceSeverity })}
                    className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH (Locks Charger)</option>
                    <option value="CRITICAL">CRITICAL (Locks Charger)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe failure symptoms, error codes on display, or damaged cable..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Technician (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera, Grid Tech Services"
                  value={createForm.assignedTechnician || ''}
                  onChange={(e) => setCreateForm({ ...createForm, assignedTechnician: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 text-xs font-medium border border-[#1e293b] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Logging Ticket...' : 'Dispatch Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Update Maintenance Ticket ────────────────────────────────────── */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-lg w-full bg-[#0e1524] border border-[#1e293b] rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1e293b]">
              <div>
                <h3 className="text-base font-bold text-white">Update Ticket #{editingRecord.id}</h3>
                <p className="text-xs text-slate-400">Charger: {editingRecord.chargerCode} &bull; {editingRecord.stationName}</p>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="w-8 h-8 rounded-lg bg-[#151e32] text-slate-400 hover:text-white flex items-center justify-center text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#080c14] border border-[#1e293b] text-xs space-y-1">
                <div className="text-slate-400 font-semibold">Reported Problem:</div>
                <div className="text-slate-200">{editingRecord.description}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ticket Status *</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as MaintenanceStatus })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="REPORTED">REPORTED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED (Restores Charger)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                {updateForm.status === 'RESOLVED' && (
                  <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Marking as RESOLVED automatically restores charger status to AVAILABLE.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Technician</label>
                <input
                  type="text"
                  placeholder="Technician name or contractor"
                  value={updateForm.assignedTechnician || ''}
                  onChange={(e) => setUpdateForm({ ...updateForm, assignedTechnician: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution & Service Notes</label>
                <textarea
                  rows={3}
                  placeholder="Replaced contactor relay, recalibrated power sensor, tested full charge cycle..."
                  value={updateForm.resolutionNotes || ''}
                  onChange={(e) => setUpdateForm({ ...updateForm, resolutionNotes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#080c14] border border-[#1e293b] rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl bg-[#151e32] hover:bg-[#1c2740] text-slate-300 text-xs font-medium border border-[#1e293b] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Save Ticket Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
