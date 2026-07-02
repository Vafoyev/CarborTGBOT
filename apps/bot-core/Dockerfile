# CarBor Bot - Production Dockerfile
FROM node:20-alpine

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
CMD ["node", "src/index.js"]
