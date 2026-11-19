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
      const an = Array.isArray(row.incident_analysis)
        ? row.incident_analysis[0] || {}
        : row.incident_analysis || {};
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

/**
 * Permanently deletes a dataset and its raw storage file from Supabase.
 */
export async function supabaseDeleteDataset(datasetId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Fetch storage_path to clean up storage bucket
    const { data: ds } = await client
      .from('datasets')
      .select('id, storage_path')
      .eq('id', datasetId)
      .maybeSingle();

    if (ds?.storage_path) {
      try {
        await client.storage.from('raw-datasets').remove([ds.storage_path]);
      } catch (err) {
        console.warn('[Supabase] Failed to remove file from storage bucket:', err);
      }
    }

    // 2. Cascade delete dataset row and derived incidents
    const { error: incErr } = await client
      .from('incidents')
      .delete()
      .eq('dataset_id', datasetId);
    if (incErr) {
      console.warn('[Supabase] Failed to cascade delete incidents:', incErr);
    }

    const { error: dsErr } = await client
      .from('datasets')
      .delete()
      .eq('id', datasetId);

    if (dsErr) {
      console.warn('[Supabase] Failed to delete dataset record:', dsErr);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] Exception in supabaseDeleteDataset:', err);
    return false;
  }
}


