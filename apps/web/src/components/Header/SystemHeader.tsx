import React from 'react';
import { useCrisisStore } from '../../store/crisisStore';
import { Shield, Cpu, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

export const SystemHeader: React.FC = () => {
  const { aiStatus, isRecalculating, stateVersion, currentPlan, incidents, resources } = useCrisisStore();

  const activeIncidents = incidents.filter(i => i.status === 'open' || i.status === 'escalated').length;
  const availableResources = resources.filter(r => r.status === 'available').length;

  return (
    <header className="bg-dark-800 border-b border-dark-700 px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-red-950/60 border border-red-500/40 rounded-lg">
          <Shield className="w-6 h-6 text-red-500 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-100 flex items-center gap-2">
            CAMPUS CRISIS COMMAND CENTER
            <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-400 border border-blue-700/50">
              v{stateVersion}
            </span>
          </h1>
          <p className="text-xs text-gray-400">AI-Assisted Decision Support & Safety Validation Engine</p>
        </div>
      </div>

      <div className="flex items-center space-x-6 text-sm">
        {/* Active Incidents & Available Resources Pills */}
        <div className="flex items-center gap-4 bg-dark-900 px-3 py-1.5 rounded-lg border border-dark-700">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-gray-400">Incidents:</span>
            <span className="font-bold text-red-400">{activeIncidents}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs border-l border-dark-700 pl-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-gray-400">Available Fleet:</span>
            <span className="font-bold text-emerald-400">{availableResources}/{resources.length}</span>
          </div>
        </div>

        {/* AI & System Status Pill */}
        <div className="flex items-center gap-2">
          {aiStatus === 'ONLINE' ? (
            <div className="flex items-center gap-1.5 text-xs bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-lg font-medium">
              <Cpu className="w-4 h-4" />
              <span>GEMINI AI ONLINE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs bg-amber-950/60 border border-amber-500/40 text-amber-400 px-3 py-1.5 rounded-lg font-medium">
              <AlertTriangle className="w-4 h-4" />
              <span>DETERMINISTIC FALLBACK MODE</span>
            </div>
          )}

          {isRecalculating && (
            <div className="flex items-center gap-1.5 text-xs bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 px-3 py-1.5 rounded-lg">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>REPLANNING...</span>
            </div>
          )}
        </div>

        {/* Current Plan Badge */}
        {currentPlan && (
          <div className="text-xs bg-dark-900 border border-dark-700 px-3 py-1 rounded flex items-center gap-2">
            <span className="text-gray-400">Plan:</span>
            <span className="font-mono text-cyan-300">{currentPlan.planId.split('_')[1] || currentPlan.planId}</span>
            {currentPlan.validation.valid ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            )}
          </div>
        )}
      </div>
    </header>
  );
};
