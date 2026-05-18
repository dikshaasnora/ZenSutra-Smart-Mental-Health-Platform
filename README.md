# 🌿 ZenSutra — Smart Mental Health Platform

[![Live App](https://img.shields.io/badge/Live_App-zensutra.vercel.app-52b788?style=for-the-badge&logo=vercel)](https://zensutra.vercel.app/)

ZenSutra is a next-generation, smart mental health platform tailored specifically for students. Combining state-of-the-art AI-driven wellness support, secure clinical assessments, interactive relaxation tools, and direct connectivity to professional human counseling, ZenSutra serves as a safe, confidential, and premium digital space for mental well-being.

Originally designed with standard HTML/JS, ZenSutra has been fully migrated to a modular, high-performance **React.js (Vite)** frontend coupled with a robust, secure **Node.js/Express/MongoDB** backend.

---

## ✨ Key Features

### 1. 🤖 Zen AI — Empathetic Wellness Companion
* **Gemini-Powered Support:** Employs Google's Gemini API for crisis detection, bilingual (English/Hindi) empathetic listening, and personalized coping strategies.
* **Proactive Interventions:** Dynamically detects distress or crisis-related keywords and provides immediate contact details for established emergency lines.

### 2. 📊 Dynamic Mood Tracker & Insights
* **Interactive Logs:** Allows quick emoji check-ins (Happy, Calm, Anxious, Sad, etc.) directly from the main dashboard.
* **Data Visualization:** Seamlessly plots weekly mood variations using a responsive linear chart (`Chart.js`).
* **Trend Analysis:** Backend analyzes stored records to calculate running wellness streaks and generate progress summaries.

### 3. 🔬 Clinical Assessments & Analytics
* **Validated Questionnaires:** Interactive testing modules for **DASS-21**, **GAD-7**, and **PHQ-9** scales.
* **Intelligent Scoring:** Automatically aggregates scores to determine risk thresholds (Low, Moderate, High, Severe).
* **Automated Recommendations:** Instantly designs custom wellness pathways, lifestyle suggestions, and stress-reduction checklists based on specific assessment metrics.

### 4. 🩺 Confidential Counselor Booking
* **Direct Care:** Enables scheduling of secure sessions with certified counselors across various modes (Video, Audio, or In-person).
* **Transactional Mailers:** Integrated with Nodemailer to dispatch confirmation cards containing verified Booking IDs.

### 5. 🌬️ Interactive Breathing Exercises
* **Paced Regulators:** Box Breathing, 4-7-8, and Physiological Sigh regulators with synchronized timers.

### 6. 🛡️ Robust Security & User Customization
* **Secure Sessions:** Dual JWT-based verification for standard registration/logins and temporary frontend-safe sessions for Guest previews.
* **Identity Controls:** Dynamic toggles for anonymous forum/community modes, AI chat memory configurations, and overall data control (JSON exports and permanent account deletion cascades).

---

## 🛠️ Technology Stack

### **Frontend**
* **Core:** React.js, React Router DOM (v6)
* **Build System:** Vite
* **Styling:** Premium Glassmorphic HSL Design, FontAwesome Icons, Google Fonts (DM Serif Display & DM Sans)
* **Visualization:** Chart.js

### **Backend**
* **Core Engine:** Node.js, Express.js
* **Database:** MongoDB, Mongoose ODM
* **Security & Middleware:** Helmet, CORS Policy, Express-Rate-Limit, Morgan logger
* **Authentication:** JSON Web Tokens (JWT), BCrypt.js
* **Mailing Service:** Nodemailer

---

## 🚀 Getting Started

### **Prerequisites**
* [Node.js](https://nodejs.org/) (v18.x or above recommended)
* [MongoDB](https://www.mongodb.com/) (Local instance or Atlas Connection URI)

### **Installation & Setup**

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/dikshaasnora/ZenSutra-Smart-Mental-Health-Platform.git
   cd ZenSutra-Smart-Mental-Health-Platform
   ```

2. **Configure Backend Environment Variables:**
   Create a `.env` file inside the `backend` directory:
   ```env
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   GEMINI_API_KEY=your_google_gemini_api_key
   
   # Optional SMTP credentials for counseling notifications
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   ```

3. **Install Backend Dependencies & Run:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *The API will start running on port `5001`.*

4. **Install Frontend Dependencies & Run:**
   ```bash
   cd ../frontend-react
   npm install
   npm run dev
   ```
   *The development server will launch locally (typically at `http://localhost:5173` or `5174`).*

---

## 📂 Project Structure

```text
ZenSutra-Smart-Mental-Health-Platform/
├── backend/                  # Express.js REST API
│   ├── models.js             # Mongoose Schemas (User, Mood, Assessment, Appointment)
│   ├── authcontroller.js     # Auth routines (login, register, guest creation)
│   ├── controller.js         # Core controllers (Mood, Profile, Reports, Bookings)
│   ├── routes.js             # Express routing mapping
│   ├── server.js             # Server config & CORS handler
│   └── emailservice.js       # SMTP helper integration
│
├── frontend-react/           # Single Page React Application
│   ├── src/
│   │   ├── components/       # Common layouts (Sidebar, etc.)
│   │   ├── context/          # Context stores (AuthContext, NotificationContext)
│   │   ├── pages/            # Page-view modules (Dashboard, AISupport, Breathe, etc.)
│   │   ├── App.jsx           # Main routing & imports
│   │   ├── index.css         # Styling system & Glassmorphic variables
│   │   └── config.js         # Client-side API mapping
│   ├── vite.config.js        # Vite bundler configurations
│   └── package.json
│
└── .gitignore                # Global workspace rule configuration
```

---

## 🛡️ Privacy & Compliance
ZenSutra values user privacy highly:
* All credentials are encrypted using industry-standard hashing protocols (`bcryptjs`).
* Interactive services utilize local browser caching, providing single-click profile exports.
* Full deletion requests execute a cascade routine, completely scrubbing the active database records associated with the user.

---

## 💚 Contribution & Community
Built for students, by students. Feel free to raise an issue, request features, or submit pull requests to build a safer digital wellness space!
