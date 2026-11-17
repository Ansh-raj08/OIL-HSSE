// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// FastAPI Backend Client (SIH26165)
// - Reads API base URL strictly from src/config/env.ts (no localhost default in prod)
// - Enforces strict Bearer Token Authorization from Supabase session
// - Handles HTML / non-JSON responses safely without crashing
// - 401: refreshes Supabase session once, retries once, then reports session expired
// - Honest human error messages with short reference codes (never raw backend text)
// ============================================================

import {
  SafetyIncident,
  Dataset,
  CsvPipelineResult,
  KpiMetrics,
} from '@/types/safety';
import { getSupabaseClient } from '@/lib/supabase/client';
import { getPublicEnvConfig, MAX_UPLOAD_BYTES } from '@/config/env';

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly reference: string;
  public readonly shouldSignInAgain: boolean;

  constructor(
    message: string,
    code: string,
    status: number,
    reference?: string,
    shouldSignInAgain: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.reference = reference || code;
    this.shouldSignInAgain = shouldSignInAgain;
  }
}

export interface BackendHealthProbeResult {
  reachable: boolean;
  httpStatus: number | null;
  latencyMs: number;
  configured: boolean | null;
  missingVars: string[];
  databaseMode: string | null;
  supabaseReachable: boolean | null;
  supabaseLatencyMs: number | null;
  backendVersion: string | null;
  datasetCount: number | null;
  incidentCount: number | null;
  maxUploadBytes: number | null;
  errorMessage: string | null;
  errorReference: string | null;
}

/**
 * Returns the validated API base URL from NEXT_PUBLIC_API_URL.
 * Never defaults to localhost in production.
 */
export function getApiBase(): string {
  const { apiBaseUrl, status } = getPublicEnvConfig();
  if (!status.apiBaseUrlConfigured || !apiBaseUrl) {
    throw new ApiError(
      'This deployment is misconfigured. Required API settings are missing.',
      'deployment_misconfigured',
      0,
      'deployment_misconfigured'
    );
  }
  return apiBaseUrl;
}

/**
 * Maps any thrown value to a safe user-facing message + short reference code.
 * Never returns raw backend text.
 */
export function toUserError(err: unknown): {
  message: string;
  reference: string;
  code: string;
  shouldSignInAgain: boolean;
} {
  if (err instanceof ApiError) {
    return {
      message: err.message,
      reference: err.reference,
      code: err.code,
      shouldSignInAgain: err.shouldSignInAgain,
    };
  }
  return {
    message: 'Cannot reach the server.',
    reference: 'network_or_cors_error',
    code: 'network_or_cors_error',
    shouldSignInAgain: false,
  };
}

function mapKnownClientErrorCode(code: string): string {
  switch (code) {
    case 'csv_empty':
      return 'The CSV file is empty or could not be parsed.';
    case 'csv_missing_columns':
      return 'The CSV file is missing a required narrative or description column.';
    case 'invalid_csv':
      return 'The uploaded CSV file could not be validated. Check the column headers and try again.';
    case 'missing_file':
      return 'No CSV file was provided for upload.';
    case 'dataset_not_found':
      return 'The requested dataset could not be found.';
    case 'incident_not_found':
      return 'The requested incident could not be found.';
    case 'invalid_incident':
      return 'The observation report is incomplete. Please review the required fields.';
    default:
      return 'The request could not be processed. Please check your input and try again.';
  }
}

async function safeParseJson(res: Response): Promise<{ isJson: boolean; data: any }> {
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return { isJson: false, data: null };
  }
  try {
    const data = await res.json();
    return { isJson: true, data };
  } catch {
    return { isJson: false, data: null };
  }
}

class ApiClient {
  private async getAccessToken(forceRefresh: boolean = false): Promise<string | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      if (forceRefresh) {
        const { data, error } = await client.auth.refreshSession();
        if (error || !data.session?.access_token) {
          return null;
        }
        return data.session.access_token;
      }

      const { data: { session } } = await client.auth.getSession();
      return session?.access_token ?? null;
    } catch {
      return null;
    }
  }

  private async buildHeaders(includeJson: boolean, token: string | null): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new ApiError(
          'Cannot reach the server. The request timed out.',
          'request_timeout',
          0,
          'request_timeout'
        );
      }
      throw new ApiError(
        'Cannot reach the server.',
        'network_or_cors_error',
        0,
        'network_or_cors_error'
      );
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Core authenticated request wrapper with:
   * - Single automatic token refresh & retry on HTTP 401
   * - Safe HTML / non-JSON handling (never crashes)
   * - Honest human-readable error mapping with short reference codes (never raw backend text)
   */
  private async request<T>(
    path: string,
    options: {
      method?: string;
      body?: BodyInit | null;
      includeJson?: boolean;
      timeoutMs?: number;
      authenticated?: boolean;
    } = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body = null,
      includeJson = true,
      timeoutMs = 15000,
      authenticated = true,
    } = options;

    const apiBase = getApiBase();
    const url = `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;

    let token = authenticated ? await this.getAccessToken(false) : null;
    let res = await this.fetchWithTimeout(
      url,
      {
        method,
        headers: await this.buildHeaders(includeJson, token),
        body,
      },
      timeoutMs
    );

    // 401 Handling: attempt one session refresh and retry once
    if (res.status === 401 && authenticated) {
      const refreshedToken = await this.getAccessToken(true);
      if (refreshedToken) {
        token = refreshedToken;
        res = await this.fetchWithTimeout(
          url,
          {
            method,
            headers: await this.buildHeaders(includeJson, token),
            body,
          },
          timeoutMs
        );
      }
    }

    const headerRequestId = (res.headers.get('x-request-id') || '').trim();
    const { isJson, data } = await safeParseJson(res);
    const bodyCode = typeof data?.code === 'string' ? data.code : '';
    const bodyRequestId = typeof data?.requestId === 'string' ? data.requestId : '';
    const ref = bodyRequestId || headerRequestId || bodyCode || `http_${res.status}`;

    if (!res.ok) {
      if (res.status === 401) {
        throw new ApiError(
          'Your session has expired. Please sign in again.',
          'session_expired',
          401,
          bodyRequestId || headerRequestId || 'session_expired',
          true
        );
      }

      if (res.status === 403) {
        throw new ApiError(
          'You do not have permission to perform this action.',
          'forbidden',
          403,
          bodyRequestId || headerRequestId || 'forbidden'
        );
      }

      if (res.status === 413) {
        throw new ApiError(
          'This file is too large. Maximum allowed upload size is 4 MB.',
          'file_too_large',
          413,
          bodyRequestId || headerRequestId || 'file_too_large'
        );
      }

      if (res.status === 503 && bodyCode === 'backend_misconfigured') {
        throw new ApiError(
          'The backend service is misconfigured. Contact an administrator.',
          'backend_misconfigured',
          503,
          bodyRequestId || headerRequestId || 'backend_misconfigured'
        );
      }

      if (res.status >= 500) {
        throw new ApiError(
          'The service is temporarily unavailable. Please try again.',
          bodyCode || `http_${res.status}`,
          res.status,
          ref
        );
      }

      throw new ApiError(
        mapKnownClientErrorCode(bodyCode),
        bodyCode || `http_${res.status}`,
        res.status,
        ref
      );
    }

    // 2xx response must be JSON (HTML on 200 typically means Deployment Protection or misrouted URL)
    if (!isJson || data === null) {
      throw new ApiError(
        'Cannot reach the server.',
        'unexpected_html_response',
        res.status,
        headerRequestId || 'unexpected_html_response'
      );
    }

    return data as T;
  }

  /**
   * Probes GET /health with the current admin token for the /status diagnostics page.
   * Never throws; safely handles HTML responses, CORS blocks, and network failures.
   */
  async probeAdminHealth(): Promise<BackendHealthProbeResult> {
    const start = performance.now();
    let apiBase = '';
    try {
      apiBase = getApiBase();
    } catch (err) {
      const info = toUserError(err);
      return {
        reachable: false,
        httpStatus: null,
        latencyMs: 0,
        configured: false,
        missingVars: [],
        databaseMode: null,
        supabaseReachable: null,
        supabaseLatencyMs: null,
        backendVersion: null,
        datasetCount: null,
        incidentCount: null,
        maxUploadBytes: null,
        errorMessage: info.message,
        errorReference: info.reference,
      };
    }

    try {
      const token = await this.getAccessToken(false);
      const res = await this.fetchWithTimeout(
        `${apiBase}/health`,
        {
          method: 'GET',
          headers: await this.buildHeaders(false, token),
        },
        12000
      );
      const latencyMs = Math.round(performance.now() - start);
      const headerRequestId = (res.headers.get('x-request-id') || '').trim();
      const { isJson, data } = await safeParseJson(res);

      if (!isJson || !data) {
        return {
          reachable: false,
          httpStatus: res.status,
          latencyMs,
          configured: null,
          missingVars: [],
          databaseMode: null,
          supabaseReachable: null,
          supabaseLatencyMs: null,
          backendVersion: null,
          datasetCount: null,
          incidentCount: null,
          maxUploadBytes: null,
          errorMessage: 'Cannot reach the server.',
          errorReference: headerRequestId || 'unexpected_html_response',
        };
      }

      if (!res.ok) {
        return {
          reachable: false,
          httpStatus: res.status,
          latencyMs,
          configured: typeof data.configured === 'boolean' ? data.configured : null,
          missingVars: Array.isArray(data.missing) ? data.missing : [],
          databaseMode: null,
          supabaseReachable: null,
          supabaseLatencyMs: null,
          backendVersion: null,
          datasetCount: null,
          incidentCount: null,
          maxUploadBytes: null,
          errorMessage: 'The service is temporarily unavailable. Please try again.',
          errorReference: data.requestId || headerRequestId || `http_${res.status}`,
        };
      }

      const liveQuery = data.liveQuery || null;
      return {
        reachable: true,
        httpStatus: res.status,
        latencyMs,
        configured: typeof data.configured === 'boolean' ? data.configured : true,
        missingVars: Array.isArray(data.missing) ? data.missing : [],
        databaseMode: typeof data.databaseMode === 'string' ? data.databaseMode : null,
        supabaseReachable:
          typeof data.supabaseReachable === 'boolean'
            ? data.supabaseReachable
            : liveQuery
              ? liveQuery.status === 'ok'
              : null,
        supabaseLatencyMs:
          typeof liveQuery?.latencyMs === 'number' ? Math.round(liveQuery.latencyMs) : null,
        backendVersion: typeof data.version === 'string' ? data.version : null,
        datasetCount: typeof liveQuery?.datasetCount === 'number' ? liveQuery.datasetCount : null,
        incidentCount: typeof liveQuery?.incidentCount === 'number' ? liveQuery.incidentCount : null,
        maxUploadBytes: typeof data.maxUploadBytes === 'number' ? data.maxUploadBytes : null,
        errorMessage: null,
        errorReference: null,
      };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - start);
      const info = toUserError(err);
      return {
        reachable: false,
        httpStatus: null,
        latencyMs,
        configured: null,
        missingVars: [],
        databaseMode: null,
        supabaseReachable: null,
        supabaseLatencyMs: null,
        backendVersion: null,
        datasetCount: null,
        incidentCount: null,
        maxUploadBytes: null,
        errorMessage: info.message,
        errorReference: info.reference,
      };
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
    try {
      const params = new URLSearchParams();
      if (options?.category && options.category !== 'ALL') params.append('category', options.category);
      if (options?.riskLevel && options.riskLevel !== 'ALL') params.append('riskLevel', options.riskLevel);
      if (options?.status && options.status !== 'ALL') params.append('status', options.status);
      if (options?.search) params.append('search', options.search);
      if (options?.page) params.append('page', String(options.page));
      if (options?.pageSize) params.append('pageSize', String(options.pageSize));

      const qs = params.toString();
      return await this.request<{ incidents: SafetyIncident[]; total: number }>(
        `/incidents${qs ? `?${qs}` : ''}`
      );
    } catch {
      return null;
    }
  }

  /**
   * Fetches a single incident by ID.
   */
  async getIncident(id: string): Promise<SafetyIncident | null> {
    try {
      return await this.request<SafetyIncident>(`/incidents/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  }

  /**
   * Ingests a single observation report with backend AI/NLP inference.
   * Throws ApiError on failure.
   */
  async createIncident(payload: {
    site: string;
    category: string;
    reportedBy: string;
    rawNarrative: string;
    basin?: string;
  }): Promise<SafetyIncident> {
    return await this.request<SafetyIncident>('/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Executes supervisory Confirm & Escalate action.
   * Throws ApiError on failure.
   */
  async confirmIncident(
    id: string,
    reviewedBy: string,
    escalationNotes?: string
  ): Promise<SafetyIncident> {
    return await this.request<SafetyIncident>(`/incidents/${encodeURIComponent(id)}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ reviewedBy, escalationNotes }),
    });
  }

  /**
   * Executes supervisory Technical Override action.
   * Throws ApiError on failure.
   */
  async overrideIncident(
    id: string,
    reviewedBy: string,
    justification: string
  ): Promise<SafetyIncident> {
    return await this.request<SafetyIncident>(`/incidents/${encodeURIComponent(id)}/override`, {
      method: 'POST',
      body: JSON.stringify({ reviewedBy, justification }),
    });
  }

  /**
   * Uploads and executes the full CSV ingestion pipeline on the Python backend.
   * Rejects oversized files early (> 4 MB) and throws typed ApiError on any failure.
   */
  async uploadCsv(
    input: File | string,
    filename: string = 'uploaded_dataset.csv',
    uploadedBy: string = 'Administrator'
  ): Promise<CsvPipelineResult> {
    const byteSize =
      typeof input === 'string'
        ? new TextEncoder().encode(input).byteLength
        : input.size;

    if (byteSize > MAX_UPLOAD_BYTES) {
      throw new ApiError(
        'This file is too large. Maximum allowed upload size is 4 MB.',
        'file_too_large',
        413,
        'file_too_large'
      );
    }

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

    return await this.request<CsvPipelineResult>('/datasets/upload', {
      method: 'POST',
      body: formData,
      includeJson: false, // Let browser set multipart boundary
      timeoutMs: 45000,
    });
  }

  /**
   * Lists all datasets from the backend.
   */
  async getDatasets(): Promise<Dataset[] | null> {
    try {
      return await this.request<Dataset[]>('/datasets');
    } catch {
      return null;
    }
  }

  /**
   * Deletes a dataset with cascade deletion of derived incidents.
   * Requires ADMIN role verified on backend. Throws ApiError on failure.
   */
  async deleteDataset(id: string): Promise<{ success: boolean }> {
    return await this.request<{ success: boolean }>(`/datasets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Fetches real-time KPI metrics.
   */
  async getKpiSummary(): Promise<KpiMetrics | null> {
    try {
      return await this.request<KpiMetrics>('/analytics/kpi');
    } catch {
      return null;
    }
  }

  /**
   * Fetches statutory rules and guidelines (IOGP LSR, Hierarchy of Controls, Negation Detection).
   */
  async getRules(): Promise<any | null> {
    try {
      return await this.request<any>('/rules', { authenticated: false });
    } catch {
      return null;
    }
  }
}

export const apiClient = new ApiClient();
