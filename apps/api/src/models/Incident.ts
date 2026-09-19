import mongoose, { Schema, Document } from 'mongoose';
import { Incident } from '@campus-crisis/shared';

export interface IncidentDocument extends Omit<Incident, 'id'>, Document {}

const LocationSchema = new Schema({
  zone: { type: String, required: true },
  building: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
}, { _id: false });

const IncidentSchema = new Schema<IncidentDocument>({
  type: { type: String, enum: ['medical', 'fire', 'security', 'hazmat'], required: true },
  description: { type: String, required: true },
  location: { type: LocationSchema, required: true },
  severity: { type: Number, required: true, min: 1, max: 10 },
  urgency: { type: Number, required: true, min: 1, max: 10 },
  impact: { type: Number, required: true, min: 1, max: 10 },
  priorityScore: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'escalated'], default: 'open' },
  requiredResourceTypes: [{ type: String, required: true }],
  dependencies: [{ type: String }],
  source: { type: String, enum: ['operator', 'sensor', 'simulator', 'user_report'], default: 'operator' }
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

export const IncidentModel = mongoose.model<IncidentDocument>('Incident', IncidentSchema);
