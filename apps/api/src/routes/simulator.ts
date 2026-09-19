import mongoose from 'mongoose';
import { Router, Request, Response } from 'express';
import { IncidentModel } from '../models/Incident.js';
import { ResourceModel } from '../models/Resource.js';
import { updateBlockedRoutes, incrementStateVersion } from '../services/stateManager.js';
import { logAuditEvent } from '../services/auditLogger.js';
import { triggerReplanning } from '../services/orchestrator.js';

export const simulatorRouter = Router();

async function resetCampusState() {
  await IncidentModel.deleteMany({});
  await ResourceModel.deleteMany({});
  await updateBlockedRoutes([]);
}

simulatorRouter.post('/reset', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 0) {
      return res.status(503).json({ error: 'Database connection unavailable. Please set MONGODB_URI in Vercel Project Settings.' });
    }
    await resetCampusState();
    await incrementStateVersion();
    res.json({ message: 'Campus state reset to clean baseline.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

simulatorRouter.post('/scenarios', async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 0) {
      return res.status(503).json({ error: 'Database connection unavailable. Please set MONGODB_URI in Vercel Project Settings.' });
    }
    const { scenarioId } = req.body;
    await resetCampusState();

    // Default 5 available resources across campus
    const defaultResources = [
      { _id: '660000000000000000000001', name: 'AMB-01', type: 'ambulance', status: 'available', location: { zone: 'North_Zone', building: 'Health_Center', latitude: 12.9716, longitude: 77.5946 }, capabilities: ['ambulance', 'medical_team'] },
      { _id: '660000000000000000000002', name: 'AMB-02', type: 'ambulance', status: 'available', location: { zone: 'South_Zone', building: 'Sports_Complex', latitude: 12.9750, longitude: 77.5980 }, capabilities: ['ambulance', 'medical_team'] },
      { _id: '660000000000000000000003', name: 'FIRE-01', type: 'fire_truck', status: 'available', location: { zone: 'East_Zone', building: 'Fire_Station', latitude: 12.9720, longitude: 77.5910 }, capabilities: ['fire_truck', 'hazmat_unit'] },
      { _id: '660000000000000000000004', name: 'SEC-01', type: 'security_patrol', status: 'available', location: { zone: 'Central_Zone', building: 'Main_Gate', latitude: 12.9730, longitude: 77.5930 }, capabilities: ['security_patrol'] },
      { _id: '660000000000000000000005', name: 'HAZMAT-01', type: 'hazmat_unit', status: 'available', location: { zone: 'West_Zone', building: 'Science_Block', latitude: 12.9740, longitude: 77.5920 }, capabilities: ['hazmat_unit', 'fire_truck'] }
    ];

    let incidentsToInsert: any[] = [];
    let resourcesToInsert: any[] = defaultResources;

    switch (scenarioId) {
      case 'scenario_a': // Single Medical Emergency
        incidentsToInsert = [
          { _id: '661000000000000000000001', type: 'medical', description: 'Student collapsed in Main Library', location: { zone: 'Central_Zone', building: 'Library', latitude: 12.9732, longitude: 77.5932 }, severity: 8, urgency: 9, impact: 6, priorityScore: 8.4, status: 'open', requiredResourceTypes: ['ambulance'], source: 'simulator' }
        ];
        break;

      case 'scenario_b': // Competing Emergencies
        incidentsToInsert = [
          { _id: '661000000000000000000001', type: 'medical', description: 'Cardiac arrest in Cafeteria', location: { zone: 'North_Zone', building: 'Cafeteria', latitude: 12.9718, longitude: 77.5948 }, severity: 9, urgency: 10, impact: 7, priorityScore: 8.9, status: 'open', requiredResourceTypes: ['ambulance'], source: 'simulator' },
          { _id: '661000000000000000000002', type: 'fire', description: 'Electrical fire in Engineering Lab', location: { zone: 'West_Zone', building: 'Science_Block', latitude: 12.9742, longitude: 77.5922 }, severity: 8, urgency: 8, impact: 9, priorityScore: 8.2, status: 'open', requiredResourceTypes: ['fire_truck'], source: 'simulator' },
          { _id: '661000000000000000000003', type: 'security', description: 'Disturbance at Main Gate', location: { zone: 'Central_Zone', building: 'Main_Gate', latitude: 12.9730, longitude: 77.5930 }, severity: 5, urgency: 6, impact: 4, priorityScore: 5.3, status: 'open', requiredResourceTypes: ['security_patrol'], source: 'simulator' }
        ];
        break;

      case 'scenario_c': // Resource Exhaustion (5 medical incidents, 1 ambulance)
        resourcesToInsert = [defaultResources[0]]; // Only 1 ambulance
        incidentsToInsert = [
          { type: 'medical', description: 'Medical Incident #1', location: { zone: 'North_Zone', latitude: 12.971, longitude: 77.594 }, severity: 9, urgency: 9, impact: 8, priorityScore: 8.8, status: 'open', requiredResourceTypes: ['ambulance'], source: 'simulator' },
          { type: 'medical', description: 'Medical Incident #2', location: { zone: 'South_Zone', latitude: 12.975, longitude: 77.598 }, severity: 8, urgency: 8, impact: 7, priorityScore: 8.0, status: 'open', requiredResourceTypes: ['ambulance'], source: 'simulator' },
          { type: 'medical', description: 'Medical Incident #3', location: { zone: 'East_Zone', latitude: 12.972, longitude: 77.591 }, severity: 7, urgency: 7, impact: 6, priorityScore: 7.0, status: 'open', requiredResourceTypes: ['ambulance'], source: 'simulator' },
          { type: 'medical', description: 'Medical Incident #4', location: { zone: 'West_Zone', latitude: 12.974, longitude: 77.592 }, severity: 6, urgency: 6, impact: 5, priorityScore: 6.0, status: 'open', requiredResourceTypes: ['ambulance'], source: 'simulator' },
          { type: 'medical', description: 'Medical Incident #5', location: { zone: 'Central_Zone', latitude: 12.973, longitude: 77.593 }, severity: 5, urgency: 5, impact: 4, priorityScore: 5.0, status: 'open', requiredResourceTypes: ['ambulance'], source: 'simulator' }
        ];
        break;

      case 'scenario_d': // Blocked Route
        incidentsToInsert = [
          { _id: '661000000000000000000001', type: 'medical', description: 'Injured person at Science Block', location: { zone: 'West_Zone', building: 'Science_Block', latitude: 12.9740, longitude: 77.5920 }, severity: 8, urgency: 9, impact: 7, priorityScore: 8.5, status: 'open', requiredResourceTypes: ['ambulance'], source: 'simulator' }
        ];
        await updateBlockedRoutes([
          { routeId: 'route_north_west', fromZone: 'North_Zone', toZone: 'West_Zone', status: 'blocked', blockedByIncidentId: 'FIRE_BLOCK' }
        ]);
        break;

      case 'scenario_e': // Cascading Incident
        incidentsToInsert = [
          { _id: '661000000000000000000001', type: 'fire', description: 'Major Chemistry Lab Fire', location: { zone: 'West_Zone', building: 'Chemistry_Building', latitude: 12.9745, longitude: 77.5925 }, severity: 9, urgency: 9, impact: 9, priorityScore: 9.0, status: 'open', requiredResourceTypes: ['fire_truck', 'hazmat_unit'], source: 'simulator' },
          { _id: '661000000000000000000002', type: 'hazmat', description: 'Chemical Spill cascading from Chemistry Lab', location: { zone: 'West_Zone', building: 'Chemistry_Building', latitude: 12.9746, longitude: 77.5926 }, severity: 8, urgency: 8, impact: 9, priorityScore: 8.3, status: 'open', requiredResourceTypes: ['hazmat_unit'], source: 'simulator' }
        ];
        break;

      case 'scenario_f': // AI Failure Test
        incidentsToInsert = [
          { _id: '661000000000000000000001', type: 'security', description: 'Unidentified package near Administration', location: { zone: 'Central_Zone', building: 'Admin_Block', latitude: 12.9735, longitude: 77.5935 }, severity: 7, urgency: 7, impact: 8, priorityScore: 7.4, status: 'open', requiredResourceTypes: ['security_patrol'], source: 'simulator' }
        ];
        break;

      default:
        return res.status(400).json({ error: 'Unknown scenario ID' });
    }

    await ResourceModel.insertMany(resourcesToInsert);
    const createdIncidents = await IncidentModel.insertMany(incidentsToInsert);
    await incrementStateVersion();
    await logAuditEvent('SCENARIO_TRIGGERED', scenarioId, null, { incidentCount: incidentsToInsert.length }, 'simulator');

    triggerReplanning(`SCENARIO_${scenarioId.toUpperCase()}`);

    res.json({ message: `Scenario ${scenarioId} loaded successfully`, incidents: createdIncidents });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load scenario' });
  }
});

simulatorRouter.post('/chaos', async (req: Request, res: Response) => {
  try {
    const count = Number(req.body.count || 5);
    const types: Array<'medical' | 'fire' | 'security' | 'hazmat'> = ['medical', 'fire', 'security', 'hazmat'];
    const zones = ['North_Zone', 'South_Zone', 'East_Zone', 'West_Zone', 'Central_Zone'];

    const injected = [];
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const severity = Math.floor(Math.random() * 5) + 5;
      const urgency = Math.floor(Math.random() * 5) + 5;
      const impact = Math.floor(Math.random() * 5) + 5;

      const inc = await IncidentModel.create({
        type,
        description: `[CHAOS] Simulated ${type} event at ${zone}`,
        location: { zone, latitude: 12.97 + Math.random() * 0.01, longitude: 77.59 + Math.random() * 0.01 },
        severity,
        urgency,
        impact,
        priorityScore: Number(((0.45 * urgency) + (0.35 * impact)).toFixed(2)),
        status: 'open',
        requiredResourceTypes: type === 'medical' ? ['ambulance'] : type === 'fire' ? ['fire_truck'] : type === 'security' ? ['security_patrol'] : ['hazmat_unit'],
        source: 'simulator'
      });
      injected.push(inc);
    }

    await incrementStateVersion();
    await logAuditEvent('CHAOS_MODE_TRIGGERED', 'chaos', null, { injectedCount: count }, 'simulator');
    triggerReplanning('CHAOS_MODE_INJECTION');

    res.json({ message: `Injected ${count} chaos incidents`, injectedIncidents: injected.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
