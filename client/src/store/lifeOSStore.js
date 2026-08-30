import { create } from 'zustand';
import { api } from '../services/api.js';

export const useLifeOSStore = create((set, get) => ({
  // Dashboard state
  dashboard: {
    metrics: {
      activeResponsibilities: 0,
      critical: 0,
      dueThisWeek: 0,
      blocked: 0,
      missingRequirements: 0,
      completedThisWeek: 0,
    },
    priorityAction: null,
    sections: {
      urgent: [],
      today: [],
      upcoming: [],
      blocked: [],
      recentActivity: [],
    },
  },
  loadingDashboard: false,

  // Responsibilities state
  responsibilities: [],
  totalResponsibilities: 0,
  selectedResponsibility: null,
  loadingResponsibilities: false,
  filters: {
    status: '',
    priority: '',
    category: '',
    search: '',
    sort: 'priority',
  },

  // Real-time processing stream state
  activeProcessing: {
    isProcessing: false,
    runId: null,
    sourceId: null,
    currentAgent: 'IDLE',
    stepTitle: '',
    logs: [],
  },

  // Actions
  fetchDashboard: async () => {
    set({ loadingDashboard: true });
    try {
      const res = await api.get('/dashboard');
      set({ dashboard: res.data.data, loadingDashboard: false });
    } catch (err) {
      console.error('[Store] Failed to fetch dashboard:', err);
      set({ loadingDashboard: false });
    }
  },

  fetchResponsibilities: async () => {
    set({ loadingResponsibilities: true });
    const { filters } = get();
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);

      const res = await api.get(`/responsibilities?${params.toString()}`);
      set({
        responsibilities: res.data.data.items || [],
        totalResponsibilities: res.data.data.total || 0,
        loadingResponsibilities: false,
      });
    } catch (err) {
      console.error('[Store] Failed to fetch responsibilities:', err);
      set({ loadingResponsibilities: false });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().fetchResponsibilities();
  },

  fetchResponsibilityById: async (id) => {
    try {
      const res = await api.get(`/responsibilities/${id}`);
      set({ selectedResponsibility: res.data.data.responsibility });
      return res.data.data.responsibility;
    } catch (err) {
      console.error('[Store] Error fetching responsibility details:', err);
      return null;
    }
  },

  updateResponsibilityStatus: async (id, status) => {
    try {
      const res = await api.post(`/responsibilities/${id}/status`, { status });
      const updated = res.data.data.responsibility;
      set((state) => ({
        responsibilities: state.responsibilities.map((r) => ((r._id || r.id) === id ? updated : r)),
        selectedResponsibility: state.selectedResponsibility && (state.selectedResponsibility._id || state.selectedResponsibility.id) === id ? updated : state.selectedResponsibility,
      }));
      get().fetchDashboard();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  createResponsibility: async (data) => {
    try {
      const res = await api.post('/responsibilities', data);
      get().fetchResponsibilities();
      get().fetchDashboard();
      return { success: true, data: res.data.data.responsibility };
    } catch (err) {
      return { success: false, error: err.response?.data?.error?.message || err.message };
    }
  },

  deleteResponsibility: async (id) => {
    try {
      await api.delete(`/responsibilities/${id}`);
      get().fetchResponsibilities();
      get().fetchDashboard();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Real-time Event Handlers
  handleProcessingEvent: (eventData) => {
    set((state) => ({
      activeProcessing: {
        ...state.activeProcessing,
        isProcessing: true,
        currentAgent: eventData.agent || state.activeProcessing.currentAgent,
        stepTitle: eventData.message,
        logs: [eventData, ...state.activeProcessing.logs].slice(0, 30),
      },
    }));
  },

  handleProcessingComplete: (data) => {
    set((state) => ({
      activeProcessing: {
        ...state.activeProcessing,
        isProcessing: false,
        currentAgent: 'COMPLETED',
        stepTitle: `Processing Completed (${data.count} items)`,
      },
    }));
    get().fetchDashboard();
    get().fetchResponsibilities();
  },
}));
