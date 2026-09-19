import React, { useEffect } from 'react';
import { SystemHeader } from './components/Header/SystemHeader';
import { IncidentFeed } from './components/Incidents/IncidentFeed';
import { CampusMap } from './components/Map/CampusMap';
import { ActionPlanPanel } from './components/ActionPlan/ActionPlanPanel';
import { SimulatorControls } from './components/Simulator/SimulatorControls';
import { useCrisisStore } from './store/crisisStore';
import { initSocketConnection } from './services/socket';

export const App: React.FC = () => {
  const { fetchState } = useCrisisStore();

  useEffect(() => {
    fetchState();
    initSocketConnection();
  }, [fetchState]);

  return (
    <div className="flex flex-col h-screen w-screen bg-dark-900 text-gray-100 overflow-hidden font-sans">
      <SystemHeader />

      {/* Main 3-Column Dashboard Body */}
      <main className="flex-1 grid grid-cols-12 gap-3 p-3 overflow-hidden">
        <div className="col-span-3 h-full overflow-hidden">
          <IncidentFeed />
        </div>
        <div className="col-span-5 h-full overflow-hidden">
          <CampusMap />
        </div>
        <div className="col-span-4 h-full overflow-hidden">
          <ActionPlanPanel />
        </div>
      </main>

      {/* Simulator Control Dock */}
      <footer className="px-3 pb-3">
        <SimulatorControls />
      </footer>
    </div>
  );
};

export default App;
