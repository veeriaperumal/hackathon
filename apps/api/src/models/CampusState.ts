import mongoose, { Schema, Document } from 'mongoose';

export interface CampusStateDocument extends Document {
  stateVersion: number;
  blockedRoutes: Array<{
    routeId: string;
    fromZone: string;
    toZone: string;
    status: 'clear' | 'blocked' | 'congested';
    blockedByIncidentId?: string;
  }>;
  lastUpdatedAt: string;
}

const RouteConstraintSchema = new Schema({
  routeId: { type: String, required: true },
  fromZone: { type: String, required: true },
  toZone: { type: String, required: true },
  status: { type: String, enum: ['clear', 'blocked', 'congested'], default: 'clear' },
  blockedByIncidentId: { type: String }
}, { _id: false });

const CampusStateSchema = new Schema<CampusStateDocument>({
  stateVersion: { type: Number, required: true, default: 1 },
  blockedRoutes: [RouteConstraintSchema],
  lastUpdatedAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

export const CampusStateModel = mongoose.model<CampusStateDocument>('CampusState', CampusStateSchema);
