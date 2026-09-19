import mongoose, { Schema, Document } from 'mongoose';
import { Resource } from '@campus-crisis/shared';

export interface ResourceDocument extends Omit<Resource, 'id'>, Document {}

const LocationSchema = new Schema({
  zone: { type: String, required: true },
  building: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
}, { _id: false });

const ResourceSchema = new Schema<ResourceDocument>({
  name: { type: String, required: true },
  type: { type: String, enum: ['ambulance', 'fire_truck', 'security_patrol', 'hazmat_unit', 'medical_team'], required: true },
  status: { type: String, enum: ['available', 'dispatched', 'busy', 'maintenance'], default: 'available' },
  location: { type: LocationSchema, required: true },
  capabilities: [{ type: String, required: true }],
  assignedIncidentId: { type: String, default: null },
  lastUpdatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

export const ResourceModel = mongoose.model<ResourceDocument>('Resource', ResourceSchema);
