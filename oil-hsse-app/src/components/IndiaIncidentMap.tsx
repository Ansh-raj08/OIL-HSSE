'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Offline India Incident Geospatial Heatmap Component
// (Prompt v2.2 - Item 2)
// Uses react-simple-maps with bundled local offline GeoJSON
// ============================================================

import React, { useState, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import indiaGeoData from '@/data/india_states.json';
import { SafetyIncident } from '@/types/safety';
import { useTheme } from '@/context/ThemeContext';
import { MapPin, AlertTriangle, Flame, ShieldCheck, Activity, Info, Plus, Minus, RotateCcw } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

// ── Error Boundary Wrapper ──────────────────────────────────────
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[IndiaIncidentMap] Error Boundary caught map error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-96 flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-app-subtle bg-app-surface">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
          <h3 className="text-sm font-semibold text-app-primary">Geospatial Map Unavailable</h3>
          <p className="text-xs text-app-muted mt-1 max-w-sm">
            The offline India map projection encountered a rendering issue. Other analytical modules remain operational.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Known OIL India Operational Field Coordinates ──────────────
// Approximate [Longitude, Latitude] in Assam / Arunachal Basin
export const OIL_SITE_COORDINATES: Record<string, [number, number]> = {
  duliajan: [95.318, 27.3556],
  moran: [94.928, 27.182],
  naharkatiya: [95.345, 27.285],
  digboi: [95.632, 27.391],
  kumchai: [96.012, 27.42],
  shalmari: [95.12, 27.24],
  dikom: [95.05, 27.48],
  borbil: [95.58, 27.38],
  sibsagar: [94.63, 26.98],
  jorhat: [94.2167, 26.75],
  tinsukia: [95.36, 27.5],
  guwahati: [91.7362, 26.1445],
};

const DEFAULT_DULIAJAN_HQ: [number, number] = [95.318, 27.3556];

export interface SiteIncidentCluster {
  key: string;
  name: string;
  coordinates: [number, number];
  totalIncidents: number;
  sifCount: number;
  avgRiskScore: number;
  maxRiskScore: number;
  incidents: SafetyIncident[];
}

interface IndiaIncidentMapProps {
  incidents: SafetyIncident[];
  className?: string;
}

function IndiaIncidentMapInner({ incidents, className = '' }: IndiaIncidentMapProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedCluster, setSelectedCluster] = useState<SiteIncidentCluster | null>(null);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [82.5, 22.8],
    zoom: 1,
  });

  const handleZoomIn = () => {
    setPosition((pos) => ({
      ...pos,
      zoom: Math.min(Number((pos.zoom * 1.3).toFixed(2)), 4),
    }));
  };

  const handleZoomOut = () => {
    setPosition((pos) => ({
      ...pos,
      zoom: Math.max(Number((pos.zoom / 1.3).toFixed(2)), 0.8),
    }));
  };

  const handleResetZoom = () => {
    setPosition({ coordinates: [82.5, 22.8], zoom: 1 });
  };

  // Group incidents by operational field site using coordinate lookup
  const clusters = useMemo(() => {
    if (!incidents || incidents.length === 0) return [];

    const map = new Map<string, SiteIncidentCluster>();

    for (const inc of incidents) {
      const siteStr = (inc.site || '').toLowerCase();
      let matchedKey = '';
      let coords: [number, number] = DEFAULT_DULIAJAN_HQ;

      for (const [key, coord] of Object.entries(OIL_SITE_COORDINATES)) {
        if (siteStr.includes(key)) {
          matchedKey = key;
          coords = coord;
          break;
        }
      }

      if (!matchedKey) {
        matchedKey = 'duliajan_fallback';
        coords = DEFAULT_DULIAJAN_HQ;
      }

      const clusterKey = `${coords[0].toFixed(3)}_${coords[1].toFixed(3)}`;
      const existing = map.get(clusterKey);

      if (existing) {
        existing.totalIncidents += 1;
        if (inc.isSifPrecursor) existing.sifCount += 1;
        existing.maxRiskScore = Math.max(existing.maxRiskScore, inc.riskScore);
        existing.incidents.push(inc);
      } else {
        map.set(clusterKey, {
          key: clusterKey,
          name: inc.site.replace(/\s*\(.*?\)\s*/g, ''),
          coordinates: coords,
          totalIncidents: 1,
          sifCount: inc.isSifPrecursor ? 1 : 0,
          avgRiskScore: inc.riskScore,
          maxRiskScore: inc.riskScore,
          incidents: [inc],
        });
      }
    }

    // Compute average scores
    const result = Array.from(map.values()).map((cl) => {
      const sum = cl.incidents.reduce((acc, i) => acc + i.riskScore, 0);
      cl.avgRiskScore = Math.round(sum / cl.totalIncidents);
      return cl;
    });

    return result;
  }, [incidents]);

  if (!incidents || incidents.length === 0) {
    return (
      <EmptyState
        compact
        title="No incident geospatial data"
        description="India operational map will plot risk clusters once safety logs or datasets are ingested."
        className="h-96"
      />
    );
  }

  return (
    <div className={`rounded-xl border border-app-subtle bg-app-surface overflow-hidden shadow-xs ${className}`}>
      {/* ── Header Strip ────────────────────────────────────────────── */}
      <div className="p-4 border-b border-app-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-app-elevated/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-[#D4AF37] border border-amber-500/30">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold font-sans text-app-primary tracking-wide flex items-center gap-2">
              <span>OIL INDIA OPERATIONAL GEOSPATIAL HEATMAP</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-app-surface text-amber-700 dark:text-[#D4AF37] border border-app-subtle">
                OFFLINE SVG
              </span>
            </h3>
            <p className="text-xs font-sans text-app-muted">
              National boundary overview with upstream incident density and SIF precursor clusters
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-app-secondary">Critical / SIF (80-100)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-app-secondary">High Risk (60-79)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-app-secondary">Moderate (&lt;60)</span>
          </div>
        </div>
      </div>

      {/* ── Main Map Container ──────────────────────────────────────── */}
      <div className="relative p-2 sm:p-4 bg-slate-50 dark:bg-[#080D1A] min-h-[440px] flex items-center justify-center overflow-hidden transition-colors">
        {/* Map Inset Badge: Asset Operational Base */}
        <div className="absolute top-4 left-4 z-10 p-3 rounded-xl border border-app-subtle bg-app-surface/90 backdrop-blur-md text-xs font-sans max-w-xs shadow-xl hidden md:block">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-[#D4AF37] font-semibold text-xs mb-1 font-mono">
            <Activity className="w-3.5 h-3.5" />
            <span>OPERATIONAL FOCUS: ASSAM BASIN</span>
          </div>
          <p className="text-[11px] text-app-secondary leading-relaxed font-sans">
            Primary upstream E&P assets concentrated in Upper Assam (Duliajan HQ, Moran GGS, Naharkatiya, Digboi CTF, Kumchai).
          </p>
          <div className="mt-2 pt-2 border-t border-app-subtle text-[10px] font-mono text-app-muted flex justify-between">
            <span>Active Clusters:</span>
            <span className="text-app-primary font-bold">{clusters.length} Sites</span>
          </div>
        </div>

        {/* Selected Site Callout Card */}
        {selectedCluster && (
          <div className="absolute top-4 right-4 z-10 p-3.5 rounded-xl border border-app-subtle bg-app-surface/95 backdrop-blur-md text-xs max-w-xs shadow-2xl space-y-2 animate-fade-in-scale">
            <div className="flex items-center justify-between border-b border-app-subtle pb-2">
              <span className="font-semibold text-app-primary font-sans">{selectedCluster.name}</span>
              <button
                type="button"
                onClick={() => setSelectedCluster(null)}
                className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 flex items-center justify-center text-app-muted hover:text-app-primary cursor-pointer text-sm"
                aria-label="Close cluster details"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-app-elevated p-2 rounded-lg border border-app-subtle">
                <div className="text-[10px] text-app-muted">INCIDENTS</div>
                <div className="text-base font-bold text-app-primary mt-0.5">
                  {selectedCluster.totalIncidents}
                </div>
              </div>
              <div className="bg-app-elevated p-2 rounded-lg border border-app-subtle">
                <div className="text-[10px] text-app-muted">SIF PRECURSORS</div>
                <div className="text-base font-bold text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-500" />
                  <span>{selectedCluster.sifCount}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-app-secondary">
              <span>Avg Risk Score:</span>
              <span className="font-bold text-amber-700 dark:text-[#D4AF37]">{selectedCluster.avgRiskScore}/100</span>
            </div>
          </div>
        )}

        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 p-1 rounded-lg border border-app-subtle bg-app-surface/90 backdrop-blur-md shadow-xl select-none">
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={position.zoom >= 4}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-app-elevated disabled:opacity-40 text-app-secondary hover:text-app-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Zoom In (+)"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4 text-app-secondary" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={position.zoom <= 0.8}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-app-elevated disabled:opacity-40 text-app-secondary hover:text-app-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Zoom Out (-)"
            aria-label="Zoom Out"
          >
            <Minus className="w-4 h-4 text-app-secondary" />
          </button>
          <div className="w-[1px] h-6 bg-app-subtle" />
          <button
            type="button"
            onClick={handleResetZoom}
            className="min-h-[44px] px-2.5 rounded-lg hover:bg-app-elevated text-app-secondary hover:text-app-primary transition-colors cursor-pointer text-xs font-mono flex items-center gap-1.5"
            title="Reset View"
            aria-label="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5 text-app-secondary" />
            <span className="font-mono">Reset</span>
          </button>
          <span className="text-xs font-mono text-app-muted px-2 border-l border-app-subtle">
            {position.zoom.toFixed(1)}x
          </span>
        </div>

        {/* SVG Offline Composable Map */}
        <div className="w-full max-w-[850px] aspect-[4/3] flex items-center justify-center">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 1050,
              center: [82.5, 22.8],
            }}
            width={800}
            height={600}
            className="w-full h-full"
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates}
              minZoom={0.8}
              maxZoom={4}
              onMoveEnd={(pos) => {
                if (pos && pos.coordinates) {
                  setPosition({ coordinates: pos.coordinates, zoom: pos.zoom ?? 1 });
                }
              }}
            >
              <Geographies geography={indiaGeoData as any}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const stateName = geo.properties?.st_nm || '';
                    const isAssam = stateName.toLowerCase().includes('assam');
                    const isArunachal = stateName.toLowerCase().includes('arunachal');
                    const isOperatingState = isAssam || isArunachal;

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={isOperatingState ? (isDark ? '#152238' : '#FEF3C7') : (isDark ? '#0B1220' : '#E2E8F0')}
                        stroke={isOperatingState ? (isDark ? '#D4AF37' : '#B45309') : (isDark ? '#1E293B' : '#CBD5E1')}
                        strokeWidth={isOperatingState ? 1.2 : 0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: {
                            fill: isOperatingState ? (isDark ? '#1C2C47' : '#FDE68A') : (isDark ? '#10192A' : '#CBD5E1'),
                            stroke: isDark ? '#D4AF37' : '#B45309',
                            strokeWidth: 1.2,
                            outline: 'none',
                          },
                          pressed: { outline: 'none' },
                        } as any}
                      />
                    );
                  })
                }
              </Geographies>

              {/* Render Site Markers with Heat Pulse */}
              {clusters.map((cluster) => {
                const isHighSif = cluster.sifCount > 0 || cluster.maxRiskScore >= 80;
                const isMedium = cluster.maxRiskScore >= 60 && !isHighSif;
                const markerColor = isHighSif ? '#EF4444' : isMedium ? '#F97316' : '#EAB308';
                const radius = Math.min(14, Math.max(6, 6 + cluster.totalIncidents * 1.5));

                return (
                  <Marker
                    key={cluster.key}
                    coordinates={cluster.coordinates}
                    onClick={() => setSelectedCluster(cluster)}
                    className="cursor-pointer transition-transform hover:scale-125"
                  >
                    {/* Glowing Pulse Ring for Critical SIF Precursors */}
                    {isHighSif && (
                      <circle
                        r={radius + 6}
                        fill={markerColor}
                        opacity={0.3}
                        className="animate-ping"
                      />
                    )}

                    {/* Outer Ring */}
                    <circle
                      r={radius}
                      fill={markerColor}
                      fillOpacity={0.85}
                      stroke="#FFFFFF"
                      strokeWidth={1.5}
                    />

                    {/* Center Dot */}
                    <circle r={2} fill="#FFFFFF" />

                    {/* Site Name Label */}
                    <text
                      textAnchor="start"
                      y={-radius - 3}
                      x={radius + 3}
                      className="font-mono text-[9px] font-bold fill-slate-200 pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                    >
                      {cluster.name} ({cluster.totalIncidents})
                    </text>
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </div>
    </div>
  );
}

export default function IndiaIncidentMap(props: IndiaIncidentMapProps) {
  return (
    <MapErrorBoundary>
      <IndiaIncidentMapInner {...props} />
    </MapErrorBoundary>
  );
}
