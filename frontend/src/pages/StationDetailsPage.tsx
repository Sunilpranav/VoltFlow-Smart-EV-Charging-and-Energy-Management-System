import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { stationApi } from '../api/client';
import type { Station } from '../types';
import { useAuth } from '../context/useAuth';
import { StartSessionModal } from './StartSessionModal';
import { formatTariffRate, formatPower } from '../utils/currency';

export const StationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChargerId, setSelectedChargerId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    stationApi.getById(parseInt(id, 10))
      .then((data) => {
        if (isMounted) setStation(data);
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch station details');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 bg-slate-900/60 rounded-3xl border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-60 bg-slate-900/60 rounded-3xl border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="p-8 bg-slate-900/80 border border-slate-800 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-12">
        <h2 className="text-xl font-bold text-white">Hub Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-400">{error || 'Unable to locate this charging location.'}</p>
        <Link
          to="/stations"
          className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-semibold"
        >
          ← Back to Charging Network
        </Link>
      </div>
    );
  }

  const hasCoords = typeof station.latitude === 'number' && typeof station.longitude === 'number';
  const osmUrl = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${station.latitude}&mlon=${station.longitude}#map=16/${station.latitude}/${station.longitude}`
    : null;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link
          to="/stations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
        >
          <span>← Back to Hub Network</span>
        </Link>
      </div>

      {/* ── STATION BANNER ─────────────────────────────────────────────────── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  station.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {station.status} (Verified Grid)
              </span>
              <span className="text-xs text-slate-500 font-mono">Hub #{station.id}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{station.name}</h1>
            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{station.address}</span>
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-right min-w-[140px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Real-time Stalls</span>
            <span className="text-2xl font-black text-emerald-400 font-mono tabular-nums">
              {station.availableChargers} / {station.totalChargers}
            </span>
            <span className="text-xs text-slate-400 block">Stalls Available</span>
          </div>
        </div>

        {/* GPS Coordinates pill & Telemetry notice */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-4 font-mono text-xs">
            <span>Lat: <strong className="text-slate-200">{hasCoords ? station.latitude.toFixed(4) : 'N/A'}</strong></span>
            <span>Lng: <strong className="text-slate-200">{hasCoords ? station.longitude.toFixed(4) : 'N/A'}</strong></span>
            {osmUrl && (
              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 font-sans"
              >
                <span>Open in OpenStreetMap</span>
                <span>↗</span>
              </a>
            )}
          </div>
          <div className="text-emerald-400 font-medium text-[11px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Simulated Telemetry Grid</span>
          </div>
        </div>
      </div>

      {/* ── CHARGERS LIST ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Available EVSE Charging Hardware</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {station.chargers?.length || 0}
            </span>
          </h2>
        </div>

        {(!station.chargers || station.chargers.length === 0) ? (
          <div className="p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl text-center">
            <p className="text-xs sm:text-sm text-slate-400">No charging stalls registered for this location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {station.chargers.map((c) => {
              const isAvailable = c.status === 'AVAILABLE';
              const isOccupied = c.status === 'OCCUPIED';

              return (
                <div
                  key={c.id}
                  className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg hover:border-slate-700 transition flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                        {c.chargerCode}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          isAvailable
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isOccupied
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isAvailable
                              ? 'bg-emerald-400 animate-pulse'
                              : isOccupied
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                        />
                        {c.status}
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Connector Standard:</span>
                        <span className="text-white font-bold">{c.connectorType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Max Delivery Power:</span>
                        <span className="text-emerald-400 font-bold font-mono">{formatPower(c.maxPowerKw)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Standard Tariff Rate:</span>
                        <span className="text-slate-200 font-mono font-medium">
                          {formatTariffRate(c.connectorType === 'Type 2' ? 0.22 : 0.35)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80">
                    <button
                      disabled={!isAvailable}
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login');
                          return;
                        }
                        setSelectedChargerId(c.id);
                        setIsModalOpen(true);
                      }}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isAvailable
                          ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-[0.99]'
                          : 'bg-slate-950 text-slate-500 cursor-not-allowed border border-slate-800'
                      }`}
                    >
                      {isAvailable ? (
                        <>
                          <span>⚡ Plug In & Charge</span>
                        </>
                      ) : (
                        <span>Stall Busy / In Use</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {station && (
        <StartSessionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedChargerId(null);
          }}
          preselectedStationId={station.id}
          preselectedChargerId={selectedChargerId || undefined}
        />
      )}
    </div>
  );
};

export default StationDetailsPage;
