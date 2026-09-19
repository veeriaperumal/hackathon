import mongoose, { Schema, Document } from 'mongoose';
import { AuditLog } from '@campus-crisis/shared';

export interface AuditLogDocument extends Omit<AuditLog, 'id'>, Document {}

const AuditLogSchema = new Schema<AuditLogDocument>({
  event: { type: String, required: true },
  entityId: { type: String, required: true },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  source: { type: String, required: true, default: 'system' },
  timestamp: { type: String, default: () => new Date().toISOString() }
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

export const AuditLogModel = mongoose.model<AuditLogDocument>('AuditLog', AuditLogSchema);
