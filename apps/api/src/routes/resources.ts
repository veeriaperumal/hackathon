import { Router, Request, Response } from 'express';
import { ResourceModel } from '../models/Resource.js';
import { ResourceUpdateSchema } from '@campus-crisis/shared';
import { logAuditEvent } from '../services/auditLogger.js';
import { incrementStateVersion } from '../services/stateManager.js';
import { triggerReplanning } from '../services/orchestrator.js';

export const resourceRouter = Router();

resourceRouter.get('/', async (req: Request, res: Response) => {
  try {
    const resources = await ResourceModel.find();
    res.json({ resources });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

resourceRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const parsed = ResourceUpdateSchema.parse(req.body);
    const resource = await ResourceModel.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const oldData = resource.toObject();
    Object.assign(resource, parsed);
    resource.lastUpdatedAt = new Date().toISOString();
    await resource.save();

    const stateVersion = await incrementStateVersion();
    await logAuditEvent('RESOURCE_STATUS_CHANGED', resource.id, oldData, resource.toObject(), 'operator');

    triggerReplanning('RESOURCE_UPDATED', resource.id);

    res.json({ resource, stateVersion });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update resource' });
  }
});
