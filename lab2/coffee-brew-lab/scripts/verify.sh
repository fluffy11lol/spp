#!/usr/bin/env bash
set -e

echo "======================================================"
echo "☕ Specialty Coffee BrewLab - Automated Verification Pipeline"
echo "======================================================"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo ""
echo "▶ 1. Type-checking & Testing Backend (Fastify + TypeScript)"
cd "$PROJECT_ROOT/server"
npx tsc --noEmit
npm run test:unit
echo "✔ Backend type-check and schema tests passed cleanly."

echo ""
echo "▶ 2. Type-checking & Building Frontend (React + Vite + Tailwind)"
cd "$PROJECT_ROOT/client"
npx tsc --noEmit
npm run build
echo "✔ Frontend type-check and Vite production build succeeded."

echo ""
echo "======================================================"
echo "🎉 ALL QUALITY GATES PASSED: 100% Ready for Production!"
echo "======================================================"
