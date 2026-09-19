import React, { useState } from 'react';
import { useCrisisStore } from '../../store/crisisStore';
import { AlertCircle, Flame, ShieldAlert, Biohazard, MapPin, Plus } from 'lucide-react';
import { Incident } from '@campus-crisis/shared';
import { NewIncidentModal } from './NewIncidentModal';

export const IncidentFeed: React.FC = () => {
  const { incidents } = useCrisisStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getIncidentIcon = (type: Incident['type']) => {
    switch (type) {
      case 'medical': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'fire': return <Flame className="w-4 h-4 text-amber-400" />;
      case 'security': return <ShieldAlert className="w-4 h-4 text-blue-400" />;
      case 'hazmat': return <Biohazard className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getPriorityBadge = (score?: number) => {
    const p = score || 0;
    if (p >= 8) return <span className="bg-red-950 text-red-400 border border-red-800 text-xs px-2 py-0.5 rounded font-bold">CRITICAL ({p})</span>;
    if (p >= 6) return <span className="bg-amber-950 text-amber-400 border border-amber-800 text-xs px-2 py-0.5 rounded font-bold">HIGH ({p})</span>;
    if (p >= 3) return <span className="bg-blue-950 text-blue-400 border border-blue-800 text-xs px-2 py-0.5 rounded font-bold">MODERATE ({p})</span>;
    return <span className="bg-gray-800 text-gray-400 border border-gray-700 text-xs px-2 py-0.5 rounded font-bold">LOW ({p})</span>;
  };

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
        <h2 className="font-semibold text-sm text-gray-200 uppercase tracking-wider flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          Active Incidents ({incidents.length})
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Report Incident
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {incidents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-xs space-y-2">
            <p>No active campus incidents reported.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-cyan-400 hover:underline font-medium text-xs"
            >
              + Report New Incident
            </button>
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              className={`p-3 rounded-lg border transition-all ${
                inc.status === 'open'
                  ? 'bg-dark-900 border-red-900/60 hover:border-red-600/80 shadow-md'
                  : 'bg-dark-900/40 border-dark-700 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {getIncidentIcon(inc.type)}
                  <span className="font-medium text-sm text-gray-100 uppercase tracking-tight">{inc.type} Incident</span>
                </div>
                {getPriorityBadge(inc.priorityScore)}
              </div>

              <p className="text-xs text-gray-300 mb-2">{inc.description}</p>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-dark-800">
                <div className="flex items-center gap-1 text-cyan-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{inc.location.building || inc.location.zone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Status:</span>
                  <span className={`capitalize font-medium ${inc.status === 'open' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {inc.status}
                  </span>
                </div>
              </div>

              {inc.requiredResourceTypes && inc.requiredResourceTypes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {inc.requiredResourceTypes.map((req, idx) => (
                    <span key={idx} className="text-[10px] bg-dark-800 text-gray-300 border border-dark-600 px-1.5 py-0.5 rounded">
                      Req: {req}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <NewIncidentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
