import { describe, it, expect } from 'vitest';
import { calculatePriorityScore, getUrgencyLevel } from '../apps/api/src/rules/priorityEngine.js';
import { haversineDistanceMeters, detectSpatialDependencies } from '../apps/api/src/rules/spatialEngine.js';
import { isRouteBlocked } from '../apps/api/src/rules/routeConstraintEngine.js';
import { resourceIsAvailable, resourceHasCapability } from '../apps/api/src/rules/eligibilityEngine.js';
import { generateFallbackPlan } from '../apps/api/src/rules/fallbackEngine.js';
import { Incident, Resource, RouteConstraint } from '@campus-crisis/shared';

describe('Deterministic Safety & Priority Engine Unit Tests', () => {
  it('should calculate priority score using weighted formula correctly', () => {
    // 0.45 * 10 + 0.35 * 10 + 0.20 * 0 = 4.5 + 3.5 = 8.0
    const score = calculatePriorityScore({ urgency: 10, impact: 10, dependencyRisk: 0 });
    expect(score).toBe(8.0);
    expect(getUrgencyLevel(score)).toBe('CRITICAL');
  });

  it('should calculate Haversine spatial distance between coordinates', () => {
    // Approx 200m distance
    const dist = haversineDistanceMeters(12.9716, 77.5946, 12.9730, 77.5946);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(300);
  });

  it('should detect spatial dependencies within configured 50m radius', () => {
    const incidents: Incident[] = [
      {
        id: 'INC-1', type: 'medical', description: 'Test', location: { zone: 'North_Zone', latitude: 12.97160, longitude: 77.59460 },
        severity: 8, urgency: 8, impact: 7, status: 'open', requiredResourceTypes: ['ambulance'], dependencies: [], source: 'simulator', createdAt: '', updatedAt: ''
      },
      {
        id: 'INC-2', type: 'fire', description: 'Test Near', location: { zone: 'North_Zone', latitude: 12.97162, longitude: 77.59462 },
        severity: 9, urgency: 9, impact: 9, status: 'open', requiredResourceTypes: ['fire_truck'], dependencies: [], source: 'simulator', createdAt: '', updatedAt: ''
      }
    ];

    const deps = detectSpatialDependencies(incidents, 50);
    expect(deps.length).toBe(1);
    expect(deps[0].incidentA).toBe('INC-1');
    expect(deps[0].incidentB).toBe('INC-2');
  });

  it('should detect blocked routes between campus zones', () => {
    const blockedRoutes: RouteConstraint[] = [
      { routeId: 'R1', fromZone: 'North_Zone', toZone: 'West_Zone', status: 'blocked' }
    ];

    expect(isRouteBlocked('North_Zone', 'West_Zone', blockedRoutes)).toBe(true);
    expect(isRouteBlocked('West_Zone', 'North_Zone', blockedRoutes)).toBe(true);
    expect(isRouteBlocked('North_Zone', 'East_Zone', blockedRoutes)).toBe(false);
  });

  it('should generate valid deterministic fallback plan for active incidents', () => {
    const context = {
      timestamp: new Date().toISOString(),
      stateVersion: 1,
      incidents: [
        {
          id: 'INC-1', type: 'medical' as const, description: 'Medical Incident', location: { zone: 'North_Zone', latitude: 12.971, longitude: 77.594 },
          severity: 8, urgency: 9, impact: 7, priorityScore: 8.5, status: 'open' as const, requiredResourceTypes: ['ambulance' as const], dependencies: [], source: 'simulator' as const, createdAt: '', updatedAt: ''
        }
      ],
      resources: [
        {
          id: 'RES-1', name: 'AMB-01', type: 'ambulance' as const, status: 'available' as const, location: { zone: 'North_Zone', latitude: 12.971, longitude: 77.594 },
          capabilities: ['ambulance'], assignedIncidentId: null, lastUpdatedAt: ''
        }
      ],
      dependencies: [],
      routeConstraints: []
    };

    const plan = generateFallbackPlan(context);
    expect(plan.validation.valid).toBe(true);
    expect(plan.steps.length).toBe(1);
    expect(plan.steps[0].assignedResourceId).toBe('RES-1');
    expect(plan.steps[0].actionType).toBe('DISPATCH');
  });
});
