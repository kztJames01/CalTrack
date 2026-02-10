#!/bin/bash

# CalTrack Teardown Script
# Stops and removes all Docker containers and volumes

set -e

echo "🧹 CalTrack Environment Teardown"
echo "================================="
echo ""

read -p "This will stop all containers and remove volumes. Continue? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Teardown cancelled."
    exit 1
fi

echo "🛑 Stopping containers..."
docker-compose down

echo "🗑️  Removing volumes..."
docker-compose down -v

echo "🧼 Removing orphaned containers..."
docker-compose down --remove-orphans

echo ""
echo "✅ Teardown complete!"
echo "💡 To start fresh, run: ./scripts/setup.sh"
