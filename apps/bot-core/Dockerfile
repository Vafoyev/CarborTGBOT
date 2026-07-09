# CarBor Bot - Production Dockerfile
FROM node:20-slim

# OpenSSL o'rnatish (Prisma mosligi uchun)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Source code
COPY src ./src

# Start
CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/index.js"]
