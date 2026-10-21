'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Redesigned Offline India Incident Geospatial Heatmap
// v2.6.0 · PR2 (Section 5)
// - Auto-fit bounding box with regional span floor & cap
// - Static proportional bubbles (Area ~ N, no animations)
// - Worst-severity fill from theme tokens, contrasting surface stroke
// - Ranked site list with bidirectional hover/focus linking
// - Unmapped sites notice and console logging
// - "Fit to data" control restoring view
// ============================================================

import React, { useState, useMemo, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
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
import { useSafety } from '@/context/SafetyContext';
import {
  MapPin,
  AlertTriangle,
  Flame,
  Plus,
  Minus,
  Maximize2,
  Info,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
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
// Longitude, Latitude in Assam / Arunachal Basin and other E&P sectors
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
  worstSeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  isUnmapped: boolean;
  incidents: SafetyIncident[];
}

interface IndiaIncidentMapProps {
  incidents: SafetyIncident[];
  className?: string;
  onSelectSite?: (siteName: string) => void;
}

// ── Severity Token Resolution ──────────────────────────────────
function getSeverityColors(severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW', isDark: boolean) {
  switch (severity) {
    case 'CRITICAL':
      return {
        fill: isDark ? '#FF453A' : '#E02424',
        text: isDark ? '#FF8D85' : '#B91C1C',
        badgeBg: isDark ? 'rgba(255, 69, 58, 0.15)' : 'rgba(224, 36, 36, 0.08)',
        badgeBorder: isDark ? 'rgba(255, 69, 58, 0.35)' : 'rgba(224, 36, 36, 0.25)',
      };
    case 'HIGH':
      return {
        fill: isDark ? '#FF9F0A' : '#EA580C',
        text: isDark ? '#FFC066' : '#C2410C',
        badgeBg: isDark ? 'rgba(255, 159, 10, 0.15)' : 'rgba(234, 88, 12, 0.08)',
        badgeBorder: isDark ? 'rgba(255, 159, 10, 0.35)' : 'rgba(234, 88, 12, 0.25)',
      };
    case 'MEDIUM':
      return {
        fill: isDark ? '#FFD60A' : '#D97706',
        text: isDark ? '#FFE666' : '#B45309',
        badgeBg: isDark ? 'rgba(255, 214, 10, 0.15)' : 'rgba(217, 119, 6, 0.08)',
        badgeBorder: isDark ? 'rgba(255, 214, 10, 0.35)' : 'rgba(217, 119, 6, 0.25)',
      };
    case 'LOW':
    default:
      return {
        fill: isDark ? '#30D158' : '#16A34A',
        text: isDark ? '#78E893' : '#15803D',
        badgeBg: isDark ? 'rgba(48, 209, 88, 0.15)' : 'rgba(22, 163, 74, 0.08)',
        badgeBorder: isDark ? 'rgba(48, 209, 88, 0.35)' : 'rgba(22, 163, 74, 0.25)',
      };
  }
}

// ── Auto-fit Bounding Box Calculation ──────────────────────────
function computeAutoFit(
  clusters: SiteIncidentCluster[],
  minFloor = 1.0,
  maxCap = 3.6,
  regionalSpanLon = 8.0,
  regionalSpanLat = 6.5,
  pad = 0.15
): { coordinates: [number, number]; zoom: number } {
  if (!clusters || clusters.length === 0) {
    return { coordinates: [82.5, 22.8], zoom: 1.0 };
  }

  const lons = clusters.map((c) => c.coordinates[0]);
  const lats = clusters.map((c) => c.coordinates[1]);

  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;

  const rawSpanLon = maxLon - minLon;
  const rawSpanLat = maxLat - minLat;

  // Floor ensures single-site clusters maintain regional context rather than over-zooming
  const effectiveSpanLon = Math.max(rawSpanLon * (1 + pad), regionalSpanLon);
  const effectiveSpanLat = Math.max(rawSpanLat * (1 + pad), regionalSpanLat);

  const zoomLon = 29.0 / effectiveSpanLon;
  const zoomLat = 27.0 / effectiveSpanLat;
  const targetZoom = Math.min(zoomLon, zoomLat);

  const clampedZoom = Number(Math.max(minFloor, Math.min(maxCap, targetZoom)).toFixed(2));

  return {
    coordinates: [Number(centerLon.toFixed(3)), Number(centerLat.toFixed(3))],
    zoom: clampedZoom,
  };
}

// ── Proportional Bubble Radius Math (Area ~ N) ─────────────────
function getBubbleRadius(count: number, maxCount: number): number {
  const minR = 8;
  const maxR = 24;
  if (maxCount <= 1) return minR + 2;
  const ratio = Math.sqrt(count) / Math.sqrt(maxCount);
  return Math.round(minR + ratio * (maxR - minR));
}

function IndiaIncidentMapInner({ incidents, className = '', onSelectSite }: IndiaIncidentMapProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Optional safety context access for global site filtering
  let setSearchQuery: ((q: string) => void) | undefined;
  try {
    const safety = useSafety();
    setSearchQuery = safety.setSearchQuery;
  } catch {
    // Context not available in this scope
  }

  // Active interaction tracking
  const [hoveredClusterKey, setHoveredClusterKey] = useState<string | null>(null);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  // Group incidents by operational field site (memoized aggregation)
  const { clusters, unmappedSites, unmappedCount, maxCount } = useMemo(() => {
    if (!incidents || incidents.length === 0) {
      return { clusters: [], unmappedSites: [], unmappedCount: 0, maxCount: 0 };
    }

    const map = new Map<string, SiteIncidentCluster>();
    const unmappedSet = new Set<string>();
    let unmappedIncidentCounter = 0;

    for (const inc of incidents) {
      const rawSite = inc.site || 'Unknown Site';
      const siteStr = rawSite.toLowerCase();
      let matchedKey = '';
      let coords: [number, number] = DEFAULT_DULIAJAN_HQ;

      for (const [key, coord] of Object.entries(OIL_SITE_COORDINATES)) {
        if (siteStr.includes(key)) {
          matchedKey = key;
          coords = coord;
          break;
        }
      }

      const isUnmapped = !matchedKey;
      if (isUnmapped) {
        matchedKey = 'duliajan_fallback';
        coords = DEFAULT_DULIAJAN_HQ;
        unmappedSet.add(rawSite.replace(/\s*\(.*?\)\s*/g, '').trim());
        unmappedIncidentCounter += 1;
      }

      const clusterKey = `${coords[0].toFixed(3)}_${coords[1].toFixed(3)}`;
      const existing = map.get(clusterKey);

      let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (inc.isSifPrecursor || inc.riskScore >= 80) severity = 'CRITICAL';
      else if (inc.riskScore >= 60) severity = 'HIGH';
      else if (inc.riskScore >= 40) severity = 'MEDIUM';

      if (existing) {
        existing.totalIncidents += 1;
        if (inc.isSifPrecursor) existing.sifCount += 1;
        existing.maxRiskScore = Math.max(existing.maxRiskScore, inc.riskScore);
        if (severity === 'CRITICAL' || (severity === 'HIGH' && existing.worstSeverity !== 'CRITICAL')) {
          existing.worstSeverity = severity;
        } else if (severity === 'MEDIUM' && existing.worstSeverity === 'LOW') {
          existing.worstSeverity = severity;
        }
        existing.incidents.push(inc);
      } else {
        map.set(clusterKey, {
          key: clusterKey,
          name: rawSite.replace(/\s*\(.*?\)\s*/g, '').trim() || 'Assam Field Unit',
          coordinates: coords,
          totalIncidents: 1,
          sifCount: inc.isSifPrecursor ? 1 : 0,
          avgRiskScore: inc.riskScore,
          maxRiskScore: inc.riskScore,
          worstSeverity: severity,
          isUnmapped,
          incidents: [inc],
        });
      }
    }

    // Finalize average risk scores
    let highestCount = 1;
    const clusterList = Array.from(map.values()).map((cl) => {
      const sum = cl.incidents.reduce((acc, i) => acc + i.riskScore, 0);
      cl.avgRiskScore = Math.round(sum / cl.totalIncidents);
      if (cl.totalIncidents > highestCount) highestCount = cl.totalIncidents;
      return cl;
    });

    return {
      clusters: clusterList,
      unmappedSites: Array.from(unmappedSet),
      unmappedCount: unmappedIncidentCounter,
      maxCount: highestCount,
    };
  }, [incidents]);

  // Log unmapped sites to console per specification
  useEffect(() => {
    if (unmappedSites.length > 0) {
      console.warn(
        `[IndiaIncidentMap] ${unmappedCount} incidents are at sites not on the map and are shown at Duliajan HQ:`,
        unmappedSites
      );
    }
  }, [unmappedSites, unmappedCount]);

  // Compute auto-fit camera target
  const autoFitPosition = useMemo(() => {
    return computeAutoFit(clusters);
  }, [clusters]);

  const [position, setPosition] = useState(autoFitPosition);

  // Auto-fit on first render and whenever filtered data changes (unless user has panned/zoomed)
  useEffect(() => {
    if (!userHasInteracted) {
      setPosition(autoFitPosition);
    }
  }, [autoFitPosition, userHasInteracted]);

  // Zoom and pan handlers
  const handleZoomIn = () => {
    setUserHasInteracted(true);
    setPosition((pos) => ({
      ...pos,
      zoom: Math.min(Number((pos.zoom * 1.3).toFixed(2)), 4.0),
    }));
  };

  const handleZoomOut = () => {
    setUserHasInteracted(true);
    setPosition((pos) => ({
      ...pos,
      zoom: Math.max(Number((pos.zoom / 1.3).toFixed(2)), 0.8),
    }));
  };

  const handleFitToData = () => {
    setUserHasInteracted(false);
    setPosition(autoFitPosition);
  };

  // Selection handler: click filters the triage list to that site
  const handleSelectSite = (siteName: string) => {
    if (onSelectSite) {
      onSelectSite(siteName);
    } else {
      if (setSearchQuery) {
        setSearchQuery(siteName);
      }
      router.push(`/dashboard?site=${encodeURIComponent(siteName)}`);
    }
  };

  // Sort clusters: larger bubbles rendered FIRST so smaller ones are never hidden
  const sortedClusters = useMemo(() => {
    return [...clusters].sort((a, b) => b.totalIncidents - a.totalIncidents);
  }, [clusters]);

  // Ranked site list: sorted by maximum risk score, then total incidents
  const rankedSites = useMemo(() => {
    return [...clusters].sort((a, b) => {
      if (b.maxRiskScore !== a.maxRiskScore) {
        return b.maxRiskScore - a.maxRiskScore;
      }
      return b.totalIncidents - a.totalIncidents;
    });
  }, [clusters]);

  // Find currently active cluster for tooltip
  const activeCluster = useMemo(() => {
    if (!hoveredClusterKey) return null;
    return clusters.find((c) => c.key === hoveredClusterKey) || null;
  }, [clusters, hoveredClusterKey]);

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

  // Theme-aware map background & stroke
  const surfaceColor = isDark ? '#1C1C1E' : '#FFFFFF';
  const mapBgColor = isDark ? '#0A0E1A' : '#F8FAFC';

  return (
    <div className={`rounded-2xl border border-app-subtle bg-app-surface overflow-hidden shadow-xs transition-colors ${className}`}>
      {/* ── Header Strip ────────────────────────────────────────────── */}
      <div className="p-4 border-b border-app-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 bg-app-elevated/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-[#D4AF37] border border-amber-500/30">
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
              Auto-fitted regional view with static proportional bubbles and risk-ranked field asset breakdown
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3.5 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full border border-white dark:border-[#1C1C1E] shadow-xs"
              style={{ backgroundColor: getSeverityColors('CRITICAL', isDark).fill }}
            />
            <span className="text-app-secondary">Critical / SIF (80+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full border border-white dark:border-[#1C1C1E] shadow-xs"
              style={{ backgroundColor: getSeverityColors('HIGH', isDark).fill }}
            />
            <span className="text-app-secondary">High (60-79)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full border border-white dark:border-[#1C1C1E] shadow-xs"
              style={{ backgroundColor: getSeverityColors('MEDIUM', isDark).fill }}
            />
            <span className="text-app-secondary">Moderate (40-59)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full border border-white dark:border-[#1C1C1E] shadow-xs"
              style={{ backgroundColor: getSeverityColors('LOW', isDark).fill }}
            />
            <span className="text-app-secondary">Low (&lt;40)</span>
          </div>
        </div>
      </div>

      {/* ── Unmapped Sites Notice (Prompt Specification) ─────────────── */}
      {unmappedCount > 0 && (
        <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="font-sans leading-tight">
            <strong>{unmappedCount} incidents</strong> are at sites not on the map and are shown at Duliajan HQ:{' '}
            <span className="font-mono text-[11px] opacity-90">{unmappedSites.join(', ')}</span>
          </span>
        </div>
      )}

      {/* ── Main Dual-Pane Layout: Map (Left) + Ranked Site List (Right) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Map View Pane (8 cols on desktop) */}
        <div className="lg:col-span-8 relative p-2 sm:p-4 flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-app-subtle" style={{ backgroundColor: mapBgColor }}>
          {/* Zoom and Fit Controls Overlay */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 p-1 rounded-xl border border-app-subtle bg-app-surface/90 backdrop-blur-md shadow-xl select-none">
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={position.zoom >= 4.0}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-app-elevated disabled:opacity-30 text-app-secondary hover:text-app-primary transition-colors cursor-pointer"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={position.zoom <= 0.8}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-app-elevated disabled:opacity-30 text-app-secondary hover:text-app-primary transition-colors cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-5 bg-app-subtle" />
            <button
              type="button"
              onClick={handleFitToData}
              className={`min-h-[40px] px-3 rounded-lg hover:bg-app-elevated text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                userHasInteracted ? 'text-blue-500 font-semibold' : 'text-app-secondary hover:text-app-primary'
              }`}
              title="Restore Auto-Fitted Bounding Box"
              aria-label="Fit to Data"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fit to data</span>
            </button>
            <span className="text-[11px] font-mono text-app-muted px-2 border-l border-app-subtle">
              {position.zoom.toFixed(1)}x
            </span>
          </div>

          {/* Active Hover / Focus Tooltip Card */}
          {activeCluster && (
            <div
              className="absolute top-4 left-4 z-20 p-3.5 rounded-xl border border-app-subtle bg-app-surface/95 backdrop-blur-md text-xs shadow-2xl space-y-2 pointer-events-none max-w-xs animate-fade-in"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center justify-between gap-2 border-b border-app-subtle pb-2">
                <span className="font-semibold text-app-primary font-sans text-sm">{activeCluster.name}</span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                  style={{
                    backgroundColor: getSeverityColors(activeCluster.worstSeverity, isDark).badgeBg,
                    color: getSeverityColors(activeCluster.worstSeverity, isDark).text,
                    border: `1px solid ${getSeverityColors(activeCluster.worstSeverity, isDark).badgeBorder}`,
                  }}
                >
                  {activeCluster.worstSeverity}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-app-elevated p-2 rounded-lg border border-app-subtle">
                  <div className="text-[10px] text-app-muted">INCIDENTS</div>
                  <div className="text-base font-bold text-app-primary mt-0.5">
                    {activeCluster.totalIncidents}
                  </div>
                </div>
                <div className="bg-app-elevated p-2 rounded-lg border border-app-subtle">
                  <div className="text-[10px] text-app-muted">SIF PRECURSORS</div>
                  <div className="text-base font-bold text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-red-500" />
                    <span>{activeCluster.sifCount}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-app-secondary">
                <span>Avg Risk Score:</span>
                <span className="font-bold text-amber-700 dark:text-[#D4AF37]">{activeCluster.avgRiskScore}/100</span>
              </div>
              <p className="text-[10px] text-blue-500 dark:text-blue-400 font-sans pt-1">
                Click bubble or site in list to filter triage feed →
              </p>
            </div>
          )}

          {/* SVG Map Container */}
          <div className="w-full max-w-[760px] aspect-[4/3] flex items-center justify-center">
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
                maxZoom={4.0}
                translateExtent={[[-150, -100], [950, 700]]}
                onMoveEnd={(pos) => {
                  if (pos && pos.coordinates) {
                    setUserHasInteracted(true);
                    setPosition({ coordinates: pos.coordinates, zoom: pos.zoom ?? 1 });
                  }
                }}
              >
                {/* India State Boundaries */}
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
                          fill={
                            isOperatingState
                              ? (isDark ? '#16233B' : '#FEF3C7')
                              : (isDark ? '#0C1322' : '#E2E8F0')
                          }
                          stroke={
                            isOperatingState
                              ? (isDark ? '#D4AF37' : '#B45309')
                              : (isDark ? '#1F2937' : '#CBD5E1')
                          }
                          strokeWidth={isOperatingState ? 1.2 : 0.5}
                          style={{
                            default: { outline: 'none' },
                            hover: {
                              fill: isOperatingState
                                ? (isDark ? '#1E2F4D' : '#FDE68A')
                                : (isDark ? '#141D2E' : '#CBD5E1'),
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

                {/* ── Soft Density Wash Under Clusters (Static, Cheap) ── */}
                {sortedClusters.map((cluster) => {
                  const radius = getBubbleRadius(cluster.totalIncidents, maxCount);
                  const colors = getSeverityColors(cluster.worstSeverity, isDark);
                  return (
                    <Marker key={`wash-${cluster.key}`} coordinates={cluster.coordinates}>
                      <circle
                        r={radius * 1.6}
                        fill={colors.fill}
                        opacity={0.12}
                        className="pointer-events-none"
                      />
                    </Marker>
                  );
                })}

                {/* ── Static Proportional Bubbles (Largest drawn first) ─ */}
                {sortedClusters.map((cluster) => {
                  const radius = getBubbleRadius(cluster.totalIncidents, maxCount);
                  const colors = getSeverityColors(cluster.worstSeverity, isDark);
                  const hasCritical = cluster.sifCount > 0 || cluster.maxRiskScore >= 80;
                  const isHovered = hoveredClusterKey === cluster.key;

                  return (
                    <Marker
                      key={cluster.key}
                      coordinates={cluster.coordinates}
                      onClick={() => handleSelectSite(cluster.name)}
                      onMouseEnter={() => setHoveredClusterKey(cluster.key)}
                      onMouseLeave={() => setHoveredClusterKey(null)}
                      onFocus={() => setHoveredClusterKey(cluster.key)}
                      onBlur={() => setHoveredClusterKey(null)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Site: ${cluster.name}, ${cluster.totalIncidents} incidents, ${cluster.sifCount} SIF precursors, Average risk score: ${cluster.avgRiskScore}/100.`}
                      className="cursor-pointer outline-none focus-visible:outline-none"
                    >
                      {/* Static Outer Ring for Critical/SIF Sites (NO animation) */}
                      {hasCritical && (
                        <circle
                          r={radius + 4}
                          fill="none"
                          stroke={colors.fill}
                          strokeWidth={1.5}
                          opacity={0.85}
                          className="pointer-events-none"
                        />
                      )}

                      {/* Interactive Focus / Hover Highlight Ring */}
                      {isHovered && (
                        <circle
                          r={radius + 7}
                          fill="none"
                          stroke={isDark ? '#FFFFFF' : '#1D1D1F'}
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          opacity={0.9}
                          className="pointer-events-none"
                        />
                      )}

                      {/* Main Proportional Bubble */}
                      <circle
                        r={radius}
                        fill={colors.fill}
                        fillOpacity={0.72}
                        stroke={surfaceColor}
                        strokeWidth={1.5}
                        className="transition-transform duration-200 motion-reduce:transition-none"
                      />

                      {/* Count label inside larger bubbles */}
                      {radius >= 13 ? (
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          y={0.5}
                          className="font-mono text-[10px] font-bold fill-white select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                        >
                          {cluster.totalIncidents}
                        </text>
                      ) : (
                        <circle r={2} fill="#FFFFFF" opacity={0.9} className="pointer-events-none" />
                      )}
                    </Marker>
                  );
                })}
              </ZoomableGroup>
            </ComposableMap>
          </div>
        </div>

        {/* ── Ranked Site List Pane (4 cols on desktop, below on mobile) ─ */}
        <div className="lg:col-span-4 p-4 flex flex-col bg-app-surface border-t lg:border-t-0">
          <div className="flex items-center justify-between pb-3 border-b border-app-subtle">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-app-muted" />
              <h4 className="text-xs font-semibold font-sans text-app-primary tracking-wider uppercase">
                Ranked Site Risk List
              </h4>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-app-elevated border border-app-subtle text-app-secondary">
              {rankedSites.length} Sites
            </span>
          </div>

          <p className="text-[11px] text-app-muted mt-2 mb-3 font-sans">
            Linked to map markers. Click a site to filter the priority triage stream.
          </p>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[380px] pr-1">
            {rankedSites.map((site) => {
              const colors = getSeverityColors(site.worstSeverity, isDark);
              const isHovered = hoveredClusterKey === site.key;
              const hasCritical = site.sifCount > 0 || site.maxRiskScore >= 80;

              return (
                <div
                  key={site.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectSite(site.name)}
                  onMouseEnter={() => setHoveredClusterKey(site.key)}
                  onMouseLeave={() => setHoveredClusterKey(null)}
                  onFocus={() => setHoveredClusterKey(site.key)}
                  onBlur={() => setHoveredClusterKey(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectSite(site.name);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isHovered
                      ? 'bg-app-elevated border-app-primary shadow-xs'
                      : 'bg-app-elevated/50 hover:bg-app-elevated border-app-subtle'
                  }`}
                  aria-label={`Select site ${site.name}, ${site.totalIncidents} incidents, highest risk score ${site.maxRiskScore}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Severity Swatch with Static Ring if Critical */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      {hasCritical && (
                        <span
                          className="absolute -inset-1 rounded-full border border-dashed opacity-80"
                          style={{ borderColor: colors.fill }}
                        />
                      )}
                      <span
                        className="w-3 h-3 rounded-full border border-white dark:border-[#1C1C1E]"
                        style={{ backgroundColor: colors.fill }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-app-primary truncate font-sans">
                        {site.name}
                      </div>
                      <div className="text-[11px] text-app-muted font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{site.totalIncidents} inc</span>
                        {site.sifCount > 0 && (
                          <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-0.5">
                            • {site.sifCount} SIF
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-app-primary">
                        {site.maxRiskScore}
                      </div>
                      <div className="text-[9px] text-app-muted uppercase">Risk</div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isHovered ? 'text-app-primary translate-x-0.5' : 'text-app-muted'}`} />
                  </div>
                </div>
              );
            })}
          </div>
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
