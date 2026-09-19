import { Router, Request, Response } from 'express';
import { ActionPlanModel } from '../models/ActionPlan.js';
import { ResourceModel } from '../models/Resource.js';
import { IncidentModel } from '../models/Incident.js';
import { OperatorDecisionSchema } from '@campus-crisis/shared';
import { getCurrentStateVersion, incrementStateVersion } from '../services/stateManager.js';
import { logAuditEvent } from '../services/auditLogger.js';
import { broadcastSocketEvent } from '../sockets/index.js';
import { triggerReplanning } from '../services/orchestrator.js';

export const actionPlanRouter = Router();

actionPlanRouter.get('/', async (req: Request, res: Response) => {
  try {
    const plans = await ActionPlanModel.find().sort({ createdAt: -1 }).limit(20);
    res.json({ actionPlans: plans });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch action plans' });
  }
});

actionPlanRouter.get('/latest', async (req: Request, res: Response) => {
  try {
    const latestPlan = await ActionPlanModel.findOne({ status: { $in: ['pending_approval', 'approved'] } }).sort({ createdAt: -1 });
    res.json({ actionPlan: latestPlan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch latest action plan' });
  }
});

actionPlanRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const plan = await ActionPlanModel.findOne({ planId: req.params.id });
    if (!plan) {
      return res.status(404).json({ error: 'Action plan not found' });
    }
    res.json({ actionPlan: plan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch action plan' });
  }
});

actionPlanRouter.post('/:id/decision', async (req: Request, res: Response) => {
  try {
    const parsed = OperatorDecisionSchema.parse(req.body);
    const plan = await ActionPlanModel.findOne({ planId: req.params.id });

    if (!plan) {
      return res.status(404).json({ error: 'Action plan not found' });
    }

    if (plan.status !== 'pending_approval') {
      return res.status(400).json({ error: `Plan cannot be decided upon because status is '${plan.status}'` });
    }

    // Phase 7: Concurrency & Stale-Plan Validation
    const currentStateVersion = await getCurrentStateVersion();
    if (plan.stateVersion !== currentStateVersion) {
      plan.status = 'superseded';
      await plan.save();
      await logAuditEvent('STALE_PLAN_REJECTED', plan.planId, { planVersion: plan.stateVersion }, { currentVersion: currentStateVersion }, 'system');
      return res.status(409).json({
        error: 'STALE_PLAN',
        message: `Plan state version (${plan.stateVersion}) does not match current campus state version (${currentStateVersion}). Replanning required.`
      });
    }

    plan.operatorDecision = {
      decision: parsed.decision,
      timestamp: new Date().toISOString(),
      operatorNotes: parsed.operatorNotes
    };

    const dispatchedResourceIds: string[] = [];

    if (parsed.decision === 'approve') {
      plan.status = 'approved';

      const stepsToApply = parsed.modifiedSteps || plan.steps;

      // Simulated Dispatch Execution: Update Resource and Incident database states
      for (const step of stepsToApply) {
        if (step.actionType === 'DISPATCH' && step.assignedResourceId !== 'NONE') {
          const resource = await ResourceModel.findById(step.assignedResourceId);
          if (resource && resource.status === 'available') {
            const oldResourceState = resource.toObject();
            resource.status = 'dispatched';
            resource.assignedIncidentId = step.targetIncidentId;
            resource.lastUpdatedAt = new Date().toISOString();
            await resource.save();
            dispatchedResourceIds.push(resource.id);

            await logAuditEvent('SIMULATED_DISPATCH', resource.id, oldResourceState, resource.toObject(), 'operator');
          }

          // Update Incident status to in_progress
          const incident = await IncidentModel.findById(step.targetIncidentId);
          if (incident && incident.status === 'open') {
            incident.status = 'in_progress';
            await incident.save();
          }
        }
      }

      await incrementStateVersion();
      await logAuditEvent('PLAN_APPROVED', plan.planId, null, { decision: 'approve', dispatchedResourceIds }, 'operator');
      broadcastSocketEvent('plan.approved', { planId: plan.planId, dispatchedResourceIds });
    } else if (parsed.decision === 'reject') {
      plan.status = 'rejected';
      await logAuditEvent('PLAN_REJECTED', plan.planId, null, { decision: 'reject', notes: parsed.operatorNotes }, 'operator');
      broadcastSocketEvent('plan.rejected', { planId: plan.planId });

      // Trigger replan on rejection
      triggerReplanning('OPERATOR_REJECTED_PLAN');
    }

    await plan.save();

    res.json({ actionPlan: plan, dispatchedResources: dispatchedResourceIds });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to process decision' });
  }
});
