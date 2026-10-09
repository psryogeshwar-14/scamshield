FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy prisma schema and run client generation
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application source code
COPY src ./src/

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:./dev.db"

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
