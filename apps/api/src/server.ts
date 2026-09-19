import { createServer } from 'http';
import dotenv from 'dotenv';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { initSocketServer } from './sockets/index.js';
import { startPeriodicReplanning } from './services/orchestrator.js';
import { ResourceModel } from './models/Resource.js';

dotenv.config();

const httpServer = createServer(app);

// Initialize Socket.io
initSocketServer(httpServer);

const PORT = Number(process.env.PORT || 4000);

async function seedDefaultResourcesIfEmpty() {
  const count = await ResourceModel.countDocuments();
  if (count === 0) {
    console.log('Seeding initial campus resource fleet...');
    await ResourceModel.insertMany([
      { name: 'AMB-01', type: 'ambulance', status: 'available', location: { zone: 'North_Zone', building: 'Health_Center', latitude: 12.9716, longitude: 77.5946 }, capabilities: ['ambulance', 'medical_team'] },
      { name: 'AMB-02', type: 'ambulance', status: 'available', location: { zone: 'South_Zone', building: 'Sports_Complex', latitude: 12.9750, longitude: 77.5980 }, capabilities: ['ambulance', 'medical_team'] },
      { name: 'FIRE-01', type: 'fire_truck', status: 'available', location: { zone: 'East_Zone', building: 'Fire_Station', latitude: 12.9720, longitude: 77.5910 }, capabilities: ['fire_truck', 'hazmat_unit'] },
      { name: 'SEC-01', type: 'security_patrol', status: 'available', location: { zone: 'Central_Zone', building: 'Main_Gate', latitude: 12.9730, longitude: 77.5930 }, capabilities: ['security_patrol'] },
      { name: 'HAZMAT-01', type: 'hazmat_unit', status: 'available', location: { zone: 'West_Zone', building: 'Science_Block', latitude: 12.9740, longitude: 77.5920 }, capabilities: ['hazmat_unit', 'fire_truck'] }
    ]);
  }
}

async function start() {
  await connectDB();
  await seedDefaultResourcesIfEmpty();
  startPeriodicReplanning();

  httpServer.listen(PORT, () => {
    console.log(`Campus Crisis Express & Socket.io Server running on port ${PORT}`);
  });
}

start();
