# 🏥 Health Guide App

The **Health Guide App** is a premium, feature-rich React Native mobile application built on Expo SDK 54. It provides users with a comprehensive toolset to manage their health records, consult an AI Healthcare chatbot, locate nearby medical facilities, calculate BMI, configure daily wellness reminder schedules, and read health tips.

---

## 🌟 Key Features

1. **Authentication & Profile Management**
   - User Registration, Login, Logout, and Forgot Password functionality.
   - Configurable medical details (Age, Gender, Height, Weight).
   - Support for premium **Light & Dark modes** synced to the user profile.

2. **Health Records (Full CRUD)**
   - Create, Read, Update, and Delete clinical/personal health records.
   - Metadata tracking: Title, Date (YYYY-MM-DD), Category (e.g. Cardiology, Dental, Nutrition), Diagnostics Description, and Doctor/Reminder Notes.
   - Deletion safety pop-ups and full local search & horizontal category filter navigation.

3. **Healthcare Maps GPS Integration**
   - Displays device coordinates using high-accuracy location tracking (`expo-location`).
   - Dynamic maps utilizing `react-native-maps` to render nearby Hospitals, Pharmacies, and Clinics.
   - Info callout sheets with direct dial (simulated) and directional map routing.
   - Web/Simulated lists fallback if device mapping is unavailable.

4. **Clinical AI Chatbot**
   - Integrated with Google Gemini API (`gemini-1.5-flash`) for real-time symptom explanations and diet guidance.
   - Smart suggestion chips for rapid symptom querying.
   - Non-medical informational disclaimer banners.
   - **Local AI response parsing engine fallback** if the API key is not configured.

5. **Local Reminder Schedules**
   - Set push notification alarms using `expo-notifications` for medicine dosages.
   - Local state list management of active alarms with individual removal control.

6. **Interactive BMI Calculator**
   - Custom overlay calculating BMI and listing body classification warnings (Underweight, Normal, Overweight, Obese) with health advice.
   - Option to directly update the calculated height and weight in the user profile.

---

## 📂 Architecture and Directory Structure

The codebase is organized into a modular structure under `src/`:

```
health-guide-app/
├── App.js                   # Application root setup (Redux Provider, Navigation Container, Gestures Root)
├── app.json                 # Expo SDK permissions & configurations (Location, Notifications, Maps)
├── package.json             # Application dependencies & CLI scripts
├── .env                     # Local environment keys (Firebase & Gemini API)
└── src/
    ├── components/          # Reusable styled UI widgets (CustomInput, CustomButton, Card, ChatBubble, BMIModal)
    ├── config/              # App configurations (Theme systems, Firebase init listener)
    ├── navigation/          # React Navigation routers (Root stack, Auth flow, Drawer overlay, Bottom tabs)
    ├── redux/               # Redux Toolkit global state store (Auth state, Health records cache, Chat history)
    ├── screens/             # Segmented application views
    │   ├── auth/            # Login, Registration, Forgot Password forms
    │   ├── dashboard/       # Main home dashboard, profile updates, settings panel
    │   ├── records/         # Records list grid & creation forms
    │   ├── services/        # Healthcare maps & Clinical AI Chatbot interfaces
    │   └── splash/          # Logo splash introductory check screen
    ├── services/            # Auxiliary API integrations (Gemini API, Location fetchers, Expo notifications)
    └── utils/               # Hardcoded tips catalog & validations check methods
```

---

## ⚡ Quick Start: Running the App (Mock Mode)

To make it incredibly easy to explore immediately, **the application has a built-in Mock Mode**. If you do not have Firebase credentials or a Gemini API key yet, the application will automatically:
1. Save user registration & session info in device AsyncStorage.
2. Save Health Records locally.
3. Fallback to an intelligent local AI keyword processor in the Chatbot screen.
4. Set default coordinates for the medical map search.

### Steps to Run the Project:

#### 1. Open the project workspace
Ensure you open the project directory in your terminal or IDE:
```bash
cd C:\Users\laiba\.gemini\antigravity\scratch\health-guide-app
```

#### 2. Install dependencies (If running fresh)
The dependencies are already prepared in `package.json`. If you need to re-verify or download them:
```bash
npm install
```

#### 3. Start the Expo development server
Execute the start script to run the local compiler:
```bash
npm start
```

#### 4. Run on a virtual simulator or mobile device
Once the Expo console loads:
- **For Android Emulator:** Press `a` (requires Android Studio Emulator running).
- **For iOS Simulator:** Press `i` (macOS/Xcode only).
- **For Expo Go app (Real Device):** Scan the QR code displayed in the terminal with your phone camera or the Expo Go application.
- **For Web Preview:** Press `w` (loads in a desktop browser).

---

## 🔧 Configuring Production API Keys

To connect to your own Firebase project and Google Gemini API, update the variables inside the `.env` file at the root of the project:

### 1. File Configuration `.env`
Change the values to match your projects:
```ini
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Gemini API Key for the Healthcare chatbot
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. File Configuration `app.json` (Google Maps for native iOS/Android builds)
Open `app.json` and replace standard API key placeholders if building standalone applications:
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_MAPS_API_KEY_HERE"
        }
      }
    }
  }
}
```
