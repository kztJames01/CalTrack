# 📱 CalTrack - AI-Powered Calorie Tracking App

> A modern, mobile-first calorie tracking application with computer vision-powered food recognition, barcode scanning, and comprehensive nutritional tracking.

## 🌟 Features

- 📸 **Photo-based food recognition** using Google Cloud Vision API
- 🏷️ **Barcode scanning** for instant nutritional data
- ✍️ **Manual food entry** with extensive food database
- 📊 **Daily calorie and macro tracking** (protein, carbs, fats)
- 🎯 **Personalized goals** based on user profile
- 📈 **Meal history and analytics**
- 🔄 **Offline-first architecture** with automatic sync
- 👥 **User accounts** with cloud backup

## 🏗️ Architecture

This is a **monorepo** built with [Turborepo](https://turbo.build/repo).

### Tech Stack

**Mobile:** React Native (Expo), TypeScript, Zustand, WatermelonDB  
**Backend:** NestJS, PostgreSQL, Redis, Docker  
**APIs:** Google Cloud Vision, Nutritionix

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker Desktop
- Xcode (macOS) or Android Studio

### Installation

1. Clone and setup:
   ```bash
   git clone <repo-url>
   cd CalTrack
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

2. Configure `.env` with your API keys

3. Initialize apps:
   ```bash
   # Mobile
   cd apps/mobile && npx create-expo-app@latest . --template tabs
   
   # Backend
   cd apps/backend && npx @nestjs/cli new . --skip-git --package-manager npm
   ```

4. Start development:
   ```bash
   docker-compose up        # Start services
   npm run dev              # Start all apps
   ```

## 📚 Documentation

- Backend API: http://localhost:3000
- pgAdmin: http://localhost:5050
- Mailhog: http://localhost:8025

See `/docs` for detailed documentation.

---

**Built with ❤️ using Turborepo, Expo, and NestJS**
