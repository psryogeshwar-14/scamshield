import app from './app.js';
import {
  PORT,
  NODE_ENV,
  CLIENT_URL,
  isGeminiConfigured,
  isSafeBrowsingConfigured,
} from './config/index.js';

const server = app.listen(PORT, () => {
  const geminiLive = isGeminiConfigured();
  const sbLive = isSafeBrowsingConfigured();

  console.log(`\n🛡️  ScamShield API running on http://localhost:${PORT}`);
  console.log(`   Health check   → http://localhost:${PORT}/api/health`);
  console.log(`   Client Origin  → ${CLIENT_URL}`);
  console.log(`   Gemini AI Key  → ${geminiLive ? 'Configured ✅ (Gemini 2.5 Flash)' : 'Unset (Deterministic Engine ⚠️)'}`);
  console.log(`   Safe Browsing  → ${sbLive ? 'Configured ✅ (Live Lookup v4)' : 'Unset (Deterministic Engine ⚠️)'}`);
  console.log(`   Environment    → ${NODE_ENV}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down...');
  server.close(() => {
    process.exit(0);
  });
});

export default app;
