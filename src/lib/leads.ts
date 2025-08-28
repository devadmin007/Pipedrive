import { create } from 'zustand';
import api from './api';

export interface Lead {
  _id: string;
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  value: number;
  status: string;
  notes: string;
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  } | null;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'follow-up';
  description: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface LeadFormValues {
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  value: number;
  status: string;
  notes: string;
  assignedTo: string | null;
}

export const LEAD_STATUSES = [
  'New Lead', 
  'Contacted', 
  'Qualified', 
  'Proposal', 
  'Negotiation', 
  'Closed Won', 
  'Closed Lost'
];

export const ACTIVITY_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
  { value: 'follow-up', label: 'Follow-up' },
];

interface LeadsState {
  leads: Lead[];
  currentLead: Lead | null;
  loading: boolean;
  error: string | null;
  filters: {
    status: string | null;
    assignedTo: string | null;
    search: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  
  fetchLeads: () => Promise<void>;
  fetchLead: (id: string) => Promise<void>;
  createLead: (leadData: LeadFormValues) => Promise<void>;
  updateLead: (id: string, leadData: Partial<LeadFormValues>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addActivity: (leadId: string, activityData: any) => Promise<void>;
  updateLeadStatus: (id: string, status: string) => Promise<void>;
  setFilters: (filters: Partial<LeadsState['filters']>) => void;
  setPage: (page: number) => void;
  clearCurrentLead: () => void;
}

export const useLeadsStore = create<LeadsState>((set, get) => ({
  leads: [],
  currentLead: null,
  loading: false,
  error: null,
  filters: {
    status: null,
    assignedTo: null,
    search: '',
  },
  pagination: {
    page: 1,
    limit: 25,
    total: 0,
    hasMore: false,
  },
  
  fetchLeads: async () => {
    const { filters, pagination } = get();
    const { status, assignedTo, search } = filters;
    
    try {
      set({ loading: true, error: null });
      
      let url = `/leads?page=${pagination.page}&limit=${pagination.limit}`;
      
      if (status) url += `&status=${status}`;
      if (assignedTo) url += `&assignedTo=${assignedTo}`;
      if (search) url += `&search=${search}`;
      
      const response = await api.get(url);
      
      set({ 
        leads: response.data.data,
        pagination: {
          ...pagination,
          total: response.data.pagination?.total || 0,
          hasMore: !!response.data.pagination?.next,
        },
        loading: false
      });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Failed to fetch leads', 
        loading: false
      });
    }
  },
  
  fetchLead: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const response = await api.get(`/leads/${id}`);
      set({ currentLead: response.data.data, loading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Failed to fetch lead', 
        loading: false
      });
    }
  },
  
  createLead: async (leadData: LeadFormValues) => {
    try {
      set({ loading: true, error: null });
      const response = await api.post('/leads', leadData);
      
      // Refresh leads list
      get().fetchLeads();
      
      set({ loading: false });
      return response.data.data;
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Failed to create lead', 
        loading: false
      });
      throw err;
    }
  },
  
  updateLead: async (id: string, leadData: Partial<LeadFormValues>) => {
    try {
      set({ loading: true, error: null });
      const response = await api.put(`/leads/${id}`, leadData);
      
      // Update current lead if it's the one being edited
      const { currentLead } = get();
      if (currentLead && currentLead._id === id) {
        set({ currentLead: response.data.data });
      }
      
      // Refresh leads list
      get().fetchLeads();
      
      set({ loading: false });
      return response.data.data;
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Failed to update lead', 
        loading: false
      });
      throw err;
    }
  },
  
  deleteLead: async (id: string) => {
    try {
      set({ loading: true, error: null });
      await api.delete(`/leads/${id}`);
      
      // Refresh leads list
      get().fetchLeads();
      
      // Clear current lead if it's the one being deleted
      const { currentLead } = get();
      if (currentLead && currentLead._id === id) {
        set({ currentLead: null });
      }
      
      set({ loading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Failed to delete lead', 
        loading: false
      });
      throw err;
    }
  },
  
  addActivity: async (leadId: string, activityData: any) => {
    try {
      set({ loading: true, error: null });
      const response = await api.post(`/leads/${leadId}/activities`, activityData);
      
      // Update current lead with new activity
      const { currentLead } = get();
      if (currentLead && currentLead._id === leadId) {
        set({ currentLead: response.data.data });
      }
      
      set({ loading: false });
      return response.data.data;
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Failed to add activity', 
        loading: false
      });
      throw err;
    }
  },
  
  updateLeadStatus: async (id: string, status: string) => {
    return get().updateLead(id, { status });
  },
  
  setFilters: (filters: Partial<LeadsState['filters']>) => {
    set(state => ({ 
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 } // Reset to page 1 when filters change
    }));
    get().fetchLeads();
  },
  
  setPage: (page: number) => {
    set(state => ({ pagination: { ...state.pagination, page } }));
    get().fetchLeads();
  },
  
  clearCurrentLead: () => {
    set({ currentLead: null });
  }
}));