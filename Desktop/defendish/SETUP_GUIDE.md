# Defendish - Quick Start Guide

## 🎯 What You've Built

A complete **Family Food Safety & Allergy Assistance App** with:
- Backend API (Node.js + Express + PostgreSQL)
- Mobile App (React Native + Expo)
- All MVP features implemented

## 📦 Installation Steps

### 1. Backend Setup

```powershell
# Navigate to backend
cd backend

# Install dependencies
npm install

# Update .env file with your credentials
# - PostgreSQL database URL
# - Email credentials for OTP
# - JWT secret

# Initialize database
npx prisma generate
npx prisma migrate dev --name init

# Start backend server
npm run dev
```

Backend will run on: **http://localhost:5000**

### 2. Mobile App Setup

```powershell
# Open a new terminal
cd mobile

# Install dependencies
npm install

# Update API URL in services/api.ts if needed
# Change 'http://localhost:5000/api' to your backend URL

# Start Expo development server
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on physical device

## ⚙️ Environment Configuration

### Backend (.env)

Required configurations:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/defendish_db"

# JWT
JWT_SECRET="generate_a_secure_random_string"

# Email (for OTP - use Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

**Gmail App Password Setup:**
1. Go to Google Account Settings
2. Security → 2-Step Verification → App passwords
3. Generate new app password
4. Use this password in EMAIL_PASSWORD

### Mobile (services/api.ts)

```typescript
const API_URL = 'http://localhost:5000/api'; // Update for production
```

For physical device testing, use your computer's IP address:
```typescript
const API_URL = 'http://192.168.1.X:5000/api'; // Replace X with your IP
```

## 🚀 Testing the App

### 1. Start Backend
```powershell
cd backend
npm run dev
```

### 2. Start Mobile App
```powershell
cd mobile
npm start
```

### 3. Test Flow

1. **Signup**
   - Enter email and password
   - Check email for OTP
   - Verify OTP

2. **Create Profile**
   - Add name, relation, health data
   - Add allergies (e.g., "peanuts", "milk", "eggs")

3. **Add Product**
   - Use scan tab or manual entry
   - Enter product name and ingredients
   - Set expiry date

4. **Mark Suitability**
   - View product details
   - Tap ✅ or ❌
   - See AI recommendation

5. **View AI Analysis**
   - Check allergen matches
   - Read explanation
   - See warnings if applicable

## 📱 App Features

### MVP Implemented ✅

- Email + OTP authentication
- Multi-profile management
- Password-protected profile switching
- Product scanning (barcode + manual)
- Ingredient parsing
- Allergy detection
- AI suitability analysis with explanations
- Expiry tracking with email alerts
- Health incident reporting
- Product list with status indicators

### Phase 2 (Future) 📋

- OCR for ingredient labels
- Barcode API integration (Open Food Facts)
- Advanced ML models
- Push notifications
- Offline mode
- Health record OCR
- Location-based doctor finder
- Analytics dashboard

## 🔧 Common Issues & Solutions

### Backend Issues

**Database Connection Error:**
```powershell
# Check PostgreSQL is running
# Update DATABASE_URL in .env
npx prisma migrate reset  # Reset database if needed
```

**OTP Email Not Sending:**
- Verify Gmail app password
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Enable "Less secure app access" if needed

**Port Already in Use:**
```powershell
# Change PORT in .env to different value
PORT=5001
```

### Mobile App Issues

**Cannot Connect to Backend:**
- Ensure backend is running
- Update API_URL with correct IP
- Check firewall settings

**Camera Permission Denied:**
- Go to device Settings → Apps → Expo Go → Permissions
- Enable Camera permission

**Expo Build Error:**
```powershell
# Clear cache and reinstall
rm -rf node_modules
npm install
```

## 📖 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /auth/signup` - Create account
- `POST /auth/verify-otp` - Verify email
- `POST /auth/login` - Login
- `POST /auth/resend-otp` - Resend OTP

### Profile Endpoints (Auth Required)
- `POST /profiles` - Create profile
- `GET /profiles` - Get all profiles
- `GET /profiles/:id` - Get profile details
- `PUT /profiles/:id` - Update profile
- `DELETE /profiles/:id` - Delete profile
- `POST /profiles/verify-switch` - Verify password for switching

### Product Endpoints (Auth Required)
- `POST /products` - Add product
- `GET /products?profileId=xxx` - Get products for profile
- `GET /products/:id` - Get product details
- `PUT /products/:id/suitability` - Mark safe/unsafe
- `DELETE /products/:id` - Delete product

### Health Endpoints (Auth Required)
- `POST /health/records` - Upload health document
- `GET /health/records/:profileId` - Get health records
- `POST /health/incidents` - Report incident
- `GET /health/incidents/:profileId` - Get incidents

## 🎨 App Screens

### Authentication Flow
1. Welcome Screen
2. Signup Screen
3. OTP Verification Screen
4. Login Screen

### Main App (After Login)
1. **Products Tab** - List of all products with expiry status
2. **Scan Tab** - Camera for barcode scanning
3. **Profile Tab** - Profile management and settings

### Additional Screens
- Profile Create - Add new family member
- Profile Select - Switch between profiles
- Product Add - Manual product entry
- Product Detail - View ingredients and mark suitability

## 🛡️ Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT-based authentication with expiry
- ✅ OTP email verification
- ✅ Password-protected profile switching
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Prisma ORM)
- ✅ CORS enabled
- ✅ Health data encryption ready

## 📊 Database Schema

### Tables
- **users** - Account holders
- **profiles** - Family members
- **products** - Scanned products
- **health_records** - Uploaded documents
- **health_incidents** - Reported issues

### Relationships
- User → many Profiles
- Profile → many Products
- Profile → many HealthRecords
- Profile → many HealthIncidents
- Product → many HealthIncidents

## 🎯 Next Steps

1. **Test the MVP** - Try all features end-to-end
2. **Configure Email** - Set up Gmail app password for OTP
3. **Setup Database** - Install PostgreSQL and run migrations
4. **Customize Branding** - Update app name, icons, colors
5. **Add Test Data** - Create profiles and products
6. **Production Setup** - Deploy backend and configure environment

## 📝 Development Commands

### Backend
```powershell
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run db:migrate   # Run database migrations
npm run db:generate  # Generate Prisma client
```

### Mobile
```powershell
npm start            # Start Expo dev server
npm run android      # Start on Android
npm run ios          # Start on iOS
npm run web          # Start web version
```

## 🐛 Debugging Tips

### Backend Logs
Watch the terminal running `npm run dev` for:
- API requests
- Database queries
- Email sending status
- Errors and stack traces

### Mobile Logs
In Expo dev tools, press:
- `Shift + m` - Open React DevTools
- Check Chrome DevTools for console logs

### Database Inspection
```powershell
npx prisma studio  # Open visual database editor
```

## 💡 Tips for Success

1. **Start Backend First** - Always run backend before mobile app
2. **Check Network** - Ensure mobile device can reach backend
3. **Use Real Emails** - For testing OTP functionality
4. **Test Allergies** - Add common allergens to test matching
5. **Read AI Explanations** - Understand the recommendation logic
6. **Monitor Expiry Alerts** - Test cron job with products expiring soon

## 📞 Support

For issues or questions:
1. Check error messages in terminal/console
2. Review [README.md](../README.md) for detailed documentation
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed

---

**🛡️ Defendish** - Keeping your family safe, one ingredient at a time.

Happy coding! 🚀
