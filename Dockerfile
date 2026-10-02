# ---------------------------------------------------
# Stage 1: Build & Prisma Engine Generation
# ---------------------------------------------------
FROM node:22-alpine AS builder

# Install OpenSSL and libc6-compat for Prisma native engine
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy source including prisma/ schema
COPY . .

# Generate Prisma client specifically for the Alpine Linux runtime
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Ensure public directory exists so the multi-stage COPY does not fail
RUN mkdir -p /app/public

# ---------------------------------------------------
# Stage 2: Hardened Runtime
# ---------------------------------------------------
FROM node:22-alpine AS runner

# Install OpenSSL in the runner image so Prisma query engine can link against it
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy dependencies and generated prisma binaries
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next ./.next

# Copy prisma schema if migrations/queries run at runtime
COPY --from=builder --chown=node:node /app/prisma ./prisma

USER node

EXPOSE 3000

CMD ["npm", "start"]