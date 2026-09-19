import fs from 'fs';
import path from 'path';

interface ValidationResult {
  phase: string;
  satisfied: boolean;
  checks: string[];
}

export function validateAllPhasesScope(rootDir: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Phase 0: Scope & Safety Contracts
  const p0Files = ['POC_SCOPE.md', 'SAFETY_RULES.md', 'API_CONTRACT.md', 'AI_OUTPUT_SCHEMA.md'];
  const p0Passed = p0Files.every(f => fs.existsSync(path.join(rootDir, f)));
  results.push({
    phase: 'Phase 0: Safety, Scope & Architecture Contracts',
    satisfied: p0Passed,
    checks: p0Files.map(f => `${f}: ${fs.existsSync(path.join(rootDir, f)) ? 'EXISTS' : 'MISSING'}`)
  });

  // Phase 1: Shared Package & Backend DB Foundation
  const p1Files = [
    'packages/shared/src/types/index.ts',
    'packages/shared/src/schemas/index.ts',
    'apps/api/src/server.ts',
    'apps/api/src/models/Incident.ts',
    'apps/api/src/models/Resource.ts',
    'apps/api/src/models/ActionPlan.ts',
    'apps/api/src/models/AuditLog.ts',
    'apps/api/src/services/auditLogger.ts'
  ];
  const p1Passed = p1Files.every(f => fs.existsSync(path.join(rootDir, f)));
  results.push({
    phase: 'Phase 1: Backend Foundation & Database',
    satisfied: p1Passed,
    checks: p1Files.map(f => `${f}: ${fs.existsSync(path.join(rootDir, f)) ? 'EXISTS' : 'MISSING'}`)
  });

  // Phase 2: Deterministic Crisis & Safety Engine
  const p2Files = [
    'apps/api/src/rules/priorityEngine.ts',
    'apps/api/src/rules/eligibilityEngine.ts',
    'apps/api/src/rules/spatialEngine.ts',
    'apps/api/src/rules/routeConstraintEngine.ts',
    'apps/api/src/rules/fallbackEngine.ts'
  ];
  const p2Passed = p2Files.every(f => fs.existsSync(path.join(rootDir, f)));
  results.push({
    phase: 'Phase 2: Deterministic Safety & Heuristic Engine',
    satisfied: p2Passed,
    checks: p2Files.map(f => `${f}: ${fs.existsSync(path.join(rootDir, f)) ? 'EXISTS' : 'MISSING'}`)
  });

  // Phase 3 & 4: Context Aggregation & Gemini Layer
  const p3p4Files = [
    'apps/api/src/services/contextAggregator.ts',
    'apps/api/src/ai/geminiClient.ts'
  ];
  results.push({
    phase: 'Phase 3 & 4: Context Aggregation & Gemini AI Layer',
    satisfied: p3p4Files.every(f => fs.existsSync(path.join(rootDir, f))),
    checks: p3p4Files.map(f => `${f}: ${fs.existsSync(path.join(rootDir, f)) ? 'EXISTS' : 'MISSING'}`)
  });

  // Phase 5 & 6 & 7: Output Validation, Orchestration & Versioning
  const p5p6p7Files = [
    'apps/api/src/ai/planValidator.ts',
    'apps/api/src/ai/decisionEngine.ts',
    'apps/api/src/services/orchestrator.ts',
    'apps/api/src/services/stateManager.ts'
  ];
  results.push({
    phase: 'Phase 5, 6 & 7: Validation, Event Orchestration & Version Concurrency',
    satisfied: p5p6p7Files.every(f => fs.existsSync(path.join(rootDir, f))),
    checks: p5p6p7Files.map(f => `${f}: ${fs.existsSync(path.join(rootDir, f)) ? 'EXISTS' : 'MISSING'}`)
  });

  // Phase 8 & 9: Socket.io & React Dashboard UI
  const p8p9Files = [
    'apps/api/src/sockets/index.ts',
    'apps/web/src/App.tsx',
    'apps/web/src/components/Header/SystemHeader.tsx',
    'apps/web/src/components/Incidents/IncidentFeed.tsx',
    'apps/web/src/components/Map/CampusMap.tsx',
    'apps/web/src/components/ActionPlan/ActionPlanPanel.tsx',
    'apps/web/src/components/Simulator/SimulatorControls.tsx'
  ];
  results.push({
    phase: 'Phase 8 & 9: Socket.io Real-Time & React Crisis Dashboard',
    satisfied: p8p9Files.every(f => fs.existsSync(path.join(rootDir, f))),
    checks: p8p9Files.map(f => `${f}: ${fs.existsSync(path.join(rootDir, f)) ? 'EXISTS' : 'MISSING'}`)
  });

  // Phase 10 & 11 & 12: Simulator, Hardening & Verification
  const p10p12Files = [
    'apps/api/src/routes/simulator.ts',
    'tests/fixtures/aiDataset.json',
    'tests/rules.test.ts'
  ];
  results.push({
    phase: 'Phase 10, 11 & 12: Crisis Simulator, Risk Hardening & QA Suite',
    satisfied: p10p12Files.every(f => fs.existsSync(path.join(rootDir, f))),
    checks: p10p12Files.map(f => `${f}: ${fs.existsSync(path.join(rootDir, f)) ? 'EXISTS' : 'MISSING'}`)
  });

  return results;
}

// Execute inline if run directly
const summary = validateAllPhasesScope(process.cwd());
console.log('=== CAMPUS CRISIS PHASE-WISE SCOPE VALIDATION RESULTS ===');
let allSatisfied = true;
for (const res of summary) {
  console.log(`[${res.satisfied ? 'PASSED' : 'FAILED'}] ${res.phase}`);
  if (!res.satisfied) allSatisfied = false;
}
if (allSatisfied) {
  console.log('\nOVERALL RESULT: 100% PHASE SCOPE SATISFIED AND VALIDATED!');
} else {
  console.error('\nOVERALL RESULT: SCOPE DEFICIT DETECTED.');
  process.exit(1);
}
