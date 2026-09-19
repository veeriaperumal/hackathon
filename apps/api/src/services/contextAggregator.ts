import { IncidentModel } from '../models/Incident.js';
import { ResourceModel } from '../models/Resource.js';
import { getCurrentStateVersion, getBlockedRoutes } from './stateManager.js';
import { detectSpatialDependencies } from '../rules/spatialEngine.js';
import { DecisionContext, Incident, Resource } from '@campus-crisis/shared';

export async function buildDecisionContext(): Promise<DecisionContext> {
  const stateVersion = await getCurrentStateVersion();

  // 1. Fetch active incidents (open or escalated)
  const dbIncidents = await IncidentModel.find({
    status: { $in: ['open', 'escalated'] }
  }).sort({ priorityScore: -1 });

  const incidents: Incident[] = dbIncidents.map(doc => doc.toJSON() as Incident);

  // 2. Fetch available or relevant resources
  const dbResources = await ResourceModel.find();
  const resources: Resource[] = dbResources.map(doc => doc.toJSON() as Resource);

  // 3. Detect spatial dependencies between active incidents
  const spatialDeps = detectSpatialDependencies(incidents);

  // 4. Fetch blocked routes
  const routeConstraints = await getBlockedRoutes();

  return {
    timestamp: new Date().toISOString(),
    stateVersion,
    incidents,
    resources,
    dependencies: spatialDeps.map(d => ({
      incidentA: d.incidentA,
      incidentB: d.incidentB,
      distanceMeters: d.distanceMeters
    })),
    routeConstraints: routeConstraints.map((r: any) => ({
      routeId: r.routeId,
      fromZone: r.fromZone,
      toZone: r.toZone,
      status: r.status,
      blockedByIncidentId: r.blockedByIncidentId
    }))
  };
}
