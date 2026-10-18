import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, ApiError } from '../../api/client';
import type { AdminDashboard } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getDashboard();
      setDashboard(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to connect to admin dashboard service');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    adminApi.getDashboard()
      .then((data) => {
        if (isMounted) {
          setDashboard(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : 'Failed to connect to admin dashboard service');
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

  if (loading && !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500">Loading system metrics from Spring Boot backend...</p>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Failed to Load Dashboard</h3>
        <p className="text-sm text-slate-600 mb-5">{error}</p>
        <button
          onClick={fetchMetrics}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const d = dashboard!;
  const otherChargers = Math.max(0, d.chargerCount - (d.availableChargers + d.occupiedChargers + d.maintenanceChargers));

  return (
    <div className="space-y-6">
      {/* Header with Title and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Telemetry & Operations Cockpit</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time aggregates across EV infrastructure, power delivery throughput, and billing ledger.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-blue-400 text-slate-700 hover:text-blue-700 text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <svg className={`w-3.5 h-3.5 text-blue-600 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loading ? 'Refreshing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* Top Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-400 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Users</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black font-mono tabular-nums text-slate-900">{d.customerCount}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-700 font-bold">{d.vehicleCount}</span> registered EVs
          </div>
        </div>

        {/* Stations */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-400 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Charging Hubs</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black font-mono tabular-nums text-slate-900">{d.stationCount}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-700 font-bold">{d.chargerCount}</span> active EVSE dispensers
          </div>
        </div>

        {/* Active Charging Sessions */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-400 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Charging</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black font-mono tabular-nums text-slate-900">{d.activeSessions}</div>
            {d.activeSessions > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="text-blue-700 font-semibold font-mono tabular-nums">{d.completedSessions}</span> completed sessions
          </div>
        </div>

        {/* Total Energy Consumed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-400 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Energy Delivered</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black font-mono tabular-nums text-slate-900">
            {Number(d.totalEnergyKwh).toFixed(1)} <span className="text-sm font-normal text-slate-400">kWh</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Network throughput aggregate</div>
        </div>
      </div>

      {/* Charger Fleet Health & Financial Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charger Fleet Breakdown */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Dispenser Fleet Status</h3>
              <p className="text-xs text-slate-500">Real-time availability across {d.chargerCount} installed hardware units</p>
            </div>
            <Link
              to="/admin/stations"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              Manage Fleet &rarr;
            </Link>
          </div>

          {/* Availability Bar */}
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
            {d.chargerCount > 0 ? (
              <>
                <div
                  style={{ width: `${(d.availableChargers / d.chargerCount) * 100}%` }}
                  className="bg-blue-600 h-full transition-all"
                  title={`Available: ${d.availableChargers}`}
                ></div>
                <div
                  style={{ width: `${(d.occupiedChargers / d.chargerCount) * 100}%` }}
                  className="bg-sky-400 h-full transition-all"
                  title={`Occupied: ${d.occupiedChargers}`}
                ></div>
                <div
                  style={{ width: `${(d.maintenanceChargers / d.chargerCount) * 100}%` }}
                  className="bg-amber-500 h-full transition-all"
                  title={`Maintenance: ${d.maintenanceChargers}`}
                ></div>
                <div
                  style={{ width: `${(otherChargers / d.chargerCount) * 100}%` }}
                  className="bg-slate-300 h-full transition-all"
                  title={`Inactive / Other: ${otherChargers}`}
                ></div>
              </>
            ) : (
              <div className="w-full bg-slate-100"></div>
            )}
          </div>

          {/* Fleet Status Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="text-xs text-slate-600 font-medium">Available</span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">{d.availableChargers}</div>
              <div className="text-[10px] text-blue-700 font-mono mt-0.5">
                {d.chargerCount > 0 ? ((d.availableChargers / d.chargerCount) * 100).toFixed(0) : 0}% of fleet
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span className="text-xs text-slate-600 font-medium">Occupied</span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-blue-700">{d.occupiedChargers}</div>
              <div className="text-[10px] text-blue-700 font-mono mt-0.5">
                {d.chargerCount > 0 ? ((d.occupiedChargers / d.chargerCount) * 100).toFixed(0) : 0}% of fleet
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-xs text-slate-600 font-medium">Maintenance</span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-amber-700">{d.maintenanceChargers}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {d.chargerCount > 0 ? ((d.maintenanceChargers / d.chargerCount) * 100).toFixed(0) : 0}% of fleet
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span className="text-xs text-slate-600 font-medium">Offline/Other</span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-700">{otherChargers}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {d.chargerCount > 0 ? ((otherChargers / d.chargerCount) * 100).toFixed(0) : 0}% of fleet
              </div>
            </div>
          </div>
        </div>

        {/* Financial & Revenue Ledger */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue & Billing Ledger</h3>
              <p className="text-xs text-slate-500">Settled sessions, prepaid packages, and wallet movements</p>
            </div>
            <Link
              to="/admin/transactions"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              View Ledger &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1 font-medium">Paid Charging Revenue</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">${Number(d.paidRevenue).toFixed(2)}</div>
              <div className="text-[10px] text-slate-400 mt-1">Direct wallet deductions</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1 font-medium">Unpaid / Pending Sessions</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-blue-700">${Number(d.unpaidRevenue).toFixed(2)}</div>
              <div className="text-[10px] text-slate-400 mt-1">Pending driver settlement</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1 font-medium">Prepaid Plan Purchases</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                ${Number(d.planPurchasesAmount).toFixed(2)}
              </div>
              <div className="text-[10px] text-blue-700 font-medium mt-1">
                {d.planPurchasesCount} packages purchased
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1 font-medium">Top-Ups & Refunds</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono tabular-nums text-slate-900">${Number(d.successfulTopUpsAmount).toFixed(2)}</span>
                <span className="text-xs font-mono tabular-nums text-rose-600">(-${Number(d.refundsAmount).toFixed(2)})</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                {d.successfulTopUpsCount} top-ups • {d.refundsCount} refunds
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Quick Actions */}
      <div className="p-6 rounded-3xl bg-blue-50/70 border border-blue-200">
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-4">Operations Console Navigation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            to="/admin/stations"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition group"
          >
            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center justify-between">
              <span>Stations & Chargers</span>
              <span className="group-hover:translate-x-1 transition">&rarr;</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">Add stations, deploy chargers, toggle operational status</p>
          </Link>

          <Link
            to="/admin/tariffs"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition group"
          >
            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center justify-between">
              <span>Tariff Rates</span>
              <span className="group-hover:translate-x-1 transition">&rarr;</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">Configure connector-specific electricity rates per kWh</p>
          </Link>

          <Link
            to="/admin/maintenance"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition group"
          >
            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center justify-between">
              <span>Maintenance Logs</span>
              <span className="group-hover:translate-x-1 transition">&rarr;</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">Dispatch technician tickets and monitor repair workflows</p>
          </Link>

          <Link
            to="/admin/audit-logs"
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition group"
          >
            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center justify-between">
              <span>Security Audit Trail</span>
              <span className="group-hover:translate-x-1 transition">&rarr;</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">Inspect immutable chronicle of administrative mutations</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
