import { z } from 'zod';

export const LocationSchema = z.object({
  zone: z.string(),
  building: z.string().optional(),
  latitude: z.number(),
  longitude: z.number()
});

export const IncidentCreateSchema = z.object({
  type: z.enum(['medical', 'fire', 'security', 'hazmat']),
  description: z.string().min(3),
  location: LocationSchema,
  severity: z.number().min(1).max(10),
  urgency: z.number().min(1).max(10),
  impact: z.number().min(1).max(10),
  requiredResourceTypes: z.array(z.enum(['ambulance', 'fire_truck', 'security_patrol', 'hazmat_unit', 'medical_team'])),
  source: z.enum(['operator', 'sensor', 'simulator', 'user_report']).default('operator')
});

export const IncidentUpdateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'escalated']).optional(),
  severity: z.number().min(1).max(10).optional(),
  urgency: z.number().min(1).max(10).optional(),
  impact: z.number().min(1).max(10).optional()
});

export const ResourceUpdateSchema = z.object({
  status: z.enum(['available', 'dispatched', 'busy', 'maintenance']).optional(),
  location: LocationSchema.optional(),
  assignedIncidentId: z.string().nullable().optional()
});

export const ActionPlanStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  minuteWindow: z.string(),
  actionType: z.enum(['DISPATCH', 'MONITOR', 'STAGING', 'EVACUATE', 'CONTAIN']),
  targetIncidentId: z.string(),
  assignedResourceId: z.string(),
  description: z.string(),
  rationale: z.string()
});

export const GeminiResponseSchema = z.object({
  executiveSummary: z.string(),
  incidentAnalysis: z.array(z.object({
    incidentId: z.string(),
    priorityScore: z.number().min(0).max(10),
    urgencyLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']),
    impactAssessment: z.string(),
    riskCategory: z.string()
  })),
  dependencies: z.array(z.object({
    primaryIncidentId: z.string(),
    dependentIncidentId: z.string(),
    dependencyType: z.enum(['SPATIAL_PROXIMITY', 'CASCADE_RISK', 'ROUTE_OBSTRUCTION', 'SHARED_RESOURCE_CONTENTION']),
    rationale: z.string()
  })),
  resourceAllocation: z.array(z.object({
    resourceId: z.string(),
    assignedIncidentId: z.string(),
    capabilityMatched: z.string(),
    etaMinutes: z.number().min(0)
  })),
  actionPlan: z.array(ActionPlanStepSchema)
});

export const OperatorDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject', 'modify']),
  modifiedSteps: z.array(ActionPlanStepSchema).optional(),
  operatorNotes: z.string().optional()
});
