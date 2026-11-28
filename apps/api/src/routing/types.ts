import type { RouteRouting } from '@trailforge/shared';

export type RoutingEnv = {
  openRouteServiceKey?: string;
  graphHopperKey?: string;
  fetchImpl?: typeof fetch;
};

export type PedestrianMeasure = {
  totalMeters: number;
  routing: RouteRouting;
};
