// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Supabase Live Persistence Layer (SIH26165)
// Queries matching database/schema/schema.sql tables
// ============================================================

import { getSupabaseClient, isSupabaseConfigured } from './client';
import type { SafetyIncident, Dataset, IngestIncidentRequest } from '@/types/safety';

/**
 * Fetches incidents and their associated SIF analysis from Supabase.
 */
export async function supabaseListIncidents(options?: {
  category?: string;
  validationStatus?: string;
  limit?: number;
}): Promise<SafetyIncident[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client
      .from('incidents')
      .select('*, incident_analysis(*)')
      .order('created_at', { ascending: false });

    if (options?.category && options.category !== 'ALL') {
      query = query.eq('category', options.category);
    }
    if (options?.validationStatus && options.validationStatus !== 'ALL') {
      query = query.eq('validation_status', options.validationStatus);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn('[Supabase] listIncidents query returned error:', error);
      return null;
    }

    return data.map((row: any) => {
      const an = row.incident_analysis || {};
      return {
        id: row.id,
        timestamp: row.timestamp,
        site: row.site,
        basin: row.basin || 'Assam Operational Basin',
        reportedBy: row.reported_by,
        category: row.category,
        rawNarrative: row.raw_narrative,
        truncatedNarrative: row.truncated_narrative || row.raw_narrative?.substring(0, 120),
        riskScore: an.risk_score ?? 50,
        riskLevel: an.risk_level ?? 'MEDIUM',
        isSifPrecursor: an.is_sif_precursor ?? false,
        lsrCategory: an.lsr_code ?? 'LSR-08',
        lsrTitle: an.lsr_title ?? 'LSR-08: Bypassing Safety Controls',
        validationStatus: row.validation_status ?? 'PENDING',
        lsrViolations: an.lsr_violations || [],
        xaiTriggers: an.xai_triggers || [],
        hierarchyActions: an.hierarchy_actions || [],
        datasetId: row.dataset_id,
      };
    });
  } catch (err) {
    console.warn('[Supabase] Exception in listIncidents:', err);
    return null;
  }
}

/**
 * Fetches all ingested datasets from Supabase (read-only fallback).
 */
export async function supabaseListDatasets(): Promise<Dataset[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    return data.map((d: any) => ({
      id: d.id,
      filename: d.filename,
      uploadedAt: d.created_at,
      uploadedBy: 'System / Supabase',
      status: d.status,
      totalRows: d.row_count,
      validRows: d.valid_row_count,
      invalidRows: d.invalid_row_count,
      warningRows: d.warning_row_count,
    }));
  } catch {
    return null;
  }
}


