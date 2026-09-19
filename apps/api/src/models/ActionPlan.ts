import mongoose, { Schema, Document } from 'mongoose';
import { ActionPlan } from '@campus-crisis/shared';

export interface ActionPlanDocument extends Document, Omit<ActionPlan, 'planId'> {
  planId: string;
}

const StepSchema = new Schema({
  stepNumber: { type: Number, required: true },
  minuteWindow: { type: String, required: true },
  actionType: { type: String, enum: ['DISPATCH', 'MONITOR', 'STAGING', 'EVACUATE', 'CONTAIN'], required: true },
  targetIncidentId: { type: String, required: true },
  assignedResourceId: { type: String, required: true },
  description: { type: String, required: true },
  rationale: { type: String, required: true }
}, { _id: false });

const ValidationSchema = new Schema({
  valid: { type: Boolean, required: true },
  errors: [{ type: String }],
  passedChecks: [{ type: String }]
}, { _id: false });

const OperatorDecisionSchema = new Schema({
  decision: { type: String, enum: ['approve', 'reject', 'modify'], required: true },
  timestamp: { type: String, required: true },
  operatorNotes: { type: String }
}, { _id: false });

const ActionPlanSchema = new Schema<ActionPlanDocument>({
  planId: { type: String, required: true, unique: true },
  version: { type: Number, required: true, default: 1 },
  stateVersion: { type: Number, required: true },
  generatedAt: { type: String, default: () => new Date().toISOString() },
  trigger: { type: String, required: true },
  status: { type: String, enum: ['draft', 'pending_approval', 'approved', 'rejected', 'superseded'], default: 'pending_approval' },
  executiveSummary: { type: String, required: true },
  incidentAnalysis: [{ type: Schema.Types.Mixed }],
  dependencies: [{ type: Schema.Types.Mixed }],
  resourceAllocation: [{ type: Schema.Types.Mixed }],
  steps: [StepSchema],
  validation: { type: ValidationSchema, required: true },
  operatorDecision: { type: OperatorDecisionSchema }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      delete ret._id;
      delete ret.__v;
    }
  }
});

export const ActionPlanModel = mongoose.model<ActionPlanDocument>('ActionPlan', ActionPlanSchema);
