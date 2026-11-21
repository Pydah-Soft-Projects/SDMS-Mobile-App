# Campo Buddy Mobile Push Notification Setup & Architecture Guide

This document provides a comprehensive technical reference and step-by-step setup guide for the push notification system in the **Campo Buddy** (Pydah Student Portal) mobile application.

---

## 1. Architecture Overview

To ensure notifications are received even when the mobile app is **completely closed, swiped away, or the phone is locked**, the app uses an OS-level push notification pipeline.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NOTIFICATION ARCHITECTURE                       │
└────────────────────────────────────────────────────────────────────────┘

  [College Admin / Backend]
             │
             │ 1. Announcement / Event / Fee Alert Triggered
             ▼
  [backend/controllers/pushController.js]
             │
             │ 2. Queries `mobile_push_tokens` table for student tokens
             │ 3. Formats payload with priority: 'high' & target channelId
             │ 4. Dispatches POST request to Expo Push API
             ▼
  [Expo Push Service (https://exp.host/--/api/v2/push/send)]
             │
             │ 5. Routes payload to Google Firebase Cloud Messaging
             │    using uploaded FCM V1 Service Account credentials
             ▼
  [Google Firebase Cloud Messaging (FCM v1)]
             │
             │ 6. Dispatches to target device via persistent Google connection
             ▼
  [Android OS — Google Play Services Daemon]
             │ (Runs 24/7 at OS level, independent of whether Campo Buddy is open)
             │
             │ 7. Checks notification channel permissions & importance
             │ 8. Displays heads-up banner, plays sound & vibrates
             ▼
  [Android System Notification Tray / Lockscreen]
             │
             │ 9. Student taps notification
             ▼
  [Campo Buddy App Launches & Deep Links to Relevant Screen]
```

---

## 2. Project Identifiers & Credentials Summary

| Configuration Item | Value | Description |
| :--- | :--- | :--- |
| **Android Package Name** | `com.pydahsoft.campobuddy` | Defined in `app.json` & Firebase Android client |
| **iOS Bundle Identifier** | `com.pydahsoft.campobuddy` | Reserved for future iOS build |
| **Firebase Project ID** | `campo-buddy` | Google Firebase Project |
| **Expo EAS Project ID** | `dfd664bd-0f17-41a3-a4d3-05e1ecb72fcb` | EAS Project UUID (Slug: `pydah-student-app`) |
| **Android Keystore** | `campo_buddy_keystore` | Managed & stored securely on Expo EAS Cloud |
| **FCM V1 Client Email** | `firebase-adminsdk-fbsvc@campo-buddy.iam.gserviceaccount.com` | Google Service Account for push delivery |

---

## 3. Step-by-Step Setup Guide (For Future Reproducibility)

### Step 1: Firebase Project Configuration
1. Go to **[Firebase Console](https://console.firebase.google.com/)**.
2. Create or open the project **`campo-buddy`**.
3. Under **Project Overview ➡️ Add App ➡️ Android**:
   * **Android package name:** `com.pydahsoft.campobuddy` (must match `app.json` exactly).
   * **App nickname:** `Campo Buddy`.
4. Click **Register app** and download `google-services.json`.
5. Place the file in the project at:
   ```text
   mobile-app/google-services.json
   ```
6. In Firebase Console, skip the Gradle instructions (Expo handles Gradle plugins automatically).

---

### Step 2: Generate Google Service Account Private Key (FCM V1)
1. In Firebase Console, click the **Gear icon (⚙️) ➡️ Project settings**.
2. Go to the **Service accounts** tab.
3. Select **Firebase Admin SDK**.
4. Click **Generate new private key** ➡️ **Generate key**.
5. Save the downloaded `.json` file securely on your computer.

---

### Step 3: Configure Expo EAS Credentials (CLI)
In terminal, navigate to the `mobile-app` directory:
```bash
cd mobile-app
npx eas-cli credentials
```
Follow the interactive prompts:
1. **Platform:** Select `Android`.
2. **Build Profile:** Select `production-apk` (or default).
3. **Android Keystore:** Select `Keystore: Manage everything needed to build your project` ➡️ Choose **Generate a new Android Keystore**. Expo will create and store `campo_buddy_keystore` in the cloud.
4. **Push Notifications:** Select `Google Service Account` ➡️ Select `Manage your Google Service Account Key for Push Notifications (FCM V1)` ➡️ Choose **Upload a new key** and provide the path to your downloaded Firebase private key `.json` file.

---

### Step 4: Configure App Manifest (`app.json`)
Ensure [mobile-app/app.json](file:///e:/Pydahsoft_Sak/Student-Data-Management-Application/mobile-app/app.json) includes the following:

```json
{
  "expo": {
    "name": "Campo Buddy",
    "slug": "pydah-student-app",
    "android": {
      "package": "com.pydahsoft.campobuddy",
      "googleServicesFile": "./google-services.json",
      "usesCleartextTraffic": true,
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "POST_NOTIFICATIONS",
        "WAKE_LOCK"
      ]
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/campo-icon.png",
          "color": "#1E3A8A"
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "dfd664bd-0f17-41a3-a4d3-05e1ecb72fcb"
      }
    }
  }
}
```

---

### Step 5: Android Notification Channels Setup
Android 8.0+ (API 26+) requires notifications to belong to pre-defined notification channels. If a notification targets a channel that does not exist, the OS may drop or silence the alert.

In [mobile-app/src/services/notificationService.ts](file:///e:/Pydahsoft_Sak/Student-Data-Management-Application/mobile-app/src/services/notificationService.ts), all 8 channels are initialized with `MAX` importance:

| Channel ID | Channel Name | Importance | Description |
| :--- | :--- | :---: | :--- |
| `default` | Campo Campus Updates | `MAX` | General campus announcements |
| `urgent` | Urgent Alerts & Notices | `MAX` | Critical emergencies and urgent notices |
| `announcements` | Announcements & Circulars | `MAX` | Official college circulars |
| `events` | Campus Events & Workshops | `MAX` | Fests, clubs, and workshops |
| `attendance` | Attendance Alerts | `MAX` | Shortage warnings and daily logs |
| `fees` | Fee & Payment Updates | `MAX` | Dues, reminders, and payment receipts |
| `exams` | Examinations & Results | `MAX` | Schedules, hall tickets, and grades |
| `assignments` | Assignments & Academics | `MAX` | Deadlines, homework, and syllabus |

---

### Step 6: Security & Git Exclusions
Keystores and private keys should never be committed to git. Ensure [.gitignore](file:///e:/Pydahsoft_Sak/Student-Data-Management-Application/mobile-app/.gitignore) contains:

```gitignore
# Keystores & sensitive mobile credentials
*.jks
*.keystore
*.p12
*-adminsdk-*.json
```

---

## 4. Key Code Files & Responsibilities

### Client Side (Mobile App)
* **[mobile-app/src/services/notificationService.ts](file:///e:/Pydahsoft_Sak/Student-Data-Management-Application/mobile-app/src/services/notificationService.ts):**
  * `ensureAndroidNotificationChannel()`: Creates the 8 Android channels with sound, vibration, and lockscreen visibility.
  * `checkHasPermission()`: Checks notification permissions across Android 13+ (`POST_NOTIFICATIONS`) and Expo.
  * `registerForPushNotifications()`: Fetches the FCM-backed Expo Push Token (`ExponentPushToken[...]`) and posts it to the backend `/push/register-mobile`.
  * `checkForNewAlerts()`: In-app fallback polling when the app is active.
* **[mobile-app/app/_layout.tsx](file:///e:/Pydahsoft_Sak/Student-Data-Management-Application/mobile-app/app/_layout.tsx):**
  * Automatically invokes `notificationService.registerForPushNotifications()` when a student logs in.
  * Manages the permission dialog prompt.

### Backend Side
* **[backend/controllers/pushController.js](file:///e:/Pydahsoft_Sak/Student-Data-Management-Application/backend/controllers/pushController.js):**
  * `ensureMobilePushTable()`: Maintains the `mobile_push_tokens` MySQL table:
    ```sql
    CREATE TABLE mobile_push_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        platform VARCHAR(20) DEFAULT 'android',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_token (user_id, token)
    );
    ```
  * `registerMobile`: Saves or updates device tokens.
  * `sendExpoPushNotification`: Batches messages in chunks of 100 and sends them to Expo's Push API with high priority.
  * `resolveChannelId` & `resolveMobileRoute`: Maps categories to the correct Android notification channel and deep-link screen.
  * `testDevicePush`: Endpoint for testing delivery on specific student devices.
* **[backend/routes/pushRoutes.js](file:///e:/Pydahsoft_Sak/Student-Data-Management-Application/backend/routes/pushRoutes.js):**
  * Defines `/push/register-mobile`, `/push/unregister-mobile`, `/push/test-device`, and `/push/broadcast`.

---

## 5. Building & Deploying the APK

To build a standalone production APK with the push notification configuration embedded:

```bash
cd mobile-app
npm run build:apk
```
*(Command executed under the hood: `eas build -p android --profile production-apk`)*

EAS Build will:
1. Bundle the app JavaScript with Metro.
2. Read `google-services.json` and inject the Google Services Gradle plugin.
3. Sign the APK with `campo_buddy_keystore`.
4. Provide a direct download link for the installable `.apk` file.

---

## 6. Device-Specific Considerations (Android OEMs)

Certain Android device manufacturers (Xiaomi/Redmi/Poco MIUI/HyperOS, Vivo FuntouchOS, Oppo/Realme ColorOS, OnePlus OxygenOS, and Samsung OneUI) have aggressive background battery management that may sleep Google Play background services.

If a student reports delayed notifications, advise them to:
1. Long-press the **Campo Buddy** app icon ➡️ **App Info**.
2. Under **Battery Saver**, select **No restrictions** (or *Unrestricted*).
3. Under **Permissions / Autostart**, toggle **Autostart** to **ON**.
4. Ensure **Notifications ➡️ Allow Notifications** is enabled.
