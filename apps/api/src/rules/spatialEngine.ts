import { Incident } from '@campus-crisis/shared';

const DEFAULT_RADIUS_METERS = Number(process.env.SPATIAL_DEPENDENCY_RADIUS_METERS || 50);

export function haversineDistanceMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((R * c).toFixed(1));
}

export interface SpatialDependency {
  incidentA: string;
  incidentB: string;
  distanceMeters: number;
  dependencyType: 'SPATIAL_PROXIMITY';
}

export function detectSpatialDependencies(
  incidents: Incident[],
  radiusMeters: number = DEFAULT_RADIUS_METERS
): SpatialDependency[] {
  const dependencies: SpatialDependency[] = [];

  for (let i = 0; i < incidents.length; i++) {
    for (let j = i + 1; j < incidents.length; j++) {
      const incA = incidents[i];
      const incB = incidents[j];
      const dist = haversineDistanceMeters(
        incA.location.latitude, incA.location.longitude,
        incB.location.latitude, incB.location.longitude
      );

      if (dist <= radiusMeters) {
        dependencies.push({
          incidentA: incA.id,
          incidentB: incB.id,
          distanceMeters: dist,
          dependencyType: 'SPATIAL_PROXIMITY'
        });
      }
    }
  }

  return dependencies;
}
