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
 * Persists an individual incident and its SIF analysis to Supabase.
 */
export async function supabaseInsertIncident(incident: SafetyIncident): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Insert incident
    const { error: incError } = await client.from('incidents').insert({
      id: incident.id,
      site: incident.site,
      basin: incident.basin,
      reported_by: incident.reportedBy,
      category: incident.category,
      timestamp: incident.timestamp,
      raw_narrative: incident.rawNarrative,
      truncated_narrative: incident.truncatedNarrative,
      validation_status: incident.validationStatus,
      dataset_id: incident.datasetId || null,
    });

    if (incError) {
      console.warn('[Supabase] Error inserting incident:', incError);
      return false;
    }

    // 2. Insert incident_analysis
    const { error: anError } = await client.from('incident_analysis').insert({
      incident_id: incident.id,
      risk_score: incident.riskScore,
      risk_level: incident.riskLevel,
      is_sif_precursor: incident.isSifPrecursor,
      lsr_code: incident.lsrCategory,
      lsr_title: incident.lsrTitle,
      lsr_violations: incident.lsrViolations,
      xai_triggers: incident.xaiTriggers,
      hierarchy_actions: incident.hierarchyActions,
    });

    if (anError) {
      console.warn('[Supabase] Error inserting analysis:', anError);
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] Exception inserting incident:', err);
    return false;
  }
}

/**
 * Persists supervisory review (Confirm & Escalate) to Supabase.
 */
export async function supabaseConfirmIncident(
  incidentId: string,
  officerName: string,
  notes?: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error: updError } = await client
      .from('incidents')
      .update({ validation_status: 'CONFIRMED' })
      .eq('id', incidentId);

    if (updError) return false;

    await client.from('incident_reviews').insert({
      incident_id: incidentId,
      reviewer_name: officerName,
      action: 'CONFIRM',
      previous_status: 'PENDING',
      new_status: 'CONFIRMED',
      escalation_notes: notes || 'Confirmed SIF Precursor',
    });

    return true;
  } catch (err) {
    console.warn('[Supabase] Exception confirming incident:', err);
    return false;
  }
}

/**
 * Persists technical override to Supabase.
 */
export async function supabaseOverrideIncident(
  incidentId: string,
  officerName: string,
  justification: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error: updError } = await client
      .from('incidents')
      .update({ validation_status: 'OVERRIDDEN' })
      .eq('id', incidentId);

    if (updError) return false;

    await client.from('incident_reviews').insert({
      incident_id: incidentId,
      reviewer_name: officerName,
      action: 'OVERRIDE',
      previous_status: 'PENDING',
      new_status: 'OVERRIDDEN',
      justification: justification,
    });

    return true;
  } catch (err) {
    console.warn('[Supabase] Exception overriding incident:', err);
    return false;
  }
}

/**
 * Fetches all ingested datasets from Supabase.
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
 * Permanently deletes a dataset with cascade deletion in Supabase.
 */
export async function supabaseDeleteDataset(
  datasetId: string,
  actorName: string = 'Administrator'
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Regulatory audit log
    await client.from('audit_logs').insert({
      entity_type: 'dataset',
      entity_id: datasetId,
      action: 'DATASET_DELETED',
      actor_name: actorName,
      details: {
        deletedAt: new Date().toISOString(),
        reason: 'Supervisory removal of dataset',
      },
    });

    // 2. Cascade delete from datasets table
    const { error } = await client.from('datasets').delete().eq('id', datasetId);
    return !error;
  } catch (err) {
    console.warn('[Supabase] Exception deleting dataset:', err);
    return false;
  }
}

/**
 * Persists an uploaded dataset and incidents to Supabase directly.
 */
export async function supabaseInsertDataset(
  dataset: Dataset,
  incidents: SafetyIncident[]
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    await client.from('datasets').insert({
      id: dataset.id,
      filename: dataset.filename,
      original_filename: dataset.filename,
      row_count: dataset.totalRows,
      valid_row_count: dataset.validRows,
      invalid_row_count: dataset.invalidRows,
      warning_row_count: dataset.warningRows,
      status: 'READY',
    });

    for (const inc of incidents) {
      await client.from('incidents').insert({
        id: inc.id,
        dataset_id: dataset.id,
        site: inc.site,
        basin: inc.basin,
        reported_by: inc.reportedBy,
        category: inc.category,
        timestamp: inc.timestamp,
        raw_narrative: inc.rawNarrative,
        truncated_narrative: inc.truncatedNarrative,
        validation_status: inc.validationStatus,
      });

      await client.from('incident_analysis').insert({
        incident_id: inc.id,
        risk_score: inc.riskScore,
        risk_level: inc.riskLevel,
        is_sif_precursor: inc.isSifPrecursor,
        lsr_code: inc.lsrCategory,
        lsr_title: inc.lsrTitle,
        lsr_violations: inc.lsrViolations,
        xai_triggers: inc.xaiTriggers,
        hierarchy_actions: inc.hierarchyActions,
      });
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exception inserting dataset:', err);
    return false;
  }
}

