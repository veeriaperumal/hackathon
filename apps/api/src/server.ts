import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initSocketServer } from './sockets/index.js';
import { incidentRouter } from './routes/incidents.js';
import { resourceRouter } from './routes/resources.js';
import { actionPlanRouter } from './routes/actionPlans.js';
import { simulatorRouter } from './routes/simulator.js';
import { startPeriodicReplanning } from './services/orchestrator.js';
import { getCurrentStateVersion } from './services/stateManager.js';
import { ResourceModel } from './models/Resource.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocketServer(httpServer);

// Security Middleware (Phase 11 Risk Hardening)
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests from this IP' }
});
app.use('/api/', limiter);

// API Routers
app.use('/api/incidents', incidentRouter);
app.use('/api/resources', resourceRouter);
app.use('/api/action-plans', actionPlanRouter);
app.use('/api/simulator', simulatorRouter);

// Health Check
app.get('/health', async (req, res) => {
  const stateVersion = await getCurrentStateVersion();
  const geminiConfigured = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiStatus: geminiConfigured ? 'ONLINE' : 'FALLBACK_MODE',
    stateVersion
  });
});

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
