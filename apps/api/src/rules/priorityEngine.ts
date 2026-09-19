export interface PriorityInput {
  urgency: number;      // 1-10
  impact: number;       // 1-10
  dependencyRisk: number; // 0-10
}

export function calculatePriorityScore(input: PriorityInput): number {
  const urgency = Math.min(10, Math.max(1, input.urgency));
  const impact = Math.min(10, Math.max(1, input.impact));
  const dependencyRisk = Math.min(10, Math.max(0, input.dependencyRisk));

  const score = (0.45 * urgency) + (0.35 * impact) + (0.20 * dependencyRisk);
  return Number(score.toFixed(2));
}

export function getUrgencyLevel(priorityScore: number): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
  if (priorityScore >= 8) return 'CRITICAL';
  if (priorityScore >= 6) return 'HIGH';
  if (priorityScore >= 3) return 'MODERATE';
  return 'LOW';
}
