export type IncidentType = 'medical' | 'fire' | 'security' | 'hazmat';

export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'escalated';

export type ResourceType = 'ambulance' | 'fire_truck' | 'security_patrol' | 'hazmat_unit' | 'medical_team';

export type ResourceStatus = 'available' | 'dispatched' | 'busy' | 'maintenance';

export interface Location {
  zone: string;
  building?: string;
  latitude: number;
  longitude: number;
}

export interface Incident {
  id: string;
  type: IncidentType;
  description: string;
  location: Location;
  severity: number; // 1-10
  urgency: number;  // 1-10
  impact: number;   // 1-10
  priorityScore?: number; // 0-10 calculated
  status: IncidentStatus;
  requiredResourceTypes: ResourceType[];
  dependencies: string[]; // dependent incident IDs
  source: 'operator' | 'sensor' | 'simulator' | 'user_report';
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  location: Location;
  capabilities: string[];
  assignedIncidentId?: string | null;
  lastUpdatedAt: string;
}

export interface ActionPlanStep {
  stepNumber: number;
  minuteWindow: string;
  actionType: 'DISPATCH' | 'MONITOR' | 'STAGING' | 'EVACUATE' | 'CONTAIN';
  targetIncidentId: string;
  assignedResourceId: string;
  description: string;
  rationale: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  passedChecks: string[];
}

export interface ActionPlan {
  planId: string;
  version: number;
  stateVersion: number;
  generatedAt: string;
  trigger: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'superseded';
  executiveSummary: string;
  incidentAnalysis: Array<{
    incidentId: string;
    priorityScore: number;
    urgencyLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    impactAssessment: string;
    riskCategory: string;
  }>;
  dependencies: Array<{
    primaryIncidentId: string;
    dependentIncidentId: string;
    dependencyType: 'SPATIAL_PROXIMITY' | 'CASCADE_RISK' | 'ROUTE_OBSTRUCTION' | 'SHARED_RESOURCE_CONTENTION';
    rationale: string;
  }>;
  resourceAllocation: Array<{
    resourceId: string;
    assignedIncidentId: string;
    capabilityMatched: string;
    etaMinutes: number;
  }>;
  steps: ActionPlanStep[];
  validation: ValidationResult;
  operatorDecision?: {
    decision: 'approve' | 'reject' | 'modify';
    timestamp: string;
    operatorNotes?: string;
  };
}

export interface AuditLog {
  id: string;
  event: string;
  entityId: string;
  oldValue?: Record<string, unknown> | string;
  newValue?: Record<string, unknown> | string;
  source: string;
  timestamp: string;
}

export interface RouteConstraint {
  routeId: string;
  fromZone: string;
  toZone: string;
  status: 'clear' | 'blocked' | 'congested';
  blockedByIncidentId?: string;
}

export interface DecisionContext {
  timestamp: string;
  stateVersion: number;
  incidents: Incident[];
  resources: Resource[];
  dependencies: Array<{ incidentA: string; incidentB: string; distanceMeters: number }>;
  routeConstraints: RouteConstraint[];
}
