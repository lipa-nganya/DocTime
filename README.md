# Doc Time Mobile App

A mobile application for doctors to manage surgical cases, schedule procedures, refer cases to other doctors, and generate invoices.

## Features

### Mobile App
- **Authentication**: Phone number + OTP verification, PIN or biometric login
- **Onboarding**: Role selection (Surgeon, Assistant Surgeon, Anaesthetist, etc.)
- **Case Management**: 
  - Create new cases with comprehensive details
  - View upcoming cases (next 5)
  - Edit, complete, cancel, or delete cases
  - Auto-complete expired cases
- **Case Referral**: Refer cases to other doctors via SMS
- **Case History**: View completed and cancelled cases with invoice generation
- **Reports**: Analytics on cases, surgeons, facilities, and finances

### Backend API
- RESTful API built with Express.js and Sequelize
- PostgreSQL database
- SMS integration via Advanta API
- Email integration via SMTP
- JWT authentication
- PDF invoice generation

### Admin Panel
- User management
- Dashboard with statistics
- Case management
- Referral tracking
- Role and team member management

## Tech Stack

### Mobile App
- React Native with Expo
- React Navigation
- React Native Paper
- AsyncStorage for local storage
- Expo Local Authentication for biometrics

### Backend
- Node.js + Express.js
- Sequelize ORM
- PostgreSQL
- JWT for authentication
- PDFKit for invoice generation
- Advanta SMS API
- Nodemailer for emails

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL
- Expo CLI
- ngrok (for local development)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
   - Database credentials
   - JWT secret
   - SMS credentials (Advanta)
   - SMTP credentials
   - ngrok URL (for local development)

5. Create database:
```bash
createdb doctime
```

6. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5001`

### Mobile App Setup

1. Navigate to mobile-app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Update `app.config.js` with your:
   - Expo project ID
   - API base URL (ngrok URL for local, backend URL for production)

4. Start Expo:
```bash
npm start
```

5. Build for local development:
```bash
eas build --profile local-dev --platform android
```

6. Build for development (cloud):
```bash
eas build --profile cloud-dev --platform android
```

### Admin Panel Setup

1. Navigate to admin-frontend directory:
```bash
cd admin-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The admin panel will run on `http://localhost:3000`

## Environment Variables

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `ADVANTA_API_KEY`: Advanta SMS API key
- `ADVANTA_PARTNER_ID`: Advanta partner ID
- `ADVANTA_SENDER_ID`: SMS sender ID
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: SMTP configuration
- `NGROK_URL`: ngrok URL for local development

### Mobile App (app.config.js)
- `EXPO_PUBLIC_API_BASE_URL`: Backend API URL
- `EXPO_PROJECT_ID`: Expo project ID
- `NGROK_URL`: ngrok URL (for local builds)

## Project Structure

```
doc-time/
├── backend/
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── services/        # Business logic (SMS, Email)
│   ├── migrations/     # Database migrations
│   └── server.js        # Express server
├── mobile-app/
│   ├── src/
│   │   ├── screens/     # React Native screens
│   │   ├── services/    # API services
│   │   ├── components/  # Reusable components
│   │   └── theme.js      # Theme configuration
│   └── app.config.js    # Expo configuration
└── admin-frontend/
    └── src/             # Admin panel React app
```

## API Endpoints

### Authentication
- `POST /api/auth/request-otp` - Request OTP
- `POST /api/auth/signup` - Sign up with OTP
- `POST /api/auth/login` - Login with PIN
- `POST /api/auth/verify-token` - Verify JWT token

### Cases
- `GET /api/cases/upcoming` - Get upcoming cases
- `POST /api/cases` - Create new case
- `GET /api/cases/:id` - Get case details
- `PUT /api/cases/:id` - Update case
- `POST /api/cases/:id/complete` - Complete case
- `POST /api/cases/:id/cancel` - Cancel case
- `DELETE /api/cases/:id` - Delete case
- `GET /api/cases/history/completed` - Get completed cases
- `GET /api/cases/history/cancelled` - Get cancelled cases

### Referrals
- `POST /api/referrals` - Create referral
- `POST /api/referrals/:id/accept` - Accept referral
- `POST /api/referrals/:id/decline` - Decline referral
- `GET /api/referrals` - Get referrals

### Reports
- `GET /api/reports` - Get analytics reports

### Invoices
- `GET /api/invoices/:caseId/pdf` - Generate PDF invoice

## Deployment

### Backend
Deploy to Google Cloud Run, Render, or similar platform. Update `DATABASE_URL` to production database.

### Mobile App
Build and publish via Expo:
```bash
eas build --platform android --profile production
eas submit --platform android
```

### Admin Panel
Deploy to any static hosting service (Vercel, Netlify, etc.)

## License

Private project for Doc Time

