# OmniCheck Studio backend.
# Runs the TypeScript server with ts-node (the repo's own start path).
# NOTE: several backend services are plain .js files that tsc does not emit
# into dist/, so a `node dist/server.js` image would be missing them — that
# is why this image does not use the compiled output yet. See AUDIT-2026-10-24.md.
# Native modules (better-sqlite3, canvas, sharp, bcrypt) need a real install:
# do NOT use --ignore-scripts or the server crashes on the missing bindings.
FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ pkg-config libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV NODE_ENV=production
EXPOSE 3001
# JWT_SECRET (>=32 chars) and CORS_ORIGIN must be supplied by the environment.
CMD ["npx", "ts-node", "--transpile-only", "server.ts"]
