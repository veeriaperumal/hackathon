import mongoose from 'mongoose';
import { Router, Request, Response } from 'express';
import { IncidentModel } from '../models/Incident.js';
import { IncidentCreateSchema, IncidentUpdateSchema } from '@campus-crisis/shared';
import { logAuditEvent } from '../services/auditLogger.js';
import { incrementStateVersion } from '../services/stateManager.js';
import { calculatePriorityScore } from '../rules/priorityEngine.js';
import { triggerReplanning } from '../services/orchestrator.js';
import { inMemoryStore } from '../services/inMemoryStore.js';

export const incidentRouter = Router();

incidentRouter.get('/', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 0) {
      const { status } = req.query;
      const list = status ? inMemoryStore.incidents.filter(i => i.status === status) : inMemoryStore.incidents;
      return res.json({ incidents: list });
    }
    const { status } = req.query;
    const filter = status ? { status } : {};
    const incidents = await IncidentModel.find(filter).sort({ createdAt: -1 });
    res.json({ incidents });
  } catch (error) {
    res.json({ incidents: inMemoryStore.incidents });
  }
});

incidentRouter.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = IncidentCreateSchema.parse(req.body);
    const priorityScore = calculatePriorityScore({
      urgency: parsed.urgency,
      impact: parsed.impact,
      dependencyRisk: 0
    });

    let incident: any;
    if (mongoose.connection.readyState >= 1) {
      incident = await IncidentModel.create({
        ...parsed,
        priorityScore,
        status: 'open',
        dependencies: []
      });
    } else {
      incident = {
        ...parsed,
        id: `inc_${Date.now()}`,
        priorityScore,
        status: 'open' as const,
        dependencies: [],
        createdAt: new Date().toISOString()
      };
      inMemoryStore.incidents.push(incident);
    }

    const stateVersion = await incrementStateVersion();
    await logAuditEvent('INCIDENT_CREATED', incident.id, null, incident, 'operator');

    triggerReplanning('INCIDENT_CREATED', incident.id);

    res.status(201).json({ incident, stateVersion });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Invalid incident payload' });
  }
});

incidentRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 0) {
      const incident = inMemoryStore.incidents.find(i => i.id === req.params.id);
      if (!incident) return res.status(404).json({ error: 'Incident not found' });
      return res.json({ incident });
    }
    const incident = await IncidentModel.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json({ incident });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

incidentRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const parsed = IncidentUpdateSchema.parse(req.body);
    if (mongoose.connection.readyState === 0) {
      const incident = inMemoryStore.incidents.find(i => i.id === req.params.id);
      if (!incident) return res.status(404).json({ error: 'Incident not found' });
      Object.assign(incident, parsed);
      const stateVersion = await incrementStateVersion();
      triggerReplanning('INCIDENT_UPDATED', incident.id);
      return res.json({ incident, stateVersion });
    }

    const incident = await IncidentModel.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const oldData = incident.toObject();
    Object.assign(incident, parsed);

    if (parsed.urgency !== undefined || parsed.impact !== undefined) {
      incident.priorityScore = calculatePriorityScore({
        urgency: incident.urgency,
        impact: incident.impact,
        dependencyRisk: incident.dependencies.length > 0 ? 5 : 0
      });
    }

    await incident.save();
    const stateVersion = await incrementStateVersion();
    await logAuditEvent('INCIDENT_UPDATED', incident.id, oldData, incident.toObject(), 'operator');

    triggerReplanning('INCIDENT_UPDATED', incident.id);

    res.json({ incident, stateVersion });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update incident' });
  }
});
