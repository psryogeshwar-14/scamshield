import { NODE_ENV, isGeminiConfigured, isSafeBrowsingConfigured } from '../config/index.js';

/**
 * Controller for GET /api/health
 */
export function getHealth(req, res) {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'ScamShield API',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      integrations: {
        geminiAi: isGeminiConfigured() ? 'live' : 'heuristic_fallback',
        safeBrowsing: isSafeBrowsingConfigured() ? 'live' : 'unavailable',
      },
      requestId: req.id,
    },
  });
}

export default {
  getHealth,
};
