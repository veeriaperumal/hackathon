import { buildDecisionContext } from '../services/contextAggregator.js';
import { callGeminiDecisionSupport } from './geminiClient.js';
import { validateAiPlanOutput } from './planValidator.js';
import { generateFallbackPlan } from '../rules/fallbackEngine.js';
import { ActionPlanModel } from '../models/ActionPlan.js';
import { logAuditEvent } from '../services/auditLogger.js';
import { broadcastSocketEvent } from '../sockets/index.js';
import { ActionPlan } from '@campus-crisis/shared';

const MAX_REPAIR_ATTEMPTS = 1;

export async function generateActionPlan(triggerReason: string): Promise<ActionPlan> {
  const context = await buildDecisionContext();
  broadcastSocketEvent('system.recalculating', { triggerReason, stateVersion: context.stateVersion });

  let finalPlanData: ActionPlan;

  // 1. Attempt Gemini Recommendation
  const geminiRes = await callGeminiDecisionSupport(context);

  if (geminiRes.success && geminiRes.parsedResponse) {
    let validationOutcome = validateAiPlanOutput(geminiRes.parsedResponse, context);

    // Attempt Repair if failed & retries remain
    if (!validationOutcome.valid && MAX_REPAIR_ATTEMPTS > 0) {
      console.warn('AI Output failed validation. Attempting repair prompt...');
      const repairInstruction = validationOutcome.reasonsToRepair?.join('\n');
      const repairRes = await callGeminiDecisionSupport(context, repairInstruction);
      if (repairRes.success && repairRes.parsedResponse) {
        validationOutcome = validateAiPlanOutput(repairRes.parsedResponse, context);
      }
    }

    if (validationOutcome.valid) {
      const parsed = geminiRes.parsedResponse;
      finalPlanData = {
        planId: `plan_ai_${Date.now()}_v${context.stateVersion}`,
        version: 1,
        stateVersion: context.stateVersion,
        generatedAt: new Date().toISOString(),
        trigger: triggerReason,
        status: 'pending_approval',
        executiveSummary: parsed.executiveSummary,
        incidentAnalysis: parsed.incidentAnalysis,
        dependencies: parsed.dependencies,
        resourceAllocation: parsed.resourceAllocation,
        steps: parsed.actionPlan,
        validation: validationOutcome.validationResult
      };
      await logAuditEvent('AI_PLAN_GENERATED', finalPlanData.planId, null, finalPlanData, 'gemini_ai');
    } else {
      console.warn('AI Output failed validation after repair. Falling back to deterministic engine.');
      broadcastSocketEvent('system.ai_error', { error: 'AI output failed safety validation' });
      finalPlanData = generateFallbackPlan(context, `AI Safety Validation Failed: ${validationOutcome.validationResult.errors.join('; ')}`);
      await logAuditEvent('FALLBACK_PLAN_GENERATED', finalPlanData.planId, null, finalPlanData, 'fallback_engine');
      broadcastSocketEvent('system.fallback', { reason: 'AI Safety Validation Failed' });
    }
  } else {
    // Gemini API call failed or unconfigured
    console.warn(`Gemini API unavailable (${geminiRes.error}). Running deterministic fallback mode.`);
    finalPlanData = generateFallbackPlan(context, `Gemini API Unavailable: ${geminiRes.error}`);
    await logAuditEvent('FALLBACK_PLAN_GENERATED', finalPlanData.planId, null, finalPlanData, 'fallback_engine');
    broadcastSocketEvent('system.fallback', { reason: geminiRes.error || 'AI Unavailable' });
  }

  // Mark all previous pending action plans as superseded
  await ActionPlanModel.updateMany(
    { status: 'pending_approval' },
    { $set: { status: 'superseded' } }
  );

  // Persist new action plan
  await ActionPlanModel.create(finalPlanData);

  // Broadcast real-time update
  broadcastSocketEvent('plan.generated', { actionPlan: finalPlanData });

  return finalPlanData;
}
