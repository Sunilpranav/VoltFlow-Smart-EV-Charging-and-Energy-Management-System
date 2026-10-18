import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { stationApi } from '../api/client';
import type { StationSummary } from '../types';

export const StationsPage: React.FC = () => {
  const [stations, setStations] = useState<StationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'availability' | 'name'>('default');

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await stationApi.list(searchTerm, statusFilter);
        if (isMounted) {
          setStations(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Failed to fetch charging stations');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm, statusFilter]);

  // Client-side sorting on real API results
  const sortedStations = useMemo(() => {
    const list = [...stations];
    if (sortBy === 'availability') {
      return list.sort((a, b) => b.availableChargers - a.availableChargers);
    }
    if (sortBy === 'name') {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [stations, sortBy]);

  return (
    <div className="space-y-8">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Public Charging Infrastructure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Find Charging Hubs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse verified high-speed DC stalls, verify real-time connector availability, and initiate sessions
          </p>
        </div>
      </div>

      {/* ── SEARCH, FILTER & SORT CONTROLS ─────────────────────────────────── */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-md">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <label htmlFor="station-search" className="sr-only">
            Search charging hubs by name or address
          </label>
          <svg
            className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="station-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search hub by name or address..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-500 transition"
          />
        </div>

        {/* Filter and Sort Group */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-xs text-slate-400 font-medium whitespace-nowrap">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by hub operational status"
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="ALL">All Hubs</option>
              <option value="ACTIVE">Operational Only</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-filter" className="text-xs text-slate-400 font-medium whitespace-nowrap">
              Sort:
            </label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'default' | 'availability' | 'name')}
              aria-label="Sort charging hubs"
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="default">Default</option>
              <option value="availability">Most Stalls Free</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
            }}
            className="text-xs underline hover:text-rose-300 ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── STATIONS GRID ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-60 bg-slate-900/60 rounded-3xl border border-slate-800" />
          ))}
        </div>
      ) : sortedStations.length === 0 ? (
        <div className="p-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl text-center space-y-3">
          <p className="text-xs sm:text-sm text-slate-400">No charging hubs match the specified criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setSortBy('default');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedStations.map((s) => {
            const hasCoords = typeof s.latitude === 'number' && typeof s.longitude === 'number';
            const osmUrl = hasCoords
              ? `https://www.openstreetmap.org/?mlat=${s.latitude}&mlon=${s.longitude}#map=16/${s.latitude}/${s.longitude}`
              : null;

            return (
              <div
                key={s.id}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition-all duration-200 flex flex-col justify-between space-y-5 shadow-lg group"
              >
                <div className="space-y-4">
                  {/* Header & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                        Station #{s.id}
                      </span>
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {s.name}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  {/* Location */}
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{s.address}</span>
                  </p>

                  {/* Capacity & Telemetry */}
                  <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Stall Availability</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {s.availableChargers} / {s.totalChargers} Free
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${s.totalChargers > 0 ? (s.availableChargers / s.totalChargers) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                      <span>GPS: {hasCoords ? `${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}` : 'N/A'}</span>
                      {osmUrl && (
                        <a
                          href={osmUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline flex items-center gap-1"
                          title="Open location in OpenStreetMap (free map)"
                        >
                          <span>Open Map</span>
                          <span>↗</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <Link
                    to={`/stations/${s.id}`}
                    className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700 hover:text-emerald-400 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
                  >
                    <span>Inspect Chargers & Tariffs</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StationsPage;
