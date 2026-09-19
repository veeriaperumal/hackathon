import { GeminiResponseSchema, DecisionContext, ValidationResult } from '@campus-crisis/shared';
import { resourceExists, resourceIsAvailable, resourceHasCapability, incidentIsActive } from '../rules/eligibilityEngine.js';
import { isRouteBlocked } from '../rules/routeConstraintEngine.js';

export interface PlanValidationOutcome {
  valid: boolean;
  validationResult: ValidationResult;
  reasonsToRepair?: string[];
}

export function validateAiPlanOutput(
  rawAiOutput: unknown,
  context: DecisionContext
): PlanValidationOutcome {
  const errors: string[] = [];
  const passedChecks: string[] = [];

  // Step 1: Zod Schema Parse
  const schemaParse = GeminiResponseSchema.safeParse(rawAiOutput);
  if (!schemaParse.success) {
    const errorDetails = schemaParse.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return {
      valid: false,
      validationResult: {
        valid: false,
        errors: [`JSON Schema Validation Failed: ${errorDetails}`],
        passedChecks: []
      },
      reasonsToRepair: [`JSON output does not match target schema: ${errorDetails}`]
    };
  }

  passedChecks.push('SCHEMA_VALIDATION_PASSED');
  const plan = schemaParse.data;

  // Track resource allocation locks within this plan
  const assignedResourcesInPlan = new Set<string>();

  // Step 2: Validate Action Plan Steps
  for (const step of plan.actionPlan) {
    if (step.assignedResourceId === 'NONE' || step.actionType === 'MONITOR' || step.actionType === 'STAGING') {
      continue; // Non-dispatch action steps are allowed
    }

    // Check Incident Existence & Active Status
    const targetIncident = context.incidents.find(i => i.id === step.targetIncidentId);
    if (!targetIncident) {
      errors.push(`Step ${step.stepNumber}: Target incident '${step.targetIncidentId}' does not exist in current active incidents.`);
      continue;
    }
    if (!incidentIsActive(targetIncident)) {
      errors.push(`Step ${step.stepNumber}: Target incident '${step.targetIncidentId}' is not active (status: ${targetIncident.status}).`);
    }

    // Check Resource Existence
    const targetResource = context.resources.find(r => r.id === step.assignedResourceId);
    if (!targetResource) {
      errors.push(`Step ${step.stepNumber}: Assigned resource '${step.assignedResourceId}' does not exist in resource database (Hallucinated Resource).`);
      continue;
    }

    // Check Resource Availability
    if (!resourceIsAvailable(targetResource)) {
      errors.push(`Step ${step.stepNumber}: Assigned resource '${targetResource.name}' (${targetResource.id}) is not available (current status: ${targetResource.status}).`);
    }

    // Check Resource Capability
    if (!resourceHasCapability(targetResource, targetIncident.requiredResourceTypes)) {
      errors.push(`Step ${step.stepNumber}: Resource '${targetResource.name}' capabilities [${targetResource.capabilities.join(', ')}] do not match incident required types [${targetIncident.requiredResourceTypes.join(', ')}].`);
    }

    // Check Double Allocation in Same Plan
    if (assignedResourcesInPlan.has(targetResource.id)) {
      errors.push(`Step ${step.stepNumber}: Resource '${targetResource.name}' (${targetResource.id}) is double-allocated across multiple steps in the same plan.`);
    } else {
      assignedResourcesInPlan.add(targetResource.id);
    }

    // Check Route Obstruction
    if (isRouteBlocked(targetResource.location.zone, targetIncident.location.zone, context.routeConstraints)) {
      errors.push(`Step ${step.stepNumber}: Route between resource zone '${targetResource.location.zone}' and incident zone '${targetIncident.location.zone}' is blocked.`);
    }
  }

  if (errors.length === 0) {
    passedChecks.push('INCIDENT_EXISTENCE_PASSED');
    passedChecks.push('RESOURCE_EXISTENCE_PASSED');
    passedChecks.push('RESOURCE_AVAILABILITY_PASSED');
    passedChecks.push('CAPABILITY_MATCH_PASSED');
    passedChecks.push('DOUBLE_ALLOCATION_LOCK_PASSED');
    passedChecks.push('ROUTE_CONSTRAINT_PASSED');
    return {
      valid: true,
      validationResult: { valid: true, errors: [], passedChecks }
    };
  }

  return {
    valid: false,
    validationResult: { valid: false, errors, passedChecks },
    reasonsToRepair: errors
  };
}
