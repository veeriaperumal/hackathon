import React, { useState } from 'react';
import { useCrisisStore } from '../../store/crisisStore';
import { X, Plus, AlertCircle, MapPin, Sliders } from 'lucide-react';
import { IncidentType, ResourceType } from '@campus-crisis/shared';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({ isOpen, onClose }) => {
  const { fetchState } = useCrisisStore();

  const [type, setType] = useState<IncidentType>('medical');
  const [description, setDescription] = useState('');
  const [zone, setZone] = useState('Central_Zone');
  const [building, setBuilding] = useState('Library');
  const [severity, setSeverity] = useState(8);
  const [urgency, setUrgency] = useState(8);
  const [impact, setImpact] = useState(7);
  const [requiredResources, setRequiredResources] = useState<ResourceType[]>(['ambulance']);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleResourceToggle = (resType: ResourceType) => {
    if (requiredResources.includes(resType)) {
      setRequiredResources(requiredResources.filter(r => r !== resType));
    } else {
      setRequiredResources([...requiredResources, resType]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const zoneCoords: Record<string, { lat: number; lon: number }> = {
      North_Zone: { lat: 12.9716, lon: 77.5946 },
      South_Zone: { lat: 12.9750, lon: 77.5980 },
      East_Zone: { lat: 12.9720, lon: 77.5910 },
      West_Zone: { lat: 12.9740, lon: 77.5920 },
      Central_Zone: { lat: 12.9732, lon: 77.5932 }
    };

    const coords = zoneCoords[zone] || zoneCoords.Central_Zone;

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          description: description || `Reported ${type} incident at ${building || zone}`,
          location: {
            zone,
            building: building || zone,
            latitude: coords.lat + (Math.random() * 0.001 - 0.0005),
            longitude: coords.lon + (Math.random() * 0.001 - 0.0005)
          },
          severity: Number(severity),
          urgency: Number(urgency),
          impact: Number(impact),
          requiredResourceTypes: requiredResources.length > 0 ? requiredResources : [type === 'medical' ? 'ambulance' : type === 'fire' ? 'fire_truck' : type === 'security' ? 'security_patrol' : 'hazmat_unit'],
          source: 'operator'
        })
      });

      if (response.ok) {
        await fetchState();
        onClose();
        setDescription('');
      } else {
        const data = await response.json();
        alert(`Failed to create incident: ${data.error}`);
      }
    } catch (err) {
      console.error('Create incident error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-dark-700 bg-dark-900 flex justify-between items-center">
          <h2 className="font-bold text-sm text-gray-100 flex items-center gap-2 uppercase tracking-wide">
            <AlertCircle className="w-4 h-4 text-red-500" /> Report New Campus Incident
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          {/* Type & Zone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Incident Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IncidentType)}
                className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-gray-200 font-medium focus:border-red-500 focus:outline-none"
              >
                <option value="medical">🚨 Medical Emergency</option>
                <option value="fire">🔥 Fire / Explosion</option>
                <option value="security">🛡️ Security Breach</option>
                <option value="hazmat">☣️ Hazmat Spill</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Campus Zone</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-gray-200 font-medium focus:border-cyan-500 focus:outline-none"
              >
                <option value="North_Zone">North Zone (Health & Science)</option>
                <option value="South_Zone">South Zone (Sports Complex)</option>
                <option value="East_Zone">East Zone (Dormitories)</option>
                <option value="West_Zone">West Zone (Engineering)</option>
                <option value="Central_Zone">Central Zone (Main Library & Admin)</option>
              </select>
            </div>
          </div>

          {/* Building & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Specific Building / Location</label>
              <input
                type="text"
                placeholder="e.g. Science Block, Cafeteria Floor 2..."
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-gray-200 focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 font-semibold">Incident Details & Situation Notes</label>
              <textarea
                placeholder="Describe nature of emergency, casualties, immediate hazards..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-dark-900 border border-dark-600 rounded p-2 text-gray-200 focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Sliders: Urgency, Severity, Impact */}
          <div className="bg-dark-900/60 p-3 rounded-lg border border-dark-700 space-y-2">
            <div className="font-semibold text-gray-300 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-400" /> Incident Assessment Parameters
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-gray-400 flex justify-between">
                  <span>Urgency:</span> <span className="font-bold text-red-400">{urgency}/10</span>
                </label>
                <input type="range" min="1" max="10" value={urgency} onChange={(e) => setUrgency(Number(e.target.value))} className="w-full accent-red-500" />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 flex justify-between">
                  <span>Severity:</span> <span className="font-bold text-amber-400">{severity}/10</span>
                </label>
                <input type="range" min="1" max="10" value={severity} onChange={(e) => setSeverity(Number(e.target.value))} className="w-full accent-amber-500" />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 flex justify-between">
                  <span>Impact:</span> <span className="font-bold text-cyan-400">{impact}/10</span>
                </label>
                <input type="range" min="1" max="10" value={impact} onChange={(e) => setImpact(Number(e.target.value))} className="w-full accent-cyan-500" />
              </div>
            </div>
          </div>

          {/* Required Resource Capabilities */}
          <div>
            <label className="block text-gray-400 mb-1.5 font-semibold">Required Resource Types</label>
            <div className="flex flex-wrap gap-2">
              {(['ambulance', 'fire_truck', 'security_patrol', 'hazmat_unit', 'medical_team'] as ResourceType[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => handleResourceToggle(r)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                    requiredResources.includes(r)
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                      : 'bg-dark-900 text-gray-400 border-dark-600 opacity-60'
                  }`}
                >
                  {requiredResources.includes(r) ? '✓ ' : '+ '}{r}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-dark-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-dark-900 hover:bg-dark-700 text-gray-400 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 shadow-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> SUBMIT INCIDENT & REPLAN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
