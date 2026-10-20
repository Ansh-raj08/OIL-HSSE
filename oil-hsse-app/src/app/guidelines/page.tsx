'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Shield,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Zap,
  Box,
  ArrowUpCircle,
  Truck,
  Wind,
  ShieldAlert,
  Anchor,
  HelpCircle,
  Cpu,
  FileCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { apiClient } from '@/lib/api/client';
import { FULL_VERSION_STRING } from '@/config/version';

interface HierarchyRemedy {
  level: string;
  action: string;
  description: string;
}

interface LSRRule {
  code: string;
  title: string;
  category: string;
  baseRiskScore: number;
  description: string;
  statutoryReference: string;
  keyTriggers: string[];
  hierarchyRemedies: HierarchyRemedy[];
}

interface HierarchyTier {
  tier: number;
  name: string;
  effectiveness: string;
  color: string;
  description: string;
  oilImplementation: string;
}

interface NegationDetectionData {
  title: string;
  plainLanguageSummary: string;
  activeNegationTokens: string[];
  benignFilterTokens: string[];
  designPrinciple: string;
}

interface RulesData {
  status: string;
  standard: string;
  version: string;
  lifeSavingRules: LSRRule[];
  hierarchyOfControls: HierarchyTier[];
  negationDetection: NegationDetectionData;
}

// Fallback data in case the backend server is temporarily unreachable
const FALLBACK_RULES: RulesData = {
  status: 'fallback',
  standard: 'IOGP Report 459 • OISD-105 • DGMS OMR-2017',
  version: '2.3.1',
  lifeSavingRules: [
    {
      code: 'LSR-01',
      title: 'Energy Isolation / Lock-Out Tag-Out (LOTO)',
      category: 'ENERGY_ISOLATION',
      baseRiskScore: 90,
      description: 'Verify zero-energy state and positive physical mechanical isolation before commencing maintenance or intervention on pressurized, electrical, or hydrocarbon systems.',
      statutoryReference: 'OISD-GDN-145 • DGMS Tech Circular 02/2019',
      keyTriggers: ['Lockout / Tagout (LOTO)', 'Double Block & Bleed (DBB)', 'Zero Energy Verification', 'ESD Valve Isolation', 'Depressurization Blind'],
      hierarchyRemedies: [
        { level: 'Elimination', action: 'Process Depressurization', description: 'De-inventory and vent lines prior to work.' },
        { level: 'Engineering', action: 'Double Block & Bleed', description: 'Physical positive blind isolation with lock-out.' },
        { level: 'Administrative', action: 'Permit-to-Work', description: 'Execute formal LOTO register signoff.' },
        { level: 'PPE', action: 'Arc Flash / H₂S Gear', description: 'Mandatory PPE for residual energy hazards.' }
      ]
    },
    {
      code: 'LSR-02',
      title: 'Confined Space Entry',
      category: 'CONFINED_SPACE',
      baseRiskScore: 95,
      description: 'Obtain authorized permit-to-work, continuously test atmosphere (O₂ ≥ 19.5%, H₂S < 5 ppm, LEL < 1%), verify mechanical ventilation, and post a dedicated hole watch standby attendant.',
      statutoryReference: 'DGMS Circular 04/2017 • OISD-STD-105',
      keyTriggers: ['Manway / Vessel Entry', 'Atmospheric 4-Gas Testing', 'Continuous Ventilation', 'Standby Attendant / Hole Watch', 'Mud Pit / Cellar Entry'],
      hierarchyRemedies: [
        { level: 'Elimination', action: 'Remote Vessel Cleaning', description: 'Use robotic jetting to eliminate physical entry.' },
        { level: 'Engineering', action: 'Forced Air Eductors', description: 'Continuous positive forced-draft ventilation.' },
        { level: 'Administrative', action: 'Entry Permit & Standby', description: 'Gas check log every 30 mins with posted watch.' },
        { level: 'PPE', action: 'Supplied-Air SCBA', description: 'Certified breathing apparatus and retrieval winch.' }
      ]
    },
    {
      code: 'LSR-03',
      title: 'Working at Height',
      category: 'WORKING_AT_HEIGHT',
      baseRiskScore: 85,
      description: 'Protect against falls from elevation (≥ 1.8m) using certified 100% dual-tie-off harnesses, inspected anchorages, engineered scaffolding, and secure monkey board tethering.',
      statutoryReference: 'OISD-STD-115 • DGMS OMR-2017 Reg 72',
      keyTriggers: ['100% Tie-Off Maintained', 'Certified Anchor Point', 'Derrick Monkey Board', 'Full-Body Safety Harness', 'Edge Protection / Handrails'],
      hierarchyRemedies: [
        { level: 'Elimination', action: 'Ground Assembly', description: 'Assemble rig components at deck level prior to lift.' },
        { level: 'Engineering', action: 'Fixed Edge Rails & SRLs', description: 'Certified guardrails and inertia reels.' },
        { level: 'Administrative', action: 'Pre-Climb Harness Inspection', description: 'Daily tag inspections of lanyards and anchors.' },
        { level: 'PPE', action: 'Dual Shock-Absorbing Lanyards', description: '100% tie-off full-body fall arrest harness.' }
      ]
    },
    {
      code: 'LSR-04',
      title: 'Hot Work & Explosive Atmospheres',
      category: 'HOT_WORK',
      baseRiskScore: 92,
      description: 'Identify and control flammable vapor and gas hazards before striking sparks, welding, or cutting. Perform mandatory atmospheric sweeps (< 1% LEL) within 30 minutes of strike.',
      statutoryReference: 'OISD-STD-105 • OMR-2017 Reg 88',
      keyTriggers: ['Hot Work Permit Issued', 'LEL Atmosphere Sweep (< 1%)', 'Fire Watch Standby Posted', 'Spark Containment Habitats', 'Combustible Storage Cleared'],
      hierarchyRemedies: [
        { level: 'Elimination', action: 'Cold Cutting / Bolting', description: 'Use pneumatic shears or torque tools instead of flame.' },
        { level: 'Engineering', action: 'Pressurized Welding Habitats', description: 'Certified positive-pressure overpressure enclosures.' },
        { level: 'Administrative', action: 'Hot Work Permit & Fire Watch', description: 'Continuous gas monitoring with charged extinguisher.' },
        { level: 'PPE', action: 'Flame-Resistant Clothing (FRC)', description: 'Certified anti-static and fire-retardant PPE.' }
      ]
    },
    {
      code: 'LSR-05',
      title: 'Safe Driving & Journey Management',
      category: 'SAFE_DRIVING',
      baseRiskScore: 80,
      description: 'Enforce mandatory three-point seatbelt usage, strict GPS speed limits, pre-trip vehicle roadworthiness checks, and authorized journey management plans for all crude and equipment convoys.',
      statutoryReference: 'Central Motor Vehicles Rules • OIL Fleet SOP 2024',
      keyTriggers: ['Three-Point Seatbelts Fastened', 'In-Cab Journey Management GPS', 'Speed Compliance (< 40 km/h Field)', 'No Mobile Phone Usage', 'Fatigue Rest Protocol'],
      hierarchyRemedies: [
        { level: 'Elimination', action: 'Crude Pipeline Evacuation', description: 'Minimize road tanker movements via pipelines.' },
        { level: 'Engineering', action: 'In-Vehicle Telematics & Limiter', description: 'Electronic speed governors and collision radar.' },
        { level: 'Administrative', action: 'Journey Management Plan', description: 'Authorized route permits and rest schedules.' },
        { level: 'PPE', action: 'Certified 3-Point Restraints', description: 'Occupant seatbelt enforcement.' }
      ]
    },
    {
      code: 'LSR-06',
      title: 'Line of Fire & Dropped Object Prevention',
      category: 'LINE_OF_FIRE',
      baseRiskScore: 88,
      description: 'Position yourself outside rotating machinery swing paths, whip-check all high-pressure discharge hoses, erect barricaded exclusion zones beneath derrick hoists, and secure elevated tools.',
      statutoryReference: 'DROPS International Guidelines • DGMS Circular 08/2021',
      keyTriggers: ['Barricaded Exclusion Zone', 'High-Pressure Hose Whip-Checks', 'Secondary Retention on Rig Tools', 'Tongs Swing Clear Path', 'Rotary Table Clearance'],
      hierarchyRemedies: [
        { level: 'Elimination', action: 'Automated Iron Roughneck', description: 'Remove workers from drill floor rotating paths.' },
        { level: 'Engineering', action: 'Hose Whip-Checks & Tool Lanyards', description: 'Engineered restraints and barrier enclosures.' },
        { level: 'Administrative', action: 'Red Zone Enforcement', description: 'Mandatory exclusion perimeter during pipe tripping.' },
        { level: 'PPE', action: 'Impact-Resistant Gloves & Hard Hat', description: 'Metatarsal boots and high-impact PPE.' }
      ]
    },
    {
      code: 'LSR-07',
      title: 'Toxic Gas & H₂S Exposure Defense',
      category: 'TOXIC_GAS',
      baseRiskScore: 98,
      description: 'Wear calibrated personal multi-gas monitors in sour production zones, stage Emergency Escape Breathing Apparatus (EEBA) at muster points, and immediately evacuate upwind to designated windsock areas upon alarm.',
      statutoryReference: 'OISD-STD-116 • DGMS Sour Gas Mandatory Code',
      keyTriggers: ['Personal 4-Gas Monitor Bump-Tested', 'Emergency Escape Breathing Apparatus (EEBA)', 'Fixed Head Gas Detection', 'Upwind Muster Point / Windsock', 'H₂S Sour Gas Contingency Plan'],
      hierarchyRemedies: [
        { level: 'Elimination', action: 'Closed-Loop Sampling', description: 'Eliminate open-air venting via vapor recovery.' },
        { level: 'Engineering', action: 'Fixed Optical & Laser Detectors', description: 'Automated plant sirens and emergency ESD trips.' },
        { level: 'Administrative', action: 'Sour Gas Contingency Briefing', description: 'Daily windsock briefings and buddy protocol.' },
        { level: 'PPE', action: 'Personal 4-Gas Detector & EEBA', description: '15-min positive pressure escape hoods.' }
      ]
    },
    {
      code: 'LSR-08',
      title: 'Bypassing Safety Critical Controls',
      category: 'BYPASS_CONTROLS',
      baseRiskScore: 94,
      description: 'Obtain senior managerial authorization before defeating, inhibiting, or overriding any safety-critical element (SCE), emergency shutdown valve (ESD), pressure safety valve (PSV), or interlock.',
      statutoryReference: 'OISD-STD-112 (Asset Integrity) • DGMS OMR-2017',
      keyTriggers: ['Management of Change (MOC) Authorization', 'Safety Critical Element (SCE) Register', 'Override Log Maintained', 'Temporary Bypass Protocol', 'Compensating Risk Controls'],
      hierarchyRemedies: [
        { level: 'Elimination', action: 'Fault-Tolerant Redundancy', description: 'Install 2-out-of-3 voting sensor transmitters.' },
        { level: 'Engineering', action: 'Captive Key Override Panels', description: 'Physical key-switches with automated alarm logs.' },
        { level: 'Administrative', action: 'Formal MOC Signoff', description: 'Chief HSSE Superintendent written approval.' },
        { level: 'PPE', action: 'Dedicated Process Attendant', description: 'Continuous on-site monitoring during bypass.' }
      ]
    },
    {
      code: 'LSR-09',
      title: 'Mechanical Lifting Operations',
      category: 'MECHANICAL_LIFTING',
      baseRiskScore: 86,
      description: 'Never walk under suspended loads. Verify certified rigging, competent licensed crane operators, valid third-party load test certificates, tag-line guidance, and pre-lift exclusion zones.',
      statutoryReference: 'DGMS Circular 06/2018 • OISD-RP-110',
      keyTriggers: ['Rigging Third-Party Certification', 'Never Walk Under Suspended Load', 'Tag Lines for Load Guidance', 'Clear Exclusion Barricades', 'Lift Plan Approved for Heavy Lift'],
      hierarchyRemedies: [
        { level: 'Elimination', action: 'Pre-Rigged Modular Skids', description: 'Minimize ad-hoc individual crane lifts.' },
        { level: 'Engineering', action: 'Overload Moment Limiters (LMI)', description: 'Automated crane cutoff systems and dual slings.' },
        { level: 'Administrative', action: 'Critical Lift Plan Review', description: 'Toolbox talk with rigger competency checks.' },
        { level: 'PPE', action: 'Hi-Vis Rigger Uniform & Comms', description: 'Two-way radio headsets for banksman.' }
      ]
    }
  ],
  hierarchyOfControls: [
    {
      tier: 1,
      name: 'Elimination / Substitution',
      effectiveness: 'Most Effective (100% Risk Removal)',
      color: 'emerald',
      description: 'Physically remove the hazard or substitute hazardous equipment/chemicals with inherently safer alternatives. In upstream drilling, this includes cold-cutting instead of open-flame torch work or automated pipe racking to remove humans from the derrick floor.',
      oilImplementation: 'Automated iron roughneck deployment; non-toxic biodegradable drilling fluid substitution.'
    },
    {
      tier: 2,
      name: 'Engineering Controls',
      effectiveness: 'High Effectiveness (Isolates Workers from Hazard)',
      color: 'blue',
      description: 'Implement engineered physical barriers that do not rely on human compliance. Examples include key-trapped mechanical interlocks on ESD valves, permanent forced-air positive pressure ventilation, and self-retracting lifelines (SRL).',
      oilImplementation: 'Key-trapped valve interlocks, fixed optical flame/gas detection, whip-checks on all 5,000 psi hoses.'
    },
    {
      tier: 3,
      name: 'Administrative Controls',
      effectiveness: 'Moderate Effectiveness (Alters Work Behavior)',
      color: 'amber',
      description: 'Regulate and direct safe operating behavior through statutory compliance procedures, Permit-to-Work (PTW) audits, mandatory safety stand-downs, continuous atmospheric logging, and barrier isolation registers.',
      oilImplementation: 'DGMS Permit-to-Work verification, 4-gas atmosphere sweep logs, LOTO double-isolation signoffs.'
    },
    {
      tier: 4,
      name: 'Personal Protective Equipment (PPE)',
      effectiveness: 'Last Line of Defense (Reduces Injury Severity)',
      color: 'rose',
      description: 'Protect the individual worker when higher-tier barriers cannot eliminate the risk. Always deployed in tandem with higher controls, never as a sole barrier for high-consequence SIF hazards.',
      oilImplementation: 'Full-body fall arrest harness with dual shock-absorbing lanyards, 30-min SCBA rescue cylinders, EEBA hoods.'
    }
  ],
  negationDetection: {
    title: 'Contextual Negation-Aware Detection Architecture',
    plainLanguageSummary:
      "In upstream HSSE incident reporting, conventional keyword-matching and naive NLP models frequently fail on barrier-failure statements like 'worker at height without safety harness' or 'flange dismantled without LOTO'. Traditional text search identifies 'safety harness' or 'LOTO' and mistakenly infers that protective measures were in place. The OIL HSSE Logic Engine incorporates a deterministic contextual negation pipeline that explicitly detects critical barrier omission markers while filtering out benign absence-of-consequence phrases (such as 'no injury occurred'). This ensures that life-threatening safety breaches are elevated to high-priority SIF precursors rather than slipping through undetected.",
    activeNegationTokens: [
      'without', 'failed to', 'failure to', 'did not', "didn't", 'lacking',
      'lack of', 'no harness', 'no loto', 'not wearing', 'unsecured', 'unauthorized'
    ],
    benignFilterTokens: ['no injury', 'no damage', 'no release', 'no harm', 'no fire', 'zero active leak'],
    designPrinciple:
      'Deterministic explainability over black-box heuristics: Every flagged precursor links directly to the specific extracted phrase in the narrative, enabling immediate auditability by Chief HSSE Superintendents.'
  }
};

export default function GuidelinesPage() {
  const [data, setData] = useState<RulesData>(FALLBACK_RULES);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'lsr' | 'hierarchy' | 'negation'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const toggleRule = (code: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedRules(new Set(filteredRules.map((r) => r.code)));
  };

  const collapseAll = () => {
    setExpandedRules(new Set());
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchRules() {
      try {
        const liveData = await apiClient.getRules();
        if (isMounted && liveData && liveData.lifeSavingRules) {
          setData(liveData);
        }
      } catch (err) {
        console.warn('[GuidelinesPage] Backend fetch failed, using built-in verified definitions:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchRules();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter Life-Saving Rules by query and category
  const filteredRules = data.lifeSavingRules.filter((rule) => {
    const matchesSearch =
      searchQuery === '' ||
      rule.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.keyTriggers.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || rule.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', ...Array.from(new Set(data.lifeSavingRules.map((r) => r.category)))];

  const getLsrIcon = (code: string) => {
    switch (code) {
      case 'LSR-01': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'LSR-02': return <Box className="w-4 h-4 text-blue-400" />;
      case 'LSR-03': return <ArrowUpCircle className="w-4 h-4 text-indigo-400" />;
      case 'LSR-04': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'LSR-05': return <Truck className="w-4 h-4 text-emerald-400" />;
      case 'LSR-06': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'LSR-07': return <Wind className="w-4 h-4 text-rose-400" />;
      case 'LSR-08': return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      case 'LSR-09': return <Anchor className="w-4 h-4 text-cyan-400" />;
      default: return <Shield className="w-4 h-4 text-[#D4AF37]" />;
    }
  };

  return (
    <AppShell
      title="Safety Rules & Governance Reference"
      subtitle="IOGP 459 9 Life-Saving Rules, 4-Tier Hierarchy & Negation NLP"
      breadcrumbs={[
        { label: 'Triage Stream', href: '/dashboard' },
        { label: 'Guidelines' },
      ]}
      actions={
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-app-elevated border border-app-subtle text-xs font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-app-muted">ENGINE:</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">IOGP 459 / OISD-105</span>
        </div>
      }
    >
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6 py-6 space-y-6 flex-1 w-full">
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-app-subtle">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-app-elevated text-app-secondary border border-app-subtle">
                STATUTORY REFERENCE & LOGIC ENGINE
              </span>
              <span className="text-xs font-mono text-app-muted">
                {data.standard}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-app-primary tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0066CC] dark:text-[#2997FF]" />
              <span>Guidelines & Safety Rules Reference</span>
            </h1>
            <p className="text-xs text-app-muted mt-1 max-w-3xl leading-relaxed">
              Transparent, single-source-of-truth reference for the OIL HSSE SIF-Precursor Logic Engine.
              Directly mirrors the deterministic rules, keyword mappings, hierarchy of controls, and negation filters
              executed during automated log triage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-app-elevated border border-app-subtle hover:border-app-strong text-xs font-mono text-app-secondary hover:text-app-primary transition-colors cursor-pointer"
              title="Refresh guidelines from backend engine"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Rules</span>
            </button>
          </div>
        </div>

        {/* Quick Nav Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-app-elevated border border-app-subtle rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-app-surface text-[#0066CC] dark:text-[#2997FF] font-semibold border border-app-subtle shadow-xs'
                  : 'text-app-muted hover:text-app-primary'
              }`}
            >
              All Guidelines
            </button>
            <button
              onClick={() => setActiveTab('lsr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'lsr'
                  ? 'bg-app-surface text-[#0066CC] dark:text-[#2997FF] font-semibold border border-app-subtle shadow-xs'
                  : 'text-app-muted hover:text-app-primary'
              }`}
            >
              IOGP Life-Saving Rules ({data.lifeSavingRules.length})
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'hierarchy'
                  ? 'bg-app-surface text-[#0066CC] dark:text-[#2997FF] font-semibold border border-app-subtle shadow-xs'
                  : 'text-app-muted hover:text-app-primary'
              }`}
            >
              Hierarchy of Controls (4 Tiers)
            </button>
            <button
              onClick={() => setActiveTab('negation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'negation'
                  ? 'bg-app-surface text-[#0066CC] dark:text-[#2997FF] font-semibold border border-app-subtle shadow-xs'
                  : 'text-app-muted hover:text-app-primary'
              }`}
            >
              Negation-Aware Detection
            </button>
          </div>

          {(activeTab === 'all' || activeTab === 'lsr') && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
                <input
                  type="text"
                  placeholder="Search rules or triggers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-app-surface border border-app-subtle rounded-xl pl-8 pr-3 py-1.5 text-xs text-app-primary placeholder:text-app-muted focus:outline-none focus:border-[#0066CC] dark:focus:border-[#2997FF] focus:ring-1 focus:ring-[#0066CC]"
                />
              </div>

              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-app-muted" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-app-surface border border-app-subtle rounded-xl px-2.5 py-1.5 text-xs text-app-secondary focus:outline-none focus:border-[#0066CC] dark:focus:border-[#2997FF]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── Section 1: 9 IOGP Life-Saving Rules ─────────────────────── */}
        {(activeTab === 'all' || activeTab === 'lsr') && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-app-primary flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0066CC] dark:text-[#2997FF]" />
                <span>IOGP Report 459 — 9 Life-Saving Rules</span>
                <span className="text-xs font-mono text-app-muted font-normal">
                  ({filteredRules.length} of {data.lifeSavingRules.length} active)
                </span>
              </h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2.5 py-1 rounded-full bg-app-surface hover:bg-app-elevated border border-app-subtle text-[11px] font-mono text-app-secondary hover:text-app-primary transition-colors cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2.5 py-1 rounded-full bg-app-surface hover:bg-app-elevated border border-app-subtle text-[11px] font-mono text-app-secondary hover:text-app-primary transition-colors cursor-pointer"
                >
                  Collapse All
                </button>
                <span className="text-xs font-mono text-app-muted hidden sm:inline">|</span>
                <span className="text-xs font-mono text-app-muted hidden sm:inline">
                  Statutory Mandatory Compliance
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {filteredRules.map((rule) => {
                const isExpanded = expandedRules.has(rule.code);
                return (
                  <div
                    key={rule.code}
                    className="rounded-2xl border border-app-subtle bg-app-surface overflow-hidden transition-all duration-200 hover:border-[#0066CC]/40 dark:hover:border-[#2997FF]/40 shadow-none"
                  >
                    {/* Collapsed Header / Accordion Trigger */}
                    <button
                      type="button"
                      onClick={() => toggleRule(rule.code)}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-app-elevated/40 transition-colors min-h-[44px]"
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-app-elevated border border-app-subtle shrink-0">
                          {getLsrIcon(rule.code)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#0066CC] dark:text-[#2997FF]">
                              {rule.code}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-app-elevated text-app-secondary border border-app-subtle">
                              {rule.category}
                            </span>
                            <span className="text-sm font-semibold text-app-primary truncate">
                              {rule.title}
                            </span>
                          </div>
                          {/* Single-line summary */}
                          <p className="text-xs text-app-muted font-sans truncate mt-1 max-w-2xl sm:max-w-3xl">
                            {rule.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="hidden sm:inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-300 border border-red-200 dark:border-rose-800/40">
                          Base Risk: {rule.baseRiskScore}
                        </span>
                        <div className="p-1.5 rounded-md bg-app-elevated border border-app-subtle text-app-muted">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#0066CC] dark:text-[#2997FF]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-app-muted" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Detail Body */}
                    {isExpanded && (
                      <div className="p-4 border-t border-app-subtle bg-app-elevated/30 space-y-4">
                        {/* Plain Language Description */}
                        <div>
                          <div className="text-[10px] font-mono text-app-muted uppercase tracking-wider mb-1">
                            Rule Mandate & Operational Scope
                          </div>
                          <p className="text-xs text-app-secondary leading-relaxed font-sans bg-app-surface p-3 rounded-lg border border-app-subtle">
                            {rule.description}
                          </p>
                        </div>

                        {/* Statutory Citation */}
                        <div className="text-xs font-mono text-app-muted flex items-center gap-1.5">
                          <FileCheck className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#2997FF]" />
                          <span className="text-app-primary font-semibold">Statutory Authority:</span>
                          <span>{rule.statutoryReference}</span>
                        </div>

                        {/* Trigger Keywords */}
                        <div>
                          <div className="text-[10px] font-mono text-app-muted uppercase tracking-wider mb-1.5">
                            Key Trigger Signals (SIF Logic Engine Token Mappings)
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {rule.keyTriggers.map((trigger, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] font-mono px-2.5 py-1 rounded bg-app-surface text-app-primary border border-app-subtle shadow-2xs"
                              >
                                {trigger}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Hierarchy Remedies Footer */}
                        <div className="pt-3 border-t border-app-subtle space-y-2">
                          <div className="text-[10px] font-mono text-app-secondary uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#2997FF]" />
                            <span>Engine Remediation Framework (Hierarchy of Controls)</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {rule.hierarchyRemedies.map((remedy, idx) => (
                              <div
                                key={idx}
                                className="p-2.5 rounded-lg bg-app-surface border border-app-subtle text-xs font-sans space-y-1 shadow-2xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                                      remedy.level === 'Elimination'
                                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50'
                                        : remedy.level === 'Engineering'
                                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800/50'
                                        : remedy.level === 'Administrative'
                                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50'
                                        : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50'
                                    }`}
                                  >
                                    {remedy.level}
                                  </span>
                                  <strong className="text-app-primary text-xs">{remedy.action}</strong>
                                </div>
                                <p className="text-app-muted text-[11px] leading-relaxed">
                                  {remedy.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Section 2: 4-Tier Upstream Hierarchy of Controls ────────── */}
        {(activeTab === 'all' || activeTab === 'hierarchy') && (
          <div className="space-y-4 pt-4 border-t border-app-subtle">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-app-primary flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#0066CC] dark:text-[#2997FF]" />
                  <span>4-Tier Hierarchy of Controls (Upstream E&P Architecture)</span>
                </h2>
                <p className="text-xs text-app-muted mt-0.5">
                  Universal risk reduction ranking mandated by OISD-105 & DGMS. The logic engine prioritizes controls top-down.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                ISO 45001 / OISD ALIGNED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.hierarchyOfControls.map((tier) => {
                const borderColors: Record<number, string> = {
                  1: 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/20',
                  2: 'border-blue-300 dark:border-blue-700/60 bg-blue-50/50 dark:bg-blue-950/20',
                  3: 'border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20',
                  4: 'border-rose-300 dark:border-rose-700/60 bg-rose-50/50 dark:bg-rose-950/20',
                };
                const tagColors: Record<number, string> = {
                  1: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                  2: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
                  3: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
                  4: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
                };

                return (
                  <div
                    key={tier.tier}
                    className={`rounded-xl border p-4 flex flex-col justify-between shadow-xs ${
                      borderColors[tier.tier] || 'border-app-subtle bg-app-surface'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-app-primary">
                          TIER {tier.tier}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            tagColors[tier.tier]
                          }`}
                        >
                          {tier.effectiveness}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-app-primary mb-2 font-sans">
                        {tier.name}
                      </h3>

                      <p className="text-xs text-app-secondary leading-relaxed font-sans mb-3">
                        {tier.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-app-subtle mt-2 bg-app-surface/80 p-2.5 rounded-lg">
                      <div className="text-[10px] font-mono text-app-secondary uppercase tracking-wider mb-1 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>OIL E&P Implementation</span>
                      </div>
                      <p className="text-[11px] text-app-secondary font-sans leading-snug">
                        {tier.oilImplementation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Section 3: Negation-Aware Detection Architecture ───────── */}
        {(activeTab === 'all' || activeTab === 'negation') && (
          <div className="rounded-xl border border-app-subtle bg-app-surface p-5 space-y-4 pt-5 border-t border-app-subtle shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-[#0066CC] dark:text-[#2997FF]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-app-primary">
                    {data.negationDetection.title}
                  </h2>
                  <p className="text-xs text-app-muted">
                    Deterministic Contextual NLP Pipeline for High-Consequence Incident Logs
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-app-secondary bg-app-elevated border border-app-subtle px-2.5 py-0.5 rounded-full self-start sm:self-auto font-medium">
                SIH26165 ENGINE
              </span>
            </div>

            <div className="p-4 rounded-xl bg-app-elevated/50 border border-app-subtle text-xs text-app-secondary leading-relaxed space-y-2">
              <p className="text-app-primary">
                {data.negationDetection.plainLanguageSummary}
              </p>
              <div className="text-[11px] font-mono text-app-secondary pt-2 border-t border-app-subtle flex items-center gap-1.5 font-medium">
                <Info className="w-3.5 h-3.5 text-[#0066CC] dark:text-[#2997FF]" />
                <span>{data.negationDetection.designPrinciple}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Active Negation Patterns */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Active Barrier Negation Tokens (Flagged as SIF-Precursor)</span>
                </div>
                <p className="text-[11px] text-app-muted mb-2.5">
                  When adjacent to safety barriers (e.g., LOTO, harness, gas detector), these triggers flag an immediate barrier failure:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.negationDetection.activeNegationTokens.map((token, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono px-2 py-0.5 rounded bg-app-surface text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800/40 shadow-2xs"
                    >
                      &quot;{token}&quot;
                    </span>
                  ))}
                </div>
              </div>

              {/* Benign Filter Tokens */}
              <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Benign Absence Filters (Distinguished from Barrier Breaches)</span>
                </div>
                <p className="text-[11px] text-app-muted mb-2.5">
                  Statements confirming lack of consequence are recognized as benign outcomes and do not falsely trip barrier breach alarms:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.negationDetection.benignFilterTokens.map((token, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono px-2 py-0.5 rounded bg-app-surface text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/40 shadow-2xs"
                    >
                      &quot;{token}&quot;
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
