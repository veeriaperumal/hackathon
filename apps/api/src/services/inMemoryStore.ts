export interface InMemoryIncident {
  id: string;
  type: 'medical' | 'fire' | 'security' | 'hazmat';
  description: string;
  location: { zone: string; building?: string; latitude: number; longitude: number };
  severity: number;
  urgency: number;
  impact: number;
  priorityScore: number;
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  requiredResourceTypes: string[];
  dependencies?: string[];
  source?: 'operator' | 'sensor' | 'simulator' | 'user_report';
  createdAt?: string;
}

export interface InMemoryResource {
  id: string;
  name: string;
  type: 'ambulance' | 'fire_truck' | 'security_patrol' | 'hazmat_unit';
  status: 'available' | 'dispatched' | 'maintenance' | 'offline';
  location: { zone: string; building?: string; latitude: number; longitude: number };
  capabilities: string[];
  assignedIncidentId?: string;
  lastUpdatedAt?: string;
}

export interface InMemoryActionPlan {
  planId: string;
  stateVersion: number;
  status: 'pending_approval' | 'approved' | 'rejected' | 'superseded' | 'executing';
  steps: any[];
  riskAnalysis: { bottlenecks: string[]; safetyAlerts: string[] };
  operatorDecision?: any;
  createdAt: string;
}

class InMemoryStore {
  incidents: InMemoryIncident[] = [];
  resources: InMemoryResource[] = [];
  actionPlans: InMemoryActionPlan[] = [];
  blockedRoutes: any[] = [];
  stateVersion: number = 1;

  reset() {
    this.incidents = [];
    this.resources = [];
    this.actionPlans = [];
    this.blockedRoutes = [];
    this.stateVersion += 1;
  }

  seedDefaultResourcesIfEmpty() {
    if (this.resources.length === 0) {
      this.resources = [
        { id: '660000000000000000000001', name: 'AMB-01', type: 'ambulance', status: 'available', location: { zone: 'North_Zone', building: 'Health_Center', latitude: 12.9716, longitude: 77.5946 }, capabilities: ['ambulance', 'medical_team'] },
        { id: '660000000000000000000002', name: 'AMB-02', type: 'ambulance', status: 'available', location: { zone: 'South_Zone', building: 'Sports_Complex', latitude: 12.9750, longitude: 77.5980 }, capabilities: ['ambulance', 'medical_team'] },
        { id: '660000000000000000000003', name: 'FIRE-01', type: 'fire_truck', status: 'available', location: { zone: 'East_Zone', building: 'Fire_Station', latitude: 12.9720, longitude: 77.5910 }, capabilities: ['fire_truck', 'hazmat_unit'] },
        { id: '660000000000000000000004', name: 'SEC-01', type: 'security_patrol', status: 'available', location: { zone: 'Central_Zone', building: 'Main_Gate', latitude: 12.9730, longitude: 77.5930 }, capabilities: ['security_patrol'] },
        { id: '660000000000000000000005', name: 'HAZMAT-01', type: 'hazmat_unit', status: 'available', location: { zone: 'West_Zone', building: 'Science_Block', latitude: 12.9740, longitude: 77.5920 }, capabilities: ['hazmat_unit', 'fire_truck'] }
      ];
    }
  }
}

export const inMemoryStore = new InMemoryStore();
