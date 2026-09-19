import mongoose from 'mongoose';
import { CampusStateModel } from '../models/CampusState.js';

let currentStateVersion = 1;

export async function getCurrentStateVersion(): Promise<number> {
  if (mongoose.connection.readyState === 0) {
    return currentStateVersion;
  }
  try {
    const state = await CampusStateModel.findOne();
    if (state) {
      currentStateVersion = state.stateVersion;
      return state.stateVersion;
    }
    const newState = await CampusStateModel.create({ stateVersion: 1, blockedRoutes: [] });
    currentStateVersion = newState.stateVersion;
    return currentStateVersion;
  } catch (err) {
    return currentStateVersion;
  }
}

export async function incrementStateVersion(): Promise<number> {
  if (mongoose.connection.readyState === 0) {
    currentStateVersion += 1;
    return currentStateVersion;
  }
  try {
    let state = await CampusStateModel.findOne();
    if (!state) {
      state = await CampusStateModel.create({ stateVersion: 1, blockedRoutes: [] });
    }
    state.stateVersion += 1;
    state.lastUpdatedAt = new Date().toISOString();
    await state.save();
    currentStateVersion = state.stateVersion;
    return currentStateVersion;
  } catch (err) {
    currentStateVersion += 1;
    return currentStateVersion;
  }
}

export async function getBlockedRoutes() {
  if (mongoose.connection.readyState === 0) {
    return [];
  }
  try {
    const state = await CampusStateModel.findOne();
    return state?.blockedRoutes || [];
  } catch (err) {
    return [];
  }
}

export async function updateBlockedRoutes(routes: Array<{ routeId: string; fromZone: string; toZone: string; status: 'clear' | 'blocked' | 'congested'; blockedByIncidentId?: string }>) {
  if (mongoose.connection.readyState === 0) {
    currentStateVersion += 1;
    return null;
  }
  try {
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
  } catch (err) {
    currentStateVersion += 1;
    return null;
  }
}
