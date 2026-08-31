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
  ENV NODE_ENV=production
  COPY package*.json ./
  RUN npm ci --omit=dev --ignore-scripts
  COPY --from=builder /app/dist ./dist
  COPY --from=builder /app/prisma ./prisma
  COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
  EXPOSE 4000
  CMD ["node", "dist/index.js"]