import { create } from 'zustand';
import { Incident, Resource, ActionPlan } from '@campus-crisis/shared';

interface CrisisState {
  incidents: Incident[];
  resources: Resource[];
  currentPlan: ActionPlan | null;
  aiStatus: 'ONLINE' | 'FALLBACK_MODE' | 'OFFLINE';
  isRecalculating: boolean;
  stateVersion: number;

  setIncidents: (incidents: Incident[]) => void;
  setResources: (resources: Resource[]) => void;
  setCurrentPlan: (plan: ActionPlan | null) => void;
  setAiStatus: (status: 'ONLINE' | 'FALLBACK_MODE' | 'OFFLINE') => void;
  setIsRecalculating: (recalc: boolean) => void;
  setStateVersion: (version: number) => void;

  fetchState: () => Promise<void>;
  submitDecision: (planId: string, decision: 'approve' | 'reject' | 'modify', notes?: string) => Promise<void>;
  loadScenario: (scenarioId: string) => Promise<void>;
  triggerChaos: (count?: number) => Promise<void>;
  resetCampus: () => Promise<void>;
}

export const useCrisisStore = create<CrisisState>((set, get) => ({
  incidents: [],
  resources: [],
  currentPlan: null,
  aiStatus: 'ONLINE',
  isRecalculating: false,
  stateVersion: 1,

  setIncidents: (incidents) => set({ incidents }),
  setResources: (resources) => set({ resources }),
  setCurrentPlan: (currentPlan) => set({ currentPlan }),
  setAiStatus: (aiStatus) => set({ aiStatus }),
  setIsRecalculating: (isRecalculating) => set({ isRecalculating }),
  setStateVersion: (stateVersion) => set({ stateVersion }),

  fetchState: async () => {
    try {
      // Health check
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const health = await healthRes.json();
        set({ aiStatus: health.aiStatus, stateVersion: health.stateVersion });
      }

      // Incidents
      const incRes = await fetch('/api/incidents');
      if (incRes.ok) {
        const data = await incRes.json();
        set({ incidents: data.incidents || [] });
      }

      // Resources
      const resRes = await fetch('/api/resources');
      if (resRes.ok) {
        const data = await resRes.json();
        set({ resources: data.resources || [] });
      }

      // Action Plan
      const planRes = await fetch('/api/action-plans/latest');
      if (planRes.ok) {
        const data = await planRes.json();
        set({ currentPlan: data.actionPlan || null });
      }
    } catch (err) {
      console.error('Failed to fetch campus state:', err);
    }
  },

  submitDecision: async (planId, decision, notes) => {
    try {
      const res = await fetch(`/api/action-plans/${planId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, operatorNotes: notes })
      });
      if (res.ok) {
        await get().fetchState();
      } else {
        const errData = await res.json();
        alert(`Decision failed: ${errData.message || errData.error}`);
        await get().fetchState();
      }
    } catch (err) {
      console.error('Submit decision error:', err);
    }
  },

  loadScenario: async (scenarioId) => {
    set({ isRecalculating: true });
    try {
      await fetch('/api/simulator/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      });
      await get().fetchState();
    } finally {
      set({ isRecalculating: false });
    }
  },

  triggerChaos: async (count = 5) => {
    set({ isRecalculating: true });
    try {
      await fetch('/api/simulator/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });
      await get().fetchState();
    } finally {
      set({ isRecalculating: false });
    }
  },

  resetCampus: async () => {
    set({ isRecalculating: true });
    try {
      await fetch('/api/simulator/reset', { method: 'POST' });
      await get().fetchState();
    } finally {
      set({ isRecalculating: false });
    }
  }
}));
