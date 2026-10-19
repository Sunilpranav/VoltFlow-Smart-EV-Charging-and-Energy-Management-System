import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { stationApi } from '../api/client';
import type { StationSummary } from '../types';
import { AnimatedProgressBar, Skeleton, GlowCard } from '../components/animations';

export const StationsPage: React.FC = () => {
  const [stations, setStations] = useState<StationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'availability' | 'name'>('default');

  const fetchStations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await stationApi.list();
      setStations(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch charging hubs');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    stationApi.list()
      .then((data) => {
        if (isMounted) {
          setStations(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch charging hubs');
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

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [stations, searchTerm, statusFilter]);

  const sortedStations = useMemo(() => {
    const list = [...filteredStations];
    if (sortBy === 'availability') {
      list.sort((a, b) => b.availableChargers - a.availableChargers);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [filteredStations, sortBy]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Live Grid Status • High-Speed Hubs</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Charging Hub Network</h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Locate high-power DC fast chargers and Level 2 AC stations. Check real-time connector occupancy and active rates.
          </p>
        </div>
        <div className="text-left md:text-right">
          <span className="font-mono text-2xl font-black text-blue-600 tabular-nums">
            {stations.filter((s) => s.status === 'ACTIVE').length}
          </span>
          <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">
            Active Hubs Online
          </span>
        </div>
      </div>

      {/* ── FILTER & CONTROLS TOOLBAR ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs hover-lift">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <label htmlFor="station-search" className="sr-only">
            Search charging hubs
          </label>
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="station-search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search hub by name or address..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-xs"
          />
        </div>

        {/* Filter and Sort Group */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-xs text-slate-600 font-medium whitespace-nowrap">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by hub operational status"
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer shadow-xs"
            >
              <option value="ALL">All Hubs</option>
              <option value="ACTIVE">Operational Only</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-filter" className="text-xs text-slate-600 font-medium whitespace-nowrap">
              Sort:
            </label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'default' | 'availability' | 'name')}
              aria-label="Sort charging hubs"
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer shadow-xs"
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
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center justify-between animate-scale-in">
          <span>{error}</span>
          <button
            onClick={() => {
              fetchStations();
            }}
            className="text-xs underline hover:text-rose-800 ml-3 font-semibold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── STATIONS GRID WITH SKELETON LOADERS & ANIMATED ENTRANCES ────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-xs">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : sortedStations.length === 0 ? (
        <div className="p-12 bg-white border border-dashed border-slate-200 rounded-3xl text-center space-y-3 animate-scale-in">
          <p className="text-xs sm:text-sm text-slate-500">No charging hubs match the specified criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
              setSortBy('default');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer hover-lift"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedStations.map((s, idx) => {
            const hasCoords = typeof s.latitude === 'number' && typeof s.longitude === 'number';
            const osmUrl = hasCoords
              ? `https://www.openstreetmap.org/?mlat=${s.latitude}&mlon=${s.longitude}#map=16/${s.latitude}/${s.longitude}`
              : null;
            const freePercent = s.totalChargers > 0 ? (s.availableChargers / s.totalChargers) * 100 : 0;

            return (
              <GlowCard
                key={s.id}
                glowColor="rgba(59, 130, 246, 0.25)"
                style={{ animationDelay: `${Math.min(idx * 60, 360)}ms` }}
                className="bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-xs group animate-fade-in-up"
              >
                <div className="space-y-4">
                  {/* Header & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-600">
                        Station #{s.id}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {s.name}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-xs flex items-center gap-1.5 ${
                        s.status === 'ACTIVE'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          s.status === 'ACTIVE' ? 'bg-blue-600 animate-pulse' : 'bg-amber-500'
                        }`}
                      />
                      <span>{s.status}</span>
                    </span>
                  </div>

                  {/* Location */}
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{s.address}</span>
                  </p>

                  {/* Capacity & Telemetry */}
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Stall Availability</span>
                      <span className="font-mono font-bold text-blue-700 flex items-center gap-1">
                        {s.availableChargers > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        )}
                        <span>{s.availableChargers} / {s.totalChargers} Free</span>
                      </span>
                    </div>

                    {/* Animated Progress Bar */}
                    <AnimatedProgressBar
                      value={freePercent}
                      height="h-2"
                      color={freePercent > 50 ? 'emerald' : freePercent > 0 ? 'gradient' : 'amber'}
                      showShimmer={freePercent > 0}
                    />

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                      <span>GPS: {hasCoords ? `${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}` : 'N/A'}</span>
                      {osmUrl && (
                        <a
                          href={osmUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-semibold transition-colors"
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
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] hover-lift"
                  >
                    <span>Inspect Chargers & Tariffs</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              </GlowCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StationsPage;
