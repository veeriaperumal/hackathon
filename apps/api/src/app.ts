import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { incidentRouter } from './routes/incidents.js';
import { resourceRouter } from './routes/resources.js';
import { actionPlanRouter } from './routes/actionPlans.js';
import { simulatorRouter } from './routes/simulator.js';
import { getCurrentStateVersion } from './services/stateManager.js';

dotenv.config();

export const app = express();

// Ensure DB connection for serverless invocations
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in request middleware:', err);
    next();
  }
});

// Security Middleware
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

// Health Check (both /health and /api/health)
const healthHandler = async (req: express.Request, res: express.Response) => {
  const stateVersion = await getCurrentStateVersion();
  const geminiConfigured = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiStatus: geminiConfigured ? 'ONLINE' : 'FALLBACK_MODE',
    stateVersion
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
