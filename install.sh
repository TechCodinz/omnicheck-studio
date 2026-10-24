#!/bin/bash
# OmniCheck Studio — install THIS repository.
# The previous version of this script did not install the repo at all: it
# scaffolded a brand-new create-react-app project in a different folder and
# installed packages the code does not use. Rewritten 2026-10-24.
set -e
cd "$(dirname "$0")"

echo "OmniCheck Studio installation"
echo "============================="

command -v node >/dev/null 2>&1 || { echo "Node.js 20+ is required."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required."; exit 1; }

echo "Installing backend dependencies (native modules will build)..."
(cd backend && npm ci --no-audit --no-fund)

echo "Installing frontend dependencies..."
(cd frontend && npm ci --no-audit --no-fund)

if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "Created .env from .env.example."
  echo "IMPORTANT: set a real JWT_SECRET in .env before starting the backend:"
  echo "  JWT_SECRET=$(openssl rand -hex 32)"
fi

echo ""
echo "Done. Start the app:"
echo "  Backend : cd backend && npm run dev    # http://localhost:3001 (needs JWT_SECRET)"
echo "  Frontend: cd frontend && npm start      # http://localhost:3000"
echo "Or with Docker: docker compose up --build   (requires JWT_SECRET in .env)"
