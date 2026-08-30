import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from './config/env.js';
import { connectDB, isMongoActive, getMongoDetails } from './config/db.js';
import { initSocket } from './config/socket.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

import { authRoutes } from './routes/authRoutes.js';
import { dashboardRoutes } from './routes/dashboardRoutes.js';
import { responsibilityRoutes } from './routes/responsibilityRoutes.js';
import { sourceRoutes } from './routes/sourceRoutes.js';
import { processingRoutes } from './routes/processingRoutes.js';
import { integrationRoutes } from './routes/integrationRoutes.js';
import { documentRoutes } from './routes/documentRoutes.js';
import { assistantRoutes } from './routes/assistantRoutes.js';
import { notificationRoutes } from './routes/notificationRoutes.js';
import { activityRoutes } from './routes/activityRoutes.js';

const app = express();
const server = http.createServer(app);

// 1. Initialize Socket.IO
initSocket(server);

// 2. Global Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Dev permissive
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// 3. Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'development' ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.nodeEnv === 'development',
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
});

// 4. API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/responsibilities', responsibilityRoutes);
app.use('/api/sources', sourceRoutes);
app.use('/api/processing', processingRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);

// 5. Health Heartbeat Endpoint
app.get('/api/health', (req, res) => {
  const dbDetails = getMongoDetails();
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'LifeOS Backend Engine',
    database: dbDetails.type,
    databaseDetails: dbDetails,
    ai: {
      openRouter: !!config.ai.openRouterApiKey,
      gemini: !!config.ai.geminiApiKey,
      ruleEngine: 'always-active',
      langGraph: 'available',
    },
    googleOAuth: !!config.google.clientId,
  });
});

// 6. Centralized Error Middleware
app.use(errorMiddleware);

// 7. Connect DB & Listen
async function startServer() {
  await connectDB();
  const PORT = config.port;
  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  🧠 LifeOS Platform Server running on port ${PORT}`);
    console.log(`  🔗 Client URL: ${config.clientUrl}`);
    console.log(`  🛡️  Security: Helmet & JWT Active`);
    console.log(`  🤖 AI Tier: OpenRouter -> Gemini -> Rule-Based Engine`);
    console.log(`  ⚡ Real-Time: Socket.IO Stream Ready`);
    console.log(`======================================================\n`);
  });
}

startServer();

export { app, server };
