# ---- Build stage ----
  FROM node:24-slim AS builder
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci
  COPY . .
  RUN npx prisma generate
  RUN npm run build
  
  # ---- Runtime stage ----
    FROM node:24-slim AS runtime
    WORKDIR /app
    RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
    ENV NODE_ENV=production
    COPY package*.json ./
    RUN npm ci --omit=dev --ignore-scripts
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/prisma ./prisma
    COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
    EXPOSE 4000
    CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]