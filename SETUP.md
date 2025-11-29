# Doc Time Setup Guide

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

### 2. Mobile App Setup

```bash
cd mobile-app
npm install
# Update app.config.js with your Expo project ID and API URL
npm start
```

### 3. Admin Panel Setup

```bash
cd admin-frontend
npm install
# Create .env file with REACT_APP_API_URL=http://localhost:5001/api
npm start
```

## Environment Variables

### Backend (.env)
Copy from `backend/.env.example` and update:
- Database credentials
- JWT_SECRET
- Advanta SMS credentials
- SMTP credentials
- ngrok URL (for local development)

### Mobile App
Update `mobile-app/app.config.js`:
- `EXPO_PROJECT_ID`: Your Expo project ID
- `EXPO_PUBLIC_API_BASE_URL`: Backend API URL (use ngrok URL for local)

### Admin Panel
Create `admin-frontend/.env`:
```
REACT_APP_API_URL=http://localhost:5001/api
```

## Database Setup

1. Create PostgreSQL database:
```bash
createdb doctime
```

2. The backend will auto-sync tables on first run (development mode)

## ngrok Setup (for Local Development)

1. Install ngrok:
```bash
brew install ngrok/ngrok/ngrok
```

2. Start ngrok:
```bash
ngrok http 5001
```

3. Copy the HTTPS URL and update:
   - Backend `.env`: `NGROK_URL=https://your-url.ngrok-free.dev`
   - Mobile app `app.config.js`: Use the ngrok URL as `EXPO_PUBLIC_API_BASE_URL`

## Building Mobile App

### Local Build (for testing)
```bash
cd mobile-app
eas build --profile local-dev --platform android
```

### Development Build (for user)
```bash
cd mobile-app
eas build --profile cloud-dev --platform android
```

## Testing

1. Start backend: `cd backend && npm start`
2. Start mobile app: `cd mobile-app && npm start`
3. Start admin panel: `cd admin-frontend && npm start`

## Notes

- Use the same ngrok URL as dial-a-drink project
- Expo account: lipanganya
- GitHub repo: DocTime (on lipanganya@gmail.com)
- Theme colors: #292F36 (Jet Black), #4ECDC4 (Strong Cyan), #FFFFFF (White), #FF6B6B (Grapefruit Pink)

