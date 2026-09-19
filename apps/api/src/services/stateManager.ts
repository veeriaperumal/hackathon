import { CampusStateModel } from '../models/CampusState.js';

let currentStateVersion = 1;

export async function getCurrentStateVersion(): Promise<number> {
  const state = await CampusStateModel.findOne();
  if (state) {
    currentStateVersion = state.stateVersion;
    return state.stateVersion;
  }
  const newState = await CampusStateModel.create({ stateVersion: 1, blockedRoutes: [] });
  currentStateVersion = newState.stateVersion;
  return currentStateVersion;
}

export async function incrementStateVersion(): Promise<number> {
  let state = await CampusStateModel.findOne();
  if (!state) {
    state = await CampusStateModel.create({ stateVersion: 1, blockedRoutes: [] });
  }
  state.stateVersion += 1;
  state.lastUpdatedAt = new Date().toISOString();
  await state.save();
  currentStateVersion = state.stateVersion;
  return currentStateVersion;
}

export async function getBlockedRoutes() {
  const state = await CampusStateModel.findOne();
  return state?.blockedRoutes || [];
}

export async function updateBlockedRoutes(routes: Array<{ routeId: string; fromZone: string; toZone: string; status: 'clear' | 'blocked' | 'congested'; blockedByIncidentId?: string }>) {
  let state = await CampusStateModel.findOne();
  if (!state) {
    state = await CampusStateModel.create({ stateVersion: 1, blockedRoutes: [] });
  }
  state.blockedRoutes = routes;
  state.stateVersion += 1;
  state.lastUpdatedAt = new Date().toISOString();
  await state.save();
  currentStateVersion = state.stateVersion;
  return state;
}
