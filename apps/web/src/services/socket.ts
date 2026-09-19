import { io, Socket } from 'socket.io-client';
import { useCrisisStore } from '../store/crisisStore';

let socket: Socket | null = null;

export function initSocketConnection() {
  if (socket) return socket;

  socket = io(window.location.origin, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10
  });

  socket.on('connect', () => {
    console.log('Socket connected to backend server.');
    socket?.emit('subscribe.dashboard');
  });

  socket.on('system.recalculating', (data) => {
    useCrisisStore.getState().setIsRecalculating(true);
    if (data.stateVersion) {
      useCrisisStore.getState().setStateVersion(data.stateVersion);
    }
  });

  socket.on('plan.generated', (data) => {
    useCrisisStore.getState().setIsRecalculating(false);
    if (data.actionPlan) {
      useCrisisStore.getState().setCurrentPlan(data.actionPlan);
    }
    useCrisisStore.getState().fetchState();
  });

  socket.on('plan.approved', () => {
    useCrisisStore.getState().fetchState();
  });

  socket.on('plan.rejected', () => {
    useCrisisStore.getState().fetchState();
  });

  socket.on('system.fallback', (data) => {
    useCrisisStore.getState().setAiStatus('FALLBACK_MODE');
    console.warn('System running in fallback mode:', data.reason);
  });

  socket.on('incident.created', () => useCrisisStore.getState().fetchState());
  socket.on('incident.updated', () => useCrisisStore.getState().fetchState());
  socket.on('resource.updated', () => useCrisisStore.getState().fetchState());

  return socket;
}
