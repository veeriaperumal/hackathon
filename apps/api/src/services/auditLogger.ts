import { AuditLogModel } from '../models/AuditLog.js';

export async function logAuditEvent(
  event: string,
  entityId: string,
  oldValue?: unknown,
  newValue?: unknown,
  source: string = 'system'
): Promise<void> {
  try {
    await AuditLogModel.create({
      event,
      entityId,
      oldValue,
      newValue,
      source,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
