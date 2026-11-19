# Complete Guide: Running the iOS App on macOS and Generating the `.ipa` File

This documentation provides step-by-step instructions for setting up, running, and building the **Campo Buddy / Pydah Student Mobile App** (`SDMS-Mobile-App`) on a Mac, from cloning the repository to exporting the `.ipa` file.

---

## 1. Prerequisites & Environment Setup

Before starting, ensure your Mac has the required developer tools installed.

### System Requirements
| Tool | Recommended Version | Verification Command |
| :--- | :--- | :--- |
| **macOS** | Sonoma (14.x) or Sequoia (15.x) | `sw_vers` |
| **Xcode** | Xcode 15 or 16+ | `xcodebuild -version` |
| **Node.js** | Node.js 18.x or 20.x (LTS) | `node -v` |
| **npm** | 9.x or 10.x | `npm -v` |
| **CocoaPods** | 1.14+ | `pod --version` |
| **Watchman** | Latest (via Homebrew) | `watchman -v` |

### Install Dependencies via Homebrew
```bash
# Install Homebrew if not installed:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node and Watchman
brew install node watchman

# Install CocoaPods (for iOS native dependencies)
sudo gem install cocoapods
# Or via brew:
# brew install cocoapods

# Install EAS CLI globally (for Expo Application Services builds)
npm install -g eas-cli
```

### Xcode Setup
1. Download **Xcode** from the Mac App Store.
2. Open Xcode and accept the license agreements.
3. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```
4. Configure Xcode active developer path:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```
5. Open Xcode > **Settings** (or **Preferences**) > **Platforms** / **Components** and install iOS Simulator runtime (e.g., iOS 17 / iOS 18).

---

## 2. Step 1: Clone the Git Repository

Open Terminal and clone the repository:

```bash
# Clone the repository
git clone <YOUR_GIT_REPO_URL>

# Navigate into the mobile project directory
cd SDMS-Mobile-App
```

---

## 3. Step 2: Configure Environment Variables

The application relies on `.env` files for backend endpoints and gateway URLs.

1. Check `.env.example` in the project root:
   ```bash
   cp .env.example .env
   # or copy for specific environment
   cp .env.example .env.development
   ```
2. Adjust environment variables inside `.env` or `.env.development`:
   ```bash
   EXPO_PUBLIC_APP_ENV=development
   EXPO_PUBLIC_API_URL=http://localhost:5000/api
   EXPO_PUBLIC_CRM_BACKEND_URL=https://crm.pydah.edu.in
   EXPO_PUBLIC_GATEWAY_URL=http://localhost:5000/api/v1
   EXPO_PUBLIC_CRT_APP_URL=https://crt.pydah.edu.in
   ```
   > **Note:** When testing on a physical iPhone connected to the same Wi-Fi, replace `localhost` with your Mac's local IP address (e.g. `http://192.168.x.x:5000/api`).

---

## 4. Step 3: Install Node Modules & iOS Pods

Install project dependencies and configure native iOS pods:

```bash
# 1. Install JavaScript / React Native dependencies
npm install

# 2. Install iOS CocoaPods dependencies
cd ios
pod install
cd ..
```

---

## 5. Step 4: Running the Application on macOS

You can run the app using Expo CLI or directly inside Xcode.

### Method A: Running via Terminal (Recommended for React Native / Expo)

To start the Metro bundler and boot the iOS Simulator:

```bash
# Run on iOS Simulator
npm run ios
# or
npx expo run:ios
```

To specify a particular simulator:
```bash
npx expo run:ios --device "iPhone 15 Pro"
```

### Method B: Running via Xcode

1. Open the iOS workspace in Xcode:
   ```bash
   open ios/CampoStudentPortal.xcworkspace
   ```
   *(Always open `.xcworkspace`, never `.xcodeproj`)*
2. In the top toolbar:
   - Select the **CampoStudentPortal** scheme.
   - Select a Simulator target (e.g., **iPhone 16** or **iPhone 15 Pro**).
3. Click the **Play / Run** button (`⌘ + R`).
4. Xcode compiles the native code and automatically starts the Metro bundler.

---

## 6. Step 5: Generating the `.ipa` File

In this repository, the build configurations are mapped in `package.json` and `eas.json`. You have two primary ways to generate the `.ipa`: **EAS Build** or **Native Xcode Archive**.

### Method 1: Using EAS Build (Expo CLI)

The project includes pre-configured scripts in `package.json`:
- `"build:ipa": "eas build -p ios --profile preview"`
- `"build:ipa:local": "eas build -p ios --profile preview --local"`

#### Option 1A: EAS Cloud Build (Preview Profile)
This builds on Expo's remote servers and outputs a downloadable `.ipa` link:
```bash
# 1. Login to your Expo account
eas login

# 2. Run the preview build
npm run build:ipa
```
EAS handles certificates, provisioning profiles, and provides an `.ipa` download URL upon completion.

#### Option 1B: EAS Local Build on Mac
To build the `.ipa` directly on your Mac hardware without consuming EAS cloud credits:
```bash
npm run build:ipa:local
```
Once completed, EAS will output the `.ipa` file (e.g. `CampoStudentPortal.ipa`) directly into the project directory.

---

### Method 2: Manual Build & Archive via Xcode

If you prefer building without EAS:

1. **Open the workspace:**
   ```bash
   open ios/CampoStudentPortal.xcworkspace
   ```
2. **Signing & Capabilities:**
   - Select the **CampoStudentPortal** target in Xcode.
   - Go to the **Signing & Capabilities** tab.
   - Check **Automatically manage signing**.
   - Select your **Apple Developer Team**.
   - Verify that the Bundle Identifier is `com.pydahsoft.studentapp`.
3. **Select Build Destination:**
   - In the top destination dropdown, select **Any iOS Device (arm64)** (not a simulator).
4. **Create Archive:**
   - From the top menu, select **Product** > **Archive**.
   - Wait for Xcode to compile the native code and bundle assets.
5. **Export the `.ipa`:**
   - When the **Organizer** window appears, select your latest archive.
   - Click **Distribute App**.
   - Select **Custom** > **Ad Hoc** or **Development** (or **App Store Connect** for TestFlight/App Store).
   - Follow the prompts to configure signing and asset optimization.
   - Click **Export** and choose the destination folder.
   - Xcode outputs a folder containing `CampoStudentPortal.ipa`.

---

## 7. Step 6: Installing and Verifying the `.ipa` File

Once you have `CampoStudentPortal.ipa`:

- **Physical iPhone via Mac:**
  - Connect your iPhone with a USB cable.
  - Open **Apple Configurator** or **Xcode** > **Window** > **Devices and Simulators**.
  - Under **Installed Apps**, drag and drop `CampoStudentPortal.ipa` onto your device.
- **Over-The-Air (OTA) / Internal Distribution:**
  - Distribute via Diawi, BrowserStack, or upload to App Store Connect / TestFlight.

---

## 8. Summary of Common Commands

| Task | Command |
| :--- | :--- |
| **Clone repo** | `git clone <repo-url> && cd SDMS-Mobile-App` |
| **Install packages** | `npm install` |
| **Install CocoaPods** | `cd ios && pod install && cd ..` |
| **Run on iOS Simulator** | `npm run ios` |
| **Generate `.ipa` (Cloud)** | `npm run build:ipa` |
| **Generate `.ipa` (Local Mac)** | `npm run build:ipa:local` |
| **Open in Xcode** | `open ios/CampoStudentPortal.xcworkspace` |
