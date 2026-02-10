# Production Dockerfile - Multi-stage build
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Builder stage
FROM base AS builder
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

RUN npm ci --only=production && \
    npm cache clean --force

WORKDIR /app/apps/backend
RUN npm run build

# Production stage
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/main.js"]
