#!/bin/bash

# CalTrack Setup Script
# This script sets up the local development environment

set -e  # Exit on error

echo "🚀 CalTrack Development Environment Setup"
echo "=========================================="
echo ""

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Please install Node.js 20+"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Please install Docker Desktop"; exit 1; }

echo "✅ Prerequisites check passed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
else
    echo "✅ .env file already exists"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis
echo "⏳ Waiting for services to be healthy..."
sleep 10
echo "✅ Docker services started"
echo ""

# Check if backend directory has package.json
if [ -f apps/backend/package.json ]; then
    echo "🏗️  Backend detected, checking database..."
    # Wait for PostgreSQL to be ready
    until docker-compose exec -T postgres pg_isready -U caltrack > /dev/null 2>&1; do
        echo "⏳ Waiting for PostgreSQL..."
        sleep 2
    done
    echo "✅ Database is ready"
fi
echo ""

echo "✨ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "  1. Update .env with your API keys and secrets"
echo "  2. Initialize mobile app: cd apps/mobile && npx create-expo-app@latest . --template tabs"
echo "  3. Initialize backend: cd apps/backend && npx @nestjs/cli new . --skip-git --package-manager npm"
echo "  4. Start development:"
echo "     - All services: docker-compose up"
echo "     - Mobile app: cd apps/mobile && npm start"
echo "     - Backend: cd apps/backend && npm run start:dev"
echo ""
echo "🔗 Service URLs:"
echo "  - Backend API: http://localhost:3000"
echo "  - pgAdmin: http://localhost:5050 (admin@caltrack.local / admin)"
echo "  - Mailhog: http://localhost:8025"
echo "  - PostgreSQL: localhost:5432 (caltrack / see .env)"
echo "  - Redis: localhost:6379"
echo ""
echo "Happy coding! 🎉"
