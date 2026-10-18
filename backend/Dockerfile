# ────────────────────────────────────────────────────────
# PARKO Backend — Production Multi-stage Dockerfile
# Standard: Enterprise Security, Non-Root, Zero-Lag Alpine
# ────────────────────────────────────────────────────────

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Install production-only dependencies
RUN npm ci --omit=dev && cp -R node_modules /prod_modules
# Install all dependencies (including dev for building)
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npx tsc prisma/seed.ts --outDir dist/prisma --skipLibCheck --module commonjs --target es2021 --moduleResolution node

# Stage 3: Production Runner
FROM node:20-alpine AS production
WORKDIR /app

# Install openssl for Prisma and dumb-init for proper PID 1 signal handling
RUN apk add --no-cache openssl dumb-init

# Copy node_modules & prebuilt artifacts
COPY --from=deps /prod_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=build /app/prisma ./prisma
COPY package*.json ./
COPY docker-entrypoint.sh ./

# Create directories and assign non-root permissions
RUN chmod +x docker-entrypoint.sh && \
    mkdir -p uploads logs && \
    chown -R node:node /app

USER node
ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--", "./docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
