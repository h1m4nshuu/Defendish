# Defendish

Family Food Safety and Allergy Assistance app with:
- A backend API in Node.js, Express, TypeScript, and Prisma
- A mobile app in React Native and Expo

This README is written so a new developer can:
1. Understand what this project does
2. Run it locally without guessing
3. Fix common setup/runtime problems quickly
4. Suggest better solutions when issues happen

## What Defendish Does

Defendish helps families decide if a food product is safe for a specific profile (self, child, parent, etc.) by using:
- Allergy and health profile data
- Ingredient analysis and suitability checks
- Expiry tracking
- Health incident reporting

## Repository Structure

```text
defendish-clean/
|-- backend/    # API server
|   |-- src/
|   |-- prisma/
|   |-- tests/
|   `-- package.json
|-- mobile/     # Expo app
|   |-- app/
|   |-- components/
|   |-- services/
|   `-- package.json
|-- SETUP_GUIDE.md
`-- README.md
```

## Tech Stack

Backend:
- Node.js + Express
- TypeScript
- PostgreSQL + Prisma
- JWT auth + OTP email flow

Mobile:
- React Native + Expo
- Expo Router
- TypeScript
- AsyncStorage

## Prerequisites

Install these before setup:
- Node.js 18+
- npm 9+
- PostgreSQL (running locally or remote)
- Expo Go app (for physical device testing)

Recommended on Windows:
- PowerShell terminal
- Android Studio (for Android emulator)

## Quick Start

Run backend and mobile in separate terminals.

### 1) Backend Setup

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Open backend/.env and set at least:
- DATABASE_URL
- JWT_SECRET
- EMAIL_USER
- EMAIL_PASSWORD

Then run:

```powershell
npm run db:generate
npm run db:migrate
npm run dev
```

Backend default URL:
- http://localhost:5000

### 2) Mobile Setup

```powershell
cd mobile
npm install
npm start
```

From Expo terminal:
- Press a to open Android
- Press i for iOS (macOS only)
- Or scan QR with Expo Go

## Environment Configuration

Backend env template exists at backend/.env.example.

Important values:
- PORT=5000
- NODE_ENV=development
- DATABASE_URL=postgresql://...
- JWT_SECRET=...
- EMAIL_HOST=smtp.gmail.com
- EMAIL_PORT=587
- EMAIL_USER=...
- EMAIL_PASSWORD=...

## Main NPM Scripts

Backend (run inside backend):
- npm run dev: start API with watch mode
- npm run build: build TypeScript
- npm run test: run tests
- npm run db:generate: generate Prisma client
- npm run db:migrate: run migrations

Mobile (run inside mobile):
- npm start: start Expo
- npm run android: native Android run
- npm run ios: native iOS run
- npm run web: start web target
- npm run reset: start Expo with cleared cache

## API Overview

Base URL:
- http://localhost:5000/api

Core endpoint groups:
- Auth: /auth/signup, /auth/verify-otp, /auth/login
- Profiles: /profiles
- Products: /products
- Health: /health/records, /health/incidents

For detailed backend API notes, see backend/README.md.

## Common Problems and Solutions

Use this section first when something breaks.

### Problem: npm start fails at repository root

Cause:
- The root folder is not the app runtime folder.

Solution:
- Run mobile commands from mobile directory
- Run backend commands from backend directory

Example:

```powershell
cd mobile
npm start
```

### Problem: Expo fails to start or hangs

Try:

```powershell
cd mobile
npm run reset
```

If still failing:

```powershell
cd mobile
Remove-Item -Recurse -Force node_modules
npm install
npm run reset
```

### Problem: App cannot connect to backend

Check:
- Backend is running on port 5000
- Mobile API base URL points to the right host
- For physical device, use your machine LAN IP instead of localhost

### Problem: Prisma/database errors

Try:

```powershell
cd backend
npm run db:generate
npm run db:migrate
```

Also verify:
- PostgreSQL is running
- DATABASE_URL is valid

### Problem: OTP emails are not sent

Check:
- EMAIL_USER and EMAIL_PASSWORD are correct
- SMTP host/port values are correct
- If using Gmail, use an App Password

### Problem: Port already in use

Change backend port in backend/.env, for example:

```env
PORT=5001
```

Then update mobile API URL to match.

## How to Suggest a Better Fix

If you find a recurring problem, suggest a solution so the team can improve onboarding.

Include these 5 items:
1. What command you ran
2. Exact error message
3. Your OS and environment (device/emulator, Node version)
4. What you already tried
5. Your proposed fix (or hypothesis)

Suggested format:

```text
Issue:
Steps:
Observed Error:
Expected:
Tried:
Proposed Fix:
```

Good places to update:
- This README troubleshooting section
- SETUP_GUIDE.md for setup improvements
- backend/README.md for API/backend-specific fixes

## MVP Features Implemented

- Email + OTP authentication
- Multi-profile management
- Product scanning and product management
- Ingredient and suitability analysis
- Expiry monitoring and alerts
- Health record and incident tracking

## Security Notes

- Password hashing with bcrypt
- JWT authentication
- Input validation and sanitization
- Prisma ORM protections against SQL injection

## License

MIT
