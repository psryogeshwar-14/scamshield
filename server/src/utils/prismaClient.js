import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const absoluteDbPath = path.resolve(__dirname, '../../prisma/dev.db');

const rawUrl = process.env.DATABASE_URL || 'file:./dev.db';
let datasourceUrl = rawUrl;

// If a relative sqlite file path is provided, resolve to absolute server/prisma/dev.db
if (rawUrl.startsWith('file:') && !rawUrl.startsWith('file:/')) {
  datasourceUrl = `file:${absoluteDbPath}`;
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
