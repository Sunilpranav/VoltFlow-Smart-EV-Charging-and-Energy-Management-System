import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { stationApi } from '../api/client';
import type { Station } from '../types';
import { useAuth } from '../context/useAuth';
import { StartSessionModal } from './StartSessionModal';
import { formatTariffRate, formatPower } from '../utils/currency';
import { Skeleton, GlowCard, MotionButton } from '../components/animations';

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
      <div className="space-y-6 animate-fade-in">
        <div className="h-44 bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !station) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm animate-scale-in">
        <h2 className="text-xl font-bold text-slate-900">Hub Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-500">{error || 'Unable to locate this charging location.'}</p>
        <Link
          to="/stations"
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover-lift"
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
    <div className="space-y-8 animate-fade-in-up">
      {/* Back link */}
      <div>
        <Link
          to="/stations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to Hub Network</span>
        </Link>
      </div>

      {/* ── STATION BANNER ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs relative overflow-hidden hover-lift group">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-xs ${
                  station.status === 'ACTIVE'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {station.status} (Verified Grid)
              </span>
              <span className="text-xs text-slate-400 font-mono">Hub #{station.id}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{station.name}</h1>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{station.address}</span>
            </p>
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 text-right min-w-[140px] shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Real-time Stalls</span>
            <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {station.availableChargers} / {station.totalChargers}
            </span>
            <span className="text-xs text-blue-600 font-semibold block">Stalls Available</span>
          </div>
        </div>

        {/* GPS Coordinates pill & Telemetry notice */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 relative z-10">
          <div className="flex items-center gap-4 font-mono text-xs">
            <span>Lat: <strong className="text-slate-900">{hasCoords ? station.latitude.toFixed(4) : 'N/A'}</strong></span>
            <span>Lng: <strong className="text-slate-900">{hasCoords ? station.longitude.toFixed(4) : 'N/A'}</strong></span>
            {osmUrl && (
              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-sans font-semibold transition-colors"
                title="Open location in OpenStreetMap (free map)"
              >
                <span>Open in OpenStreetMap</span>
                <span>↗</span>
              </a>
            )}
          </div>
          <div className="text-blue-700 font-semibold text-[11px] flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Simulated Telemetry Grid Active</span>
          </div>
        </div>
      </div>

      {/* ── CHARGERS LIST ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Available EVSE Charging Hardware</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {station.chargers?.length || 0} Stalls
            </span>
          </h2>
        </div>

        {(!station.chargers || station.chargers.length === 0) ? (
          <div className="p-8 bg-white border border-dashed border-slate-200 rounded-3xl text-center">
            <p className="text-xs sm:text-sm text-slate-500">No charging stalls registered for this location.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {station.chargers.map((c, idx) => {
              const isAvailable = c.status === 'AVAILABLE';
              const isOccupied = c.status === 'OCCUPIED';

              return (
                <GlowCard
                  key={c.id}
                  glowColor={isAvailable ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.2)'}
                  style={{ animationDelay: `${idx * 80}ms` }}
                  className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-xs flex flex-col justify-between group animate-fade-in-up"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200 shadow-xs">
                        {c.chargerCode}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-xs ${
                          isAvailable
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : isOccupied
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isAvailable
                              ? 'bg-blue-600 animate-ping'
                              : isOccupied
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {c.status}
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Connector Standard:</span>
                        <span className="text-slate-900 font-bold">{c.connectorType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Max Delivery Power:</span>
                        <span className="text-blue-700 font-bold font-mono">{formatPower(c.maxPowerKw)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Standard Tariff Rate:</span>
                        <span className="text-slate-900 font-mono font-medium">
                          {formatTariffRate(c.connectorType === 'Type 2' ? 0.22 : 0.35)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <MotionButton
                      disabled={!isAvailable}
                      variant={isAvailable ? 'primary' : 'ghost'}
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login');
                          return;
                        }
                        setSelectedChargerId(c.id);
                        setIsModalOpen(true);
                      }}
                      className="w-full py-3 text-xs font-bold"
                    >
                      {isAvailable ? (
                        <span>⚡ Plug In & Charge</span>
                      ) : (
                        <span>Stall Busy / In Use</span>
                      )}
                    </MotionButton>
                  </div>
                </GlowCard>
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
