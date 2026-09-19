import { RouteConstraint } from '@campus-crisis/shared';

export function isRouteBlocked(
  fromZone: string,
  toZone: string,
  blockedRoutes: RouteConstraint[]
): boolean {
  if (fromZone === toZone) return false;

  return blockedRoutes.some(route =>
    route.status === 'blocked' &&
    ((route.fromZone === fromZone && route.toZone === toZone) ||
     (route.fromZone === toZone && route.toZone === fromZone))
  );
}
