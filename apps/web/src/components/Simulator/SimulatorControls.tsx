import React from 'react';
import { useCrisisStore } from '../../store/crisisStore';
import { Play, Zap, RotateCcw, Activity } from 'lucide-react';

export const SimulatorControls: React.FC = () => {
  const { loadScenario, triggerChaos, resetCampus, isRecalculating } = useCrisisStore();

  const scenarios = [
    { id: 'scenario_a', label: 'Scenario A: Single Medical Emergency' },
    { id: 'scenario_b', label: 'Scenario B: Competing Emergencies' },
    { id: 'scenario_c', label: 'Scenario C: Resource Exhaustion' },
    { id: 'scenario_d', label: 'Scenario D: Blocked Route' },
    { id: 'scenario_e', label: 'Scenario E: Cascading Incident' },
    { id: 'scenario_f', label: 'Scenario F: AI Failure Test' }
  ];

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Crisis Simulator Controls:</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            onClick={() => loadScenario(sc.id)}
            disabled={isRecalculating}
            className="bg-dark-900 hover:bg-dark-700 border border-dark-600 text-gray-300 disabled:opacity-50 text-[11px] font-medium px-2.5 py-1 rounded flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            <Play className="w-3 h-3 text-cyan-400" /> {sc.label.split(':')[0]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 border-l border-dark-700 pl-3">
        <button
          onClick={() => triggerChaos(5)}
          disabled={isRecalculating}
          className="bg-amber-950/70 hover:bg-amber-900 border border-amber-700 text-amber-300 disabled:opacity-50 text-[11px] font-bold px-3 py-1 rounded flex items-center gap-1 transition-colors"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> CHAOS MODE (+5)
        </button>
        <button
          onClick={() => resetCampus()}
          disabled={isRecalculating}
          className="bg-dark-900 hover:bg-dark-700 border border-dark-600 text-gray-400 hover:text-gray-200 disabled:opacity-50 text-[11px] font-medium px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> RESET
        </button>
      </div>
    </div>
  );
};
