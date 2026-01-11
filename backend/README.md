# Defendish Backend API

Family Food Safety & Allergy Assistance App - Backend Server

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure your database and email settings in `.env`

4. Initialize database:
```bash
npm run db:generate
npm run db:migrate
```

5. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/verify-otp` - Verify email with OTP
- `POST /api/auth/login` - Login to account
- `POST /api/auth/resend-otp` - Resend OTP

### Profiles
- `POST /api/profiles` - Create profile
- `GET /api/profiles` - Get all profiles
- `GET /api/profiles/:profileId` - Get single profile
- `PUT /api/profiles/:profileId` - Update profile
- `DELETE /api/profiles/:profileId` - Delete profile
- `POST /api/profiles/verify-switch` - Verify password for profile switch

### Products
- `POST /api/products` - Add product
- `GET /api/products?profileId=xxx` - Get products for profile
- `GET /api/products/:productId` - Get product details
- `PUT /api/products/:productId/suitability` - Mark safe/unsafe
- `DELETE /api/products/:productId` - Delete product
- `POST /api/products/scan-barcode` - Scan barcode
- `POST /api/products/scan-image` - Upload label image

### Health
- `POST /api/health/records` - Upload health document
- `GET /api/health/records/:profileId` - Get health records
- `POST /api/health/incidents` - Report health incident
- `GET /api/health/incidents/:profileId` - Get incidents

## Features

✅ Email + OTP authentication
✅ Multi-profile management
✅ Product scanning & storage
✅ Ingredient parsing
✅ AI-powered suitability analysis
✅ Expiry tracking with alerts
✅ Health incident reporting
✅ Health document storage

## Tech Stack

- Node.js + Express
- TypeScript
- PostgreSQL + Prisma ORM
- JWT authentication
- Nodemailer for emails
- Node-cron for scheduled tasks
