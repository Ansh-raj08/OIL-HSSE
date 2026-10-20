'use client';

// ============================================================
// OIL HSSE ENTERPRISE SIF-PRECURSOR DECISION-SUPPORT PLATFORM
// Global State Management: SafetyContext (Prompt v2.0)
// ============================================================

import React, { createContext, useContext, useReducer, useMemo, useEffect, useCallback, ReactNode } from 'react';
import {
  SafetyIncident,
  Dataset,
  TriageFilter,
  KpiMetrics,
  SafetyContextType,
} from '@/types/safety';
import { apiClient } from '@/lib/api/client';
import {
  supabaseListIncidents,
  supabaseConfirmIncident,
  supabaseOverrideIncident,
  supabaseInsertIncident,
  supabaseListDatasets,
} from '@/lib/supabase/db';

type SafetyAction =
  | { type: 'SET_INCIDENTS'; payload: SafetyIncident[] }
  | { type: 'SET_DATASETS'; payload: Dataset[] }
  | { type: 'ADD_DATASET'; payload: Dataset }
  | { type: 'REMOVE_DATASET'; payload: { datasetId: string } }
  | { type: 'SET_FILTER'; payload: TriageFilter }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SELECT_INCIDENT'; payload: SafetyIncident | null }
  | {
      type: 'CONFIRM_AND_ESCALATE';
      payload: { incidentId: string; officerName?: string; notes?: string };
    }
  | {
      type: 'OVERRIDE_INCIDENT';
      payload: { incidentId: string; justification: string; officerName?: string };
    }
  | {
      type: 'ADD_INCIDENT';
      payload: Omit<SafetyIncident, 'id' | 'timestamp' | 'validationStatus'>;
    }
  | { type: 'ADD_BATCH_INCIDENTS'; payload: SafetyIncident[] }
  | {
      type: 'COMMIT_DATASET_INGESTION';
      payload: { incidents: SafetyIncident[]; dataset?: Dataset };
    }
  | { type: 'REMOVE_DATASET_INCIDENTS'; payload: { datasetId: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'OPEN_INGESTION_MODAL' }
  | { type: 'CLOSE_INGESTION_MODAL' }
  | { type: 'OPEN_OVERRIDE_MODAL' }
  | { type: 'CLOSE_OVERRIDE_MODAL' };

interface State {
  incidents: SafetyIncident[];
  datasets: Dataset[];
  selectedIncident: SafetyIncident | null;
  filter: TriageFilter;
  searchQuery: string;
  isIngestionModalOpen: boolean;
  isOverrideModalOpen: boolean;
  isLoading: boolean;
}

const initialState: State = {
  incidents: [],
  datasets: [],
  selectedIncident: null,
  filter: 'ALL',
  searchQuery: '',
  isIngestionModalOpen: false,
  isOverrideModalOpen: false,
  isLoading: true,
};


function safetyReducer(state: State, action: SafetyAction): State {
  switch (action.type) {
    case 'SET_INCIDENTS':
      return {
        ...state,
        incidents: action.payload,
        selectedIncident: action.payload[0] || null,
      };

    case 'SET_DATASETS':
      return { ...state, datasets: action.payload };

    case 'ADD_DATASET':
      return {
        ...state,
        datasets: [action.payload, ...state.datasets.filter((d) => d.id !== action.payload.id)],
      };

    case 'REMOVE_DATASET':
      return {
        ...state,
        datasets: state.datasets.filter((d) => d.id !== action.payload.datasetId),
      };

    case 'SET_FILTER':
      return { ...state, filter: action.payload };

    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };

    case 'SELECT_INCIDENT':
      return { ...state, selectedIncident: action.payload };

    case 'CONFIRM_AND_ESCALATE': {
      const { incidentId, officerName, notes } = action.payload;
      const now = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
      }) + ' IST';

      const updatedIncidents = state.incidents.map((incident) => {
        if (incident.id === incidentId) {
          return {
            ...incident,
            validationStatus: 'CONFIRMED' as const,
            isSifPrecursor: true,
            reviewedBy: officerName || 'T. Baruah (Chief HSSE Supt.)',
            reviewedAt: now,
            escalationNotes:
              notes ||
              'High-priority SIF Precursor verified. Emergency stop-work notification dispatched to Field GM and Safety Directorate.',
          };
        }
        return incident;
      });

      const updatedSelected =
        state.selectedIncident?.id === incidentId
          ? updatedIncidents.find((i) => i.id === incidentId) || null
          : state.selectedIncident;

      return {
        ...state,
        incidents: updatedIncidents,
        selectedIncident: updatedSelected,
        isOverrideModalOpen: false,
      };
    }

    case 'OVERRIDE_INCIDENT': {
      const { incidentId, justification, officerName } = action.payload;
      const now = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
      }) + ' IST';

      const updatedIncidents = state.incidents.map((incident) => {
        if (incident.id === incidentId) {
          return {
            ...incident,
            validationStatus: 'OVERRIDDEN' as const,
            isSifPrecursor: false,
            overrideJustification: justification,
            reviewedBy: officerName || 'T. Baruah (Chief HSSE Supt.)',
            reviewedAt: now,
          };
        }
        return incident;
      });

      const updatedSelected =
        state.selectedIncident?.id === incidentId
          ? updatedIncidents.find((i) => i.id === incidentId) || null
          : state.selectedIncident;

      return {
        ...state,
        incidents: updatedIncidents,
        selectedIncident: updatedSelected,
        isOverrideModalOpen: false,
      };
    }

    case 'ADD_INCIDENT': {
      const newId = `OIL-2026-${1043 + state.incidents.length}`;
      const now = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
      }) + ' IST';

      const newIncident: SafetyIncident = {
        ...action.payload,
        id: newId,
        timestamp: now,
        validationStatus: 'PENDING',
      };

      return {
        ...state,
        incidents: [newIncident, ...state.incidents],
        selectedIncident: newIncident,
        isIngestionModalOpen: false,
      };
    }

    case 'ADD_BATCH_INCIDENTS': {
      const newIncidents = [...action.payload, ...state.incidents];
      return {
        ...state,
        incidents: newIncidents,
        selectedIncident: action.payload[0] || state.selectedIncident,
        isIngestionModalOpen: false,
      };
    }

    case 'COMMIT_DATASET_INGESTION': {
      const { incidents, dataset } = action.payload;
      const newIncidents = [...incidents, ...state.incidents];
      const newDatasets = dataset
        ? [dataset, ...state.datasets.filter((d) => d.id !== dataset.id)]
        : state.datasets;
      return {
        ...state,
        incidents: newIncidents,
        datasets: newDatasets,
        selectedIncident: incidents[0] || state.selectedIncident,
        isIngestionModalOpen: false,
      };
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'REMOVE_DATASET_INCIDENTS': {
      const targetId = action.payload.datasetId;
      const remaining = state.incidents.filter((i) => {
        if (i.datasetId === targetId) return false;
        if ((targetId === 'ds-01' || targetId === 'd0000000-0000-0000-0000-000000000001') && !i.datasetId) return false;
        return true;
      });
      return {
        ...state,
        incidents: remaining,
        selectedIncident:
          remaining.length > 0
            ? remaining.find((i) => i.id === state.selectedIncident?.id) || remaining[0]
            : null,
      };
    }

    case 'OPEN_INGESTION_MODAL':
      return { ...state, isIngestionModalOpen: true };

    case 'CLOSE_INGESTION_MODAL':
      return { ...state, isIngestionModalOpen: false };

    case 'OPEN_OVERRIDE_MODAL':
      return { ...state, isOverrideModalOpen: true };

    case 'CLOSE_OVERRIDE_MODAL':
      return { ...state, isOverrideModalOpen: false };

    default:
      return state;
  }
}

const SafetyContext = createContext<SafetyContextType | undefined>(undefined);

export function SafetyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(safetyReducer, initialState);

  const refreshDatasets = async () => {
    try {
      const apiRes = await apiClient.getDatasets();
      if (apiRes) {
        dispatch({ type: 'SET_DATASETS', payload: apiRes });
        return;
      }
    } catch (err) {
      console.warn('[SafetyContext] Backend getDatasets failed:', err);
    }
    try {
      const supaRes = await supabaseListDatasets();
      if (supaRes) {
        dispatch({ type: 'SET_DATASETS', payload: supaRes });
      }
    } catch (err) {
      console.warn('[SafetyContext] Supabase list datasets failed:', err);
    }
  };

  // Load live incidents and datasets from FastAPI backend or Supabase if available
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        // 1. Try FastAPI backend (primary source of truth)
        try {
          const backendRes = await apiClient.getIncidents({ pageSize: 100 });
          if (backendRes && isMounted) {
            dispatch({ type: 'SET_INCIDENTS', payload: backendRes.incidents });
          }
        } catch (err) {
          console.warn('[SafetyContext] FastAPI backend unavailable, checking direct persistence:', err);
        }

        // Load datasets
        try {
          const backendDatasets = await apiClient.getDatasets();
          if (backendDatasets && isMounted) {
            dispatch({ type: 'SET_DATASETS', payload: backendDatasets });
          }
        } catch (err) {
          console.warn('[SafetyContext] FastAPI getDatasets unavailable:', err);
        }

        // 2. Try Supabase direct persistence if not loaded
        try {
          const supabaseRes = await supabaseListIncidents({ limit: 100 });
          if (supabaseRes && isMounted) {
            dispatch({ type: 'SET_INCIDENTS', payload: supabaseRes });
          }
        } catch (err) {
          console.warn('[SafetyContext] Supabase direct fallback unavailable:', err);
        }

        try {
          const supaDatasets = await supabaseListDatasets();
          if (supaDatasets && isMounted) {
            dispatch({ type: 'SET_DATASETS', payload: supaDatasets });
          }
        } catch (err) {
          console.warn('[SafetyContext] Supabase list datasets unavailable:', err);
        }
      } finally {
        if (isMounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);


  // Real-time KPI calculations
  const kpiMetrics: KpiMetrics = useMemo(() => {
    const totalIngested = state.incidents.length;
    const flaggedSif = state.incidents.filter(
      (i) => i.isSifPrecursor && i.validationStatus !== 'OVERRIDDEN'
    ).length;
    const pendingReview = state.incidents.filter(
      (i) => i.validationStatus === 'PENDING'
    ).length;
    const reviewedCount = totalIngested - pendingReview;
    const complianceRate = totalIngested > 0 ? Math.round((reviewedCount / totalIngested) * 100) : 100;

    return {
      totalIngested,
      flaggedSif,
      pendingReview,
      complianceRate,
    };
  }, [state.incidents]);

  const setFilter = useCallback((filter: TriageFilter) => dispatch({ type: 'SET_FILTER', payload: filter }), []);
  const setSearchQuery = useCallback((query: string) => dispatch({ type: 'SET_SEARCH', payload: query }), []);
  const selectIncident = useCallback((incident: SafetyIncident | null) => dispatch({ type: 'SELECT_INCIDENT', payload: incident }), []);
  const openIngestionModal = useCallback(() => dispatch({ type: 'OPEN_INGESTION_MODAL' }), []);
  const closeIngestionModal = useCallback(() => dispatch({ type: 'CLOSE_INGESTION_MODAL' }), []);
  const openOverrideModal = useCallback(() => dispatch({ type: 'OPEN_OVERRIDE_MODAL' }), []);
  const closeOverrideModal = useCallback(() => dispatch({ type: 'CLOSE_OVERRIDE_MODAL' }), []);

  const confirmAndEscalate = useCallback((incidentId: string, officerName?: string, notes?: string) => {
    dispatch({
      type: 'CONFIRM_AND_ESCALATE',
      payload: { incidentId, officerName, notes },
    });
    const name = officerName || 'T. Baruah (Chief HSSE Supt.)';
    apiClient.confirmIncident(incidentId, name, notes);
    supabaseConfirmIncident(incidentId, name, notes);
  }, []);

  const overrideIncident = useCallback((incidentId: string, justification: string, officerName?: string) => {
    dispatch({
      type: 'OVERRIDE_INCIDENT',
      payload: { incidentId, justification, officerName },
    });
    const name = officerName || 'T. Baruah (Chief HSSE Supt.)';
    apiClient.overrideIncident(incidentId, name, justification);
    supabaseOverrideIncident(incidentId, name, justification);
  }, []);

  const addIncident = useCallback((incident: Omit<SafetyIncident, 'id' | 'timestamp' | 'validationStatus'>) => {
    dispatch({ type: 'ADD_INCIDENT', payload: incident });
    apiClient.createIncident({
      site: incident.site,
      category: incident.category,
      reportedBy: incident.reportedBy,
      rawNarrative: incident.rawNarrative,
      basin: incident.basin,
    });
  }, []);

  const addBatchIncidents = useCallback((incidents: SafetyIncident[]) => {
    dispatch({ type: 'ADD_BATCH_INCIDENTS', payload: incidents });
  }, []);

  const commitDatasetIngestion = useCallback((payload: { incidents: SafetyIncident[]; dataset?: Dataset }) => {
    dispatch({ type: 'COMMIT_DATASET_INGESTION', payload });
  }, []);

  const addDataset = useCallback((dataset: Dataset) => {
    dispatch({ type: 'ADD_DATASET', payload: dataset });
  }, []);

  const removeDataset = useCallback((datasetId: string) => {
    dispatch({ type: 'REMOVE_DATASET', payload: { datasetId } });
  }, []);

  const removeDatasetIncidents = useCallback((datasetId: string) => {
    dispatch({ type: 'REMOVE_DATASET_INCIDENTS', payload: { datasetId } });
  }, []);

  const value = useMemo<SafetyContextType>(
    () => ({
      incidents: state.incidents,
      datasets: state.datasets,
      selectedIncident: state.selectedIncident,
      filter: state.filter,
      searchQuery: state.searchQuery,
      kpiMetrics,
      isIngestionModalOpen: state.isIngestionModalOpen,
      isOverrideModalOpen: state.isOverrideModalOpen,
      setFilter,
      setSearchQuery,
      selectIncident,
      confirmAndEscalate,
      overrideIncident,
      addIncident,
      addBatchIncidents,
      commitDatasetIngestion,
      addDataset,
      removeDataset,
      refreshDatasets,
      removeDatasetIncidents,
      openIngestionModal,
      closeIngestionModal,
      openOverrideModal,
      closeOverrideModal,
      isLoading: state.isLoading,
    }),
    [
      state.incidents,
      state.datasets,
      state.selectedIncident,
      state.filter,
      state.searchQuery,
      state.isIngestionModalOpen,
      state.isOverrideModalOpen,
      state.isLoading,
      kpiMetrics,
      setFilter,
      setSearchQuery,
      selectIncident,
      confirmAndEscalate,
      overrideIncident,
      addIncident,
      addBatchIncidents,
      commitDatasetIngestion,
      addDataset,
      removeDataset,
      removeDatasetIncidents,
      openIngestionModal,
      closeIngestionModal,
      openOverrideModal,
      closeOverrideModal,
    ]
  );


  return <SafetyContext.Provider value={value}>{children}</SafetyContext.Provider>;
}

export function useSafety() {
  const context = useContext(SafetyContext);
  if (!context) {
    throw new Error('useSafety must be used within a SafetyProvider');
  }
  return context;
}

// Backward-compatible alias
export const useSafetyData = useSafety;
export const SafetyDataProvider = SafetyProvider;
