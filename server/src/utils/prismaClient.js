import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundledDbPath = path.resolve(__dirname, '../../prisma/dev.db');

const rawUrl = process.env.DATABASE_URL || 'file:./dev.db';
let datasourceUrl = rawUrl;

// Vercel Serverless / AWS Lambda Environment Handling:
// In serverless environments, the project filesystem is read-only. We copy the bundled
// pre-migrated SQLite database to /tmp so SQLite has full read/write permissions.
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const tmpDbPath = '/tmp/dev.db';
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
    try {
      if (!fs.existsSync(tmpDbPath)) {
        if (fs.existsSync(bundledDbPath)) {
          fs.copyFileSync(bundledDbPath, tmpDbPath);
        } else {
          fs.writeFileSync(tmpDbPath, '');
        }
      }
    } catch (err) {
      console.warn('[Prisma] Notice while preparing /tmp/dev.db on Vercel:', err?.message);
    }
    datasourceUrl = `file:${tmpDbPath}`;
  }
} else if (rawUrl.startsWith('file:') && !rawUrl.startsWith('file:/')) {
  datasourceUrl = `file:${bundledDbPath}`;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: datasourceUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
