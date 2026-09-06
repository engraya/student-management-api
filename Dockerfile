# =========================
# Dependencies
# =========================
FROM node:24-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps


# =========================
# Build
# =========================
FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build


# =========================
# Production
# =========================
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma.config.ts ./

RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup

USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
