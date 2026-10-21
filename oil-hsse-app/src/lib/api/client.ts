// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// FastAPI Backend Client (SIH26165)
// Connects to Python FastAPI backend (http://localhost:8000/api)
// Enforces strict Bearer Token Authorization from Supabase session.
// Never sends client-dictated roles or X-User-Role headers.
// ============================================================

import {
  SafetyIncident,
  Dataset,
  CsvPipelineResult,
  KpiMetrics,
  IngestIncidentRequest,
} from '@/types/safety';
import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * Resolves the active API base URL.
 * 1. Runtime on server (SSR / Route Handlers): Uses process.env.BACKEND_URL injected by Vercel Service Binding.
 * 2. Explicit public environment variable: process.env.NEXT_PUBLIC_API_URL.
 * 3. Client-side browser in unified Vercel deployment: Uses relative '/api' (routed to backend service via vercel.json).
 * 4. Local dev fallback: 'http://localhost:8000/api'.
 */
export function getApiBase(): string {
  const isProd = process.env.NODE_ENV === 'production';

  if (typeof window === 'undefined') {
    if (process.env.BACKEND_URL) {
      const base = process.env.BACKEND_URL.replace(/\/+$/, '');
      return `${base}/api`;
    }
    if (process.env.NEXT_PUBLIC_API_URL) {
      const val = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
      if (isProd && val.includes('localhost')) {
        return '/api';
      }
      return val;
    }
    return isProd ? '/api' : 'http://localhost:8000/api';
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    const val = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
    // In production, ignore any erroneous localhost setting to prevent calling visitor's machine
    if (isProd && val.includes('localhost')) {
      return '/api';
    }
    return val;
  }

  return '/api';
}

class ApiClient {
  private get apiBase(): string {
    return getApiBase();
  }
  private isAvailable: boolean | null = null;
  private lastCheck: number = 0;

  /**
   * Helper to retrieve the current Supabase session's access token,
   * automatically handling token refresh via the Supabase client SDK.
   */
  private async getAuthHeaders(includeJson: boolean = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const client = getSupabaseClient();
      if (client) {
        const { data: { session } } = await client.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
          return headers;
        }
      }
    } catch (err) {
      console.warn('[ApiClient] Failed to acquire Supabase session token:', err);
    }

    return headers;
  }

  /**
   * Checks whether the Python FastAPI backend is responsive.
   */
  async checkBackend(): Promise<boolean> {
    const now = Date.now();
    // Cache availability for 10 seconds to avoid spamming health endpoint
    if (this.isAvailable !== null && now - this.lastCheck < 10000) {
      return this.isAvailable;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${this.apiBase}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      this.isAvailable = res.ok;
      this.lastCheck = now;
      return res.ok;
    } catch {
      this.isAvailable = false;
      this.lastCheck = now;
      return false;
    }
  }

  /**
   * Fetches incidents with optional filtering.
   */
  async getIncidents(options?: {
    category?: string;
    riskLevel?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ incidents: SafetyIncident[]; total: number } | null> {
    const isUp = await this.checkBackend();
    if (!isUp) return null;

    try {
      const params = new URLSearchParams();
      if (options?.category && options.category !== 'ALL') params.append('category', options.category);
      if (options?.riskLevel && options.riskLevel !== 'ALL') params.append('riskLevel', options.riskLevel);
      if (options?.status && options.status !== 'ALL') params.append('status', options.status);
      if (options?.search) params.append('search', options.search);
      if (options?.page) params.append('page', String(options.page));
      if (options?.pageSize) params.append('pageSize', String(options.pageSize));

      const authHeaders = await this.getAuthHeaders();
      const res = await fetch(`${this.apiBase}/incidents?${params.toString()}`, {
        headers: authHeaders,
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('[ApiClient] Failed to fetch incidents from backend:', err);
      return null;
    }
  }

  /**
   * Fetches a single incident by ID.
   */
  async getIncident(id: string): Promise<SafetyIncident | null> {
    const isUp = await this.checkBackend();
    if (!isUp) return null;

    try {
      const authHeaders = await this.getAuthHeaders();
      const res = await fetch(`${this.apiBase}/incidents/${id}`, {
        headers: authHeaders,
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Ingests a single observation report with backend AI/NLP inference.
   */
  async createIncident(payload: {
    site: string;
    category: string;
    reportedBy: string;
    rawNarrative: string;
    basin?: string;
  }): Promise<SafetyIncident | null> {
    const isUp = await this.checkBackend();
    if (!isUp) return null;

    try {
      const authHeaders = await this.getAuthHeaders();
      const res = await fetch(`${this.apiBase}/incidents`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Executes supervisory Confirm & Escalate action.
   * Authorization is strictly verified on backend via Bearer token -> profiles.role.
   */
  async confirmIncident(
    id: string,
    reviewedBy: string,
    escalationNotes?: string
  ): Promise<SafetyIncident | null> {
    const isUp = await this.checkBackend();
    if (!isUp) return null;

    try {
      const authHeaders = await this.getAuthHeaders();
      const res = await fetch(`${this.apiBase}/incidents/${id}/confirm`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ reviewedBy, escalationNotes }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Executes supervisory Technical Override action.
   * Authorization is strictly verified on backend via Bearer token -> profiles.role.
   */
  async overrideIncident(
    id: string,
    reviewedBy: string,
    justification: string
  ): Promise<SafetyIncident | null> {
    const isUp = await this.checkBackend();
    if (!isUp) return null;

    try {
      const authHeaders = await this.getAuthHeaders();
      const res = await fetch(`${this.apiBase}/incidents/${id}/override`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ reviewedBy, justification }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Uploads and executes the full CSV ingestion pipeline on the Python backend:
   * Parsing -> Validation -> Syntactic Cleaning -> Normalization -> SIF AI Inference
   */
  async uploadCsv(
    input: File | string,
    filename: string = 'uploaded_dataset.csv',
    uploadedBy: string = 'T. Baruah (Chief HSSE Supt.)'
  ): Promise<CsvPipelineResult> {
    const inputName = typeof input === 'string' ? filename : (input.name || filename);

    const isUp = await this.checkBackend();
    if (!isUp) {
      const errMsg = `Could not reach the server at ${this.apiBase}. The backend is offline or unreachable. Nothing was saved.`;
      console.error(`[ApiClient] Upload aborted: ${errMsg}`);
      throw new Error(errMsg);
    }

    try {
      const formData = new FormData();
      if (typeof input === 'string') {
        formData.append('raw_csv', input);
        formData.append('filename', filename);
        formData.append('uploaded_by', uploadedBy);
      } else {
        formData.append('file', input);
        formData.append('filename', input.name || filename);
        formData.append('uploaded_by', uploadedBy);
      }

      const authHeaders = await this.getAuthHeaders(false); // multipart form boundary auto-set
      const res = await fetch(`${this.apiBase}/datasets/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      if (!res.ok) {
        let detail = `Server responded with HTTP ${res.status}: ${res.statusText}`;
        try {
          const errorJson = await res.json();
          detail = errorJson.detail || errorJson.error || detail;
        } catch {}
        console.error(`[ApiClient] Backend CSV upload rejected: ${detail}`);
        throw new Error(detail);
      }

      const data: CsvPipelineResult = await res.json();
      return data;
    } catch (err: any) {
      console.warn('[ApiClient] Backend CSV upload failed:', err.message);
      throw err;
    }
  }

  /**
   * Lists all datasets from the backend.
   */
  async getDatasets(): Promise<Dataset[] | null> {
    const isUp = await this.checkBackend();
    if (!isUp) return null;

    try {
      const authHeaders = await this.getAuthHeaders();
      const res = await fetch(`${this.apiBase}/datasets`, {
        headers: authHeaders,
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Deletes a dataset with cascade deletion of derived incidents.
   * Requires ADMIN role verified on backend.
   */
  async deleteDataset(id: string): Promise<boolean> {
    const isUp = await this.checkBackend();
    if (!isUp) return false;

    try {
      const authHeaders = await this.getAuthHeaders();
      const res = await fetch(`${this.apiBase}/datasets/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetches real-time KPI metrics.
   */
  async getKpiSummary(): Promise<KpiMetrics | null> {
    const isUp = await this.checkBackend();
    if (!isUp) return null;

    try {
      const authHeaders = await this.getAuthHeaders();
      const res = await fetch(`${this.apiBase}/analytics/kpi`, {
        headers: authHeaders,
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetches statutory rules and guidelines (IOGP LSR, Hierarchy of Controls, Negation Detection).
   */
  async getRules(): Promise<any | null> {
    const isUp = await this.checkBackend();
    if (!isUp) return null;

    try {
      const res = await fetch(`${this.apiBase}/rules`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}

export const apiClient = new ApiClient();
