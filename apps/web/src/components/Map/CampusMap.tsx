import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useCrisisStore } from '../../store/crisisStore';
import { MapPin } from 'lucide-react';

// Custom Leaflet Icons
const incidentIcon = L.divIcon({
  className: 'custom-incident-pin',
  html: `<div style="background-color:#ef4444; width:22px; height:22px; border-radius:50%; border:2px solid #ffffff; box-shadow:0 0 10px #ef4444; display:flex; align-items:center; justify-align:center; color:white; font-size:10px; font-weight:bold;">!</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

const resourceIcon = L.divIcon({
  className: 'custom-resource-pin',
  html: `<div style="background-color:#10b981; width:20px; height:20px; border-radius:4px; border:2px solid #ffffff; box-shadow:0 0 8px #10b981; display:flex; align-items:center; justify-align:center; color:white; font-size:9px; font-weight:bold;">R</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

export const CampusMap: React.FC = () => {
  const { incidents, resources, currentPlan } = useCrisisStore();

  // Extract active dispatches from current plan for polyline rendering
  const dispatchLines: Array<{ from: [number, number]; to: [number, number]; label: string }> = [];

  if (currentPlan && currentPlan.steps) {
    for (const step of currentPlan.steps) {
      if (step.actionType === 'DISPATCH' && step.assignedResourceId !== 'NONE') {
        const inc = incidents.find(i => i.id === step.targetIncidentId);
        const res = resources.find(r => r.id === step.assignedResourceId);
        if (inc && res) {
          dispatchLines.push({
            from: [res.location.latitude, res.location.longitude],
            to: [inc.location.latitude, inc.location.longitude],
            label: `${res.name} -> ${inc.type}`
          });
        }
      }
    }
  }

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-dark-700 flex justify-between items-center bg-dark-900/50">
        <h2 className="font-semibold text-sm text-gray-200 uppercase tracking-wider flex items-center gap-2">
          <MapPin className="w-4 h-4 text-cyan-400" />
          Interactive Campus Spatial View
        </h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Incident
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Resource
          </span>
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-4 h-0.5 bg-cyan-400"></span> Dispatch Route
          </span>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={[12.973, 77.593]}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="dark-tile-layer"
          />

          {/* Incident Pins */}
          {incidents.map((inc) => (
            <Marker
              key={inc.id}
              position={[inc.location.latitude, inc.location.longitude]}
              icon={incidentIcon}
            >
              <Popup className="dark-popup">
                <div className="text-xs space-y-1">
                  <div className="font-bold text-red-600 uppercase">{inc.type} Incident</div>
                  <div>{inc.description}</div>
                  <div className="text-gray-600">Location: {inc.location.building || inc.location.zone}</div>
                  <div className="font-medium text-amber-600">Priority: {inc.priorityScore}/10</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Resource Pins */}
          {resources.map((res) => (
            <Marker
              key={res.id}
              position={[res.location.latitude, res.location.longitude]}
              icon={resourceIcon}
            >
              <Popup>
                <div className="text-xs space-y-1">
                  <div className="font-bold text-emerald-600">{res.name} ({res.type})</div>
                  <div>Status: <span className="capitalize font-semibold">{res.status}</span></div>
                  <div>Zone: {res.location.zone}</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Dispatch Polylines */}
          {dispatchLines.map((line, idx) => (
            <Polyline
              key={idx}
              positions={[line.from, line.to]}
              pathOptions={{ color: '#06b6d4', weight: 3, dashArray: '6, 6' }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
