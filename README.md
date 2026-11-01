# Pydah Student Portal - React Native Mobile Application

This is the official cross-platform React Native mobile application for the **Pydah Student Data Management System (SDMS)**, built with **Expo SDK 58**, **React Native 0.88**, **React 19**, **Expo Router**, and **TypeScript**.

It connects to the same backend API flows as the web frontend and integrates with **EAS (Expo Application Services)** for multi-environment cloud builds and backend resolution.

---

## 🚀 Key Features & Backend Flows

All backend workflows from the parent system are seamlessly mapped to the mobile application:

| Feature / Flow | Mobile Screen | Backend API Endpoint |
|---|---|---|
| **Student Authentication** | `app/(auth)/login.tsx` | `POST /api/students/login` |
| **Staff & Admin Login** | `app/(auth)/login.tsx` | `POST /api/auth/unified-login` |
| **Password Recovery** | `app/(auth)/forgot-password.tsx` | `POST /api/students/forgot-password` |
| **Token Verification** | `src/context/AuthContext.tsx` | `GET /api/auth/verify` |
| **Student Dashboard** | `app/(tabs)/index.tsx` | Summary widgets & quick links |
| **Attendance Tracker** | `app/(tabs)/attendance.tsx` | `GET /api/attendance/student/...` |
| **Fee Ledger & Payments** | `app/(tabs)/fees.tsx` | `GET /api/fees/students/:id/details` & `POST /api/payments/create-order` |
| **Pydah Payment Gateway** | `app/(tabs)/fees.tsx` | Integrated with PPG Hosted Checkout & Razorpay |
| **Circulars & Notices** | `app/(tabs)/announcements.tsx` | `GET /api/announcements/student` |
| **Student Profile** | `app/(tabs)/profile.tsx` | `GET /api/students/profile` |

---

## 📁 Project Directory Structure

```
mobile-app/
├── app/                        # Expo Router (file-based navigation)
│   ├── _layout.tsx             # Root layout with AuthProvider & SafeArea
│   ├── (auth)/                 # Unauthenticated stack
│   │   ├── _layout.tsx
│   │   ├── login.tsx           # Segmented Student / Staff login
│   │   └── forgot-password.tsx # Password recovery flow
│   └── (tabs)/                 # Main authenticated tab navigation
│       ├── _layout.tsx         # Bottom tab bar configuration
│       ├── index.tsx           # Student Dashboard
│       ├── attendance.tsx      # Attendance summary & subject breakdown
│       ├── fees.tsx            # Dues, transactions, PPG payment
│       ├── announcements.tsx   # Campus notices & circulars
│       └── profile.tsx         # Student details & account settings
├── assets/                     # App icons, splash screens, logos
├── src/
│   ├── config/
│   │   ├── env.ts              # EAS environment & backend URL resolution
│   │   └── api.ts              # Axios instance, Bearer token, session expiry
│   ├── context/
│   │   └── AuthContext.tsx     # Session management & token persistence
│   ├── services/
│   │   ├── authService.ts      # Login, OTP, reset API calls
│   │   ├── studentService.ts   # Profile, attendance, timetable
│   │   ├── feeService.ts       # Fees & PPG order creation
│   │   └── announcementService.ts # Circulars & notices
│   ├── components/             # Reusable UI widgets (Header, Input, Button, StatCard)
│   └── types/                  # TypeScript interfaces matching backend models
├── app.json                    # Expo project configuration
├── eas.json                    # EAS build profiles (dev, preview, prod)
└── tsconfig.json               # TypeScript path alias configuration (@/*)
```

---

## ⚙️ EAS Build Profiles & Backend Configuration (`eas.json`)

Backend URLs are managed through build profiles in `eas.json` using `EXPO_PUBLIC_` environment variables:

### 1. `development` Profile
- **Target Backend**: Local development server (`http://10.0.2.2:5000/api` for Android Emulator, `http://localhost:5000/api` for iOS / Web)
- **Distribution**: Internal APK / Development Client
```bash
eas build --profile development --platform android
```

### 2. `preview` (Staging) Profile
- **Target Backend**: Staging API (`https://staging-api.pydah.edu.in/api`)
- **Distribution**: Internal tester APK
```bash
eas build --profile preview --platform android
```

### 3. `production` Profile
- **Target Backend**: Production API (`https://api.pydah.edu.in/api`)
- **Distribution**: Google Play Store / Apple App Store (`.aab` / `.ipa`)
```bash
eas build --profile production --platform all
```

---

## 💻 Running the App Locally

### 1. Install Dependencies
```bash
cd mobile-app
npm install
```

### 2. Configure Local `.env` (Optional)
If running against a specific LAN IP (for physical device testing via Expo Go):
```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
```

### 3. Start Expo Dev Server
```bash
npx expo start
```
- Press `a` to open in Android Emulator
- Press `i` to open in iOS Simulator
- Press `w` to open in Web browser
- Scan QR code with the **Expo Go** app on your physical phone

---

## 🔐 Git Repository Setup

This folder is configured as an independent Git repository located inside the parent `Student-Data-Management-Application` directory:
- Local branch: `main`
- Ignore rules configured in both `.gitignore` and parent `.gitignore`.

