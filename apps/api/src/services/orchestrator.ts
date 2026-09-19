import { generateActionPlan } from '../ai/decisionEngine.js';

let debounceTimer: NodeJS.Timeout | null = null;
let isRecalculating = false;
let pendingTrigger: string | null = null;

const DEBOUNCE_MS = 1500;
const PERIODIC_INTERVAL_MS = Number(process.env.REPLAN_INTERVAL_SECONDS || 120) * 1000;

export function triggerReplanning(reason: string, entityId?: string) {
  const triggerTag = entityId ? `${reason}:${entityId}` : reason;

  if (isRecalculating) {
    pendingTrigger = triggerTag;
    return;
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    debounceTimer = null;
    isRecalculating = true;
    try {
      await generateActionPlan(triggerTag);
    } catch (err) {
      console.error('Orchestrator replanning error:', err);
    } finally {
      isRecalculating = false;
      if (pendingTrigger) {
        const nextTrigger = pendingTrigger;
        pendingTrigger = null;
        triggerReplanning(nextTrigger);
      }
    }
  }, DEBOUNCE_MS);
}

export function startPeriodicReplanning() {
  setInterval(() => {
    triggerReplanning('PERIODIC_REPLAN');
  }, PERIODIC_INTERVAL_MS);
}
