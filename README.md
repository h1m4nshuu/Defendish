# Defendish

**Family Food Safety & Allergy Assistance App**

A comprehensive mobile application that helps families identify whether food products are safe to consume based on ingredients, allergies, expiry dates, and health conditions.

## 🎯 Project Structure

```
defendish/
├── backend/          # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── mobile/          # React Native + Expo app
    ├── app/
    │   ├── (tabs)/
    │   ├── profile/
    │   ├── product/
    │   └── _layout.tsx
    ├── services/
    └── package.json
```

## ✨ MVP Features

### Authentication
- ✅ Email + OTP verification
- ✅ Secure JWT-based authentication
- ✅ Password-protected profile switching

### Profile Management
- ✅ Multi-profile support (self, child, parent, other)
- ✅ Health data storage (age, blood group, height, weight)
- ✅ Allergy list management
- ✅ Isolated profile data

### Product Scanning & Management
- ✅ Barcode scanning
- ✅ Manual product entry
- ✅ Ingredient parsing
- ✅ Expiry date tracking
- ✅ Product suitability marking (✅/❌)

### AI-Powered Analysis
- ✅ Rule-based allergen detection
- ✅ Explainable recommendations
- ✅ Conflict warnings (user decision vs AI analysis)
- ✅ Confidence scoring

### Expiry Tracking
- ✅ Automatic expiry monitoring
- ✅ Email alerts (7 days, 1 day, 0 days)
- ✅ Visual status indicators

### Health Incident Management
- ✅ Symptom reporting
- ✅ Severity-based recommendations
- ✅ Incident history tracking

## 🚀 Getting Started

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
   - Database URL (PostgreSQL)
   - JWT secret
   - Email credentials (for OTP)

5. Initialize database:
```bash
npm run db:generate
npm run db:migrate
```

6. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Mobile App Setup

1. Navigate to mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start Expo development server:
```bash
npm start
```

4. Run on device/emulator:
   - Press `a` for Android
   - Press `i` for iOS
   - Scan QR code with Expo Go app

## 📱 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/verify-otp` - Verify email
- `POST /api/auth/login` - Login
- `POST /api/auth/resend-otp` - Resend OTP

### Profiles
- `POST /api/profiles` - Create profile
- `GET /api/profiles` - Get all profiles
- `GET /api/profiles/:id` - Get profile
- `PUT /api/profiles/:id` - Update profile
- `DELETE /api/profiles/:id` - Delete profile
- `POST /api/profiles/verify-switch` - Verify password

### Products
- `POST /api/products` - Add product
- `GET /api/products?profileId=xxx` - Get products
- `GET /api/products/:id` - Get product
- `PUT /api/products/:id/suitability` - Mark safe/unsafe
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/scan-barcode` - Scan barcode
- `POST /api/products/scan-image` - Upload image

### Health
- `POST /api/health/records` - Upload health document
- `GET /api/health/records/:profileId` - Get records
- `POST /api/health/incidents` - Report incident
- `GET /api/health/incidents/:profileId` - Get incidents

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Email**: Nodemailer
- **Scheduling**: node-cron

### Mobile
- **Framework**: React Native
- **Platform**: Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Camera**: expo-camera
- **Storage**: AsyncStorage
- **HTTP**: Axios

## 🎨 Design Philosophy

1. **Human-in-the-loop AI** - AI assists, doesn't dictate
2. **Transparency** - All recommendations are explainable
3. **Safety-first** - Clear warnings for allergens
4. **Family-focused** - Multi-profile with isolated data
5. **Privacy-conscious** - Encrypted health data

## 📋 Phase 2 Features (Future)

- [ ] OCR integration (Tesseract.js / Google Vision)
- [ ] Barcode API integration (Open Food Facts)
- [ ] Advanced ML model for recommendations
- [ ] Push notifications
- [ ] Offline mode with sync
- [ ] Health record OCR processing
- [ ] Location-based doctor suggestions
- [ ] Family sharing features
- [ ] Product history analytics

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- OTP email verification
- Password-protected profile switching
- Encrypted health data storage
- Input validation and sanitization
- SQL injection prevention (Prisma)

## 📄 License

MIT

## 👨‍💻 Author

Built with ❤️ for family food safety

---

**Defendish** - Keeping your family safe, one ingredient at a time.
