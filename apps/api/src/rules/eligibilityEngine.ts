import { Resource, Incident } from '@campus-crisis/shared';

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

export function resourceExists(resourceId: string, resources: Resource[]): boolean {
  return resources.some(r => r.id === resourceId);
}

export function resourceIsAvailable(resource: Resource): boolean {
  return resource.status === 'available';
}

export function resourceHasCapability(resource: Resource, requiredTypes: string[]): boolean {
  if (requiredTypes.length === 0) return true;
  return requiredTypes.some(type =>
    resource.capabilities.includes(type) || resource.type === type
  );
}

export function resourceIsNotAlreadyAssigned(resourceId: string, activeAllocations: Set<string>): boolean {
  return !activeAllocations.has(resourceId);
}

export function incidentIsActive(incident: Incident): boolean {
  return incident.status === 'open' || incident.status === 'escalated';
}

export function validateResourceEligibility(
  resource: Resource,
  incident: Incident,
  activeAllocations: Set<string>
): EligibilityResult {
  if (!incidentIsActive(incident)) {
    return { eligible: false, reason: `Target incident ${incident.id} is not active (status: ${incident.status})` };
  }
  if (!resourceIsAvailable(resource)) {
    return { eligible: false, reason: `Resource ${resource.name} (${resource.id}) is not available (status: ${resource.status})` };
  }
  if (!resourceHasCapability(resource, incident.requiredResourceTypes)) {
    return { eligible: false, reason: `Resource ${resource.name} (${resource.id}) lacks capability for incident ${incident.id}` };
  }
  if (!resourceIsNotAlreadyAssigned(resource.id, activeAllocations)) {
    return { eligible: false, reason: `Resource ${resource.name} (${resource.id}) is already assigned in another plan step` };
  }
  return { eligible: true };
}
