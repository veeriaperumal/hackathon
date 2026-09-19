import { Router, Request, Response } from 'express';
import { IncidentModel } from '../models/Incident.js';
import { IncidentCreateSchema, IncidentUpdateSchema } from '@campus-crisis/shared';
import { logAuditEvent } from '../services/auditLogger.js';
import { incrementStateVersion } from '../services/stateManager.js';
import { calculatePriorityScore } from '../rules/priorityEngine.js';
import { triggerReplanning } from '../services/orchestrator.js';

export const incidentRouter = Router();

incidentRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const incidents = await IncidentModel.find(filter).sort({ createdAt: -1 });
    res.json({ incidents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

incidentRouter.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = IncidentCreateSchema.parse(req.body);
    const priorityScore = calculatePriorityScore({
      urgency: parsed.urgency,
      impact: parsed.impact,
      dependencyRisk: 0 // Will be updated by spatial engine if near another incident
    });

    const incident = await IncidentModel.create({
      ...parsed,
      priorityScore,
      status: 'open',
      dependencies: []
    });

    const stateVersion = await incrementStateVersion();
    await logAuditEvent('INCIDENT_CREATED', incident.id, null, incident.toObject(), 'operator');

    // Trigger orchestration replanning
    triggerReplanning('INCIDENT_CREATED', incident.id);

    res.status(201).json({ incident, stateVersion });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Invalid incident payload' });
  }
});

incidentRouter.get('/:id', async (req: Request, res: Response) => {
  try {
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
