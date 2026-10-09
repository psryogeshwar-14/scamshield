import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { CLIENT_URL } from './config/index.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';

import healthRouter from './routes/health.js';
import analyzeRouter from './routes/analyze.js';
import historyRouter from './routes/history.js';

const app = express();

// ── Security Headers (OWASP) ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", CLIENT_URL],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── CORS Configuration ──────────────────────────────────────────────────────
const allowedOrigins = [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
  })
);

// ── Request Body Size Limits & Parsing ──────────────────────────────────────
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ── Correlation & Diagnostics ───────────────────────────────────────────────
app.use(requestIdMiddleware);
app.use(requestLogger);

// ── Route Mounts ────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/history', historyRouter);

// ── 404 & Centralized Error Handler ─────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
