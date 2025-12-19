# 🏥 MediConnect

**AI-Powered University Campus Healthcare Management System**

MediConnect is a comprehensive digital healthcare solution designed specifically for university campuses, featuring an **advanced AI-powered symptom checker** that provides intelligent health assessments for students.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 🤖 AI-Powered Features

### Intelligent Symptom Checker
MediConnect's crown jewel is its **AI-powered diagnostic assistant** built using the **Hugging Face Transformers library** (`@xenova/transformers`). This advanced system:

- 🧠 **Natural Language Processing**: Analyzes user-described symptoms using state-of-the-art NLP models
- 📊 **Confidence Scoring**: Provides ranked diagnoses with confidence percentages (High/Medium/Low)
- 🎯 **Multi-Condition Detection**: Identifies multiple possible conditions based on symptom combinations
- 👤 **Personalized Analysis**: Considers patient demographics (age, gender) for more accurate predictions
- 💡 **Smart Recommendations**: Generates tailored medical advice and next steps
- ⚡ **Real-Time Processing**: Delivers instant AI analysis with beautiful loading animations

### How the AI Works
```
User Input → Symptom Selection → AI Processing → Diagnosis Results
    ↓              ↓                  ↓               ↓
 Age/Gender    160+ Symptoms    Transformers.js   Confidence Scores
                                                  Recommendations
                                                  Severity Levels
```

The AI analyzes symptoms against a comprehensive medical knowledge base, providing:
- **Primary Diagnosis** with overall confidence level
- **Possible Conditions** ranked by probability
- **Urgency Indicators** (Emergency/High/Medium/Low)
- **Medical Recommendations** for each condition
- **When to Seek Help** guidance

---

## ✨ Key Features

### For Students 👨‍🎓
| Feature | Description |
|---------|-------------|
| 🤖 **AI Symptom Checker** | Intelligent health assessment with 160+ symptoms |
| 📅 **Appointment Booking** | Easy online scheduling with the campus clinic |
| 📋 **Medical History** | Access your complete health records |
| 💊 **Health Tips** | Personalized wellness recommendations |
| 📞 **Contact Support** | Direct communication with healthcare staff |

### For Clinic Staff 👩‍⚕️
| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | Overview of appointments and patient stats |
| 📦 **Inventory Management** | Track medical supplies and medications |
| 👥 **Patient Management** | View and manage patient records |
| 📈 **Analytics & Reports** | Data-driven insights with export options |
| ⚠️ **Low Stock Alerts** | Automated notifications for inventory |

### For Administrators 👨‍💼
| Feature | Description |
|---------|-------------|
| 👤 **User Management** | Add, edit, and manage system users |
| 📊 **Advanced Analytics** | Comprehensive reports with charts |
| 🔐 **Access Control** | Role-based permissions system |
| 📋 **System Reports** | PDF/CSV export capabilities |

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with Express.js 5
- **Database**: Supabase (PostgreSQL)
- **AI/ML**: Hugging Face Transformers (`@xenova/transformers`)
- **Email**: SendGrid & MailerSend integration
- **Image Processing**: Sharp

### Frontend
- **Styling**: TailwindCSS with custom animations
- **Charts**: Chart.js for data visualization
- **PDF Generation**: jsPDF with AutoTable
- **Icons**: Heroicons

### AI & Machine Learning
- **Framework**: Transformers.js (Hugging Face)
- **Capabilities**: Zero-shot classification, text analysis
- **Model Loading**: Client-side inference with WebGL acceleration

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lord-william/MyUMP-Mediconnect.git
   cd MyUMP-Mediconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SENDGRID_API_KEY=your_sendgrid_api_key
   ```

4. **Start the server**
   ```bash
   node server.js
   ```

5. **Start the AI service** (runs on port 5002)
   ```bash
   # AI diagnosis service runs separately
   node ai-service.js
   ```

6. **Access the application**
   - Main App: `http://localhost:5000`
   - AI Service: `http://localhost:5002`

---

## 📁 Project Structure

```
MediConnect/
├── 📂 model/              # Database models and schemas
├── 📂 routes/             # API route handlers
│   ├── auth.js            # Authentication
│   ├── book.js            # Appointment booking
│   ├── diagnostics.js     # AI diagnosis storage
│   ├── inventory.js       # Stock management
│   └── ...
├── 📂 middleware/         # Express middleware
├── 📂 public/             # Frontend assets
│   ├── 📂 js/             # JavaScript modules
│   ├── diagnosis.html     # 🤖 AI Symptom Checker
│   ├── studentDashboard.html
│   ├── clinicDashboard.html
│   └── ...
├── app.js                 # Express app configuration
├── server.js              # Server entry point
└── package.json
```

---

## 🔒 Security Features

- 🔐 **JWT Authentication** - Secure token-based auth
- 🛡️ **Role-Based Access** - Students, Staff, and Admin roles
- 🚫 **Error Handling** - Custom 401, 403, 404, 500 pages
- 🔑 **Password Recovery** - Secure reset via email
- 🍪 **Session Management** - Secure session handling

---

## 🧪 Testing

Run the test suite:
```bash
npm test
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 📞 Contact

**MediConnect - University of Mpumalanga Campus Clinic**

- 📧 Email: campusclinic@ump.ac.za
- 📱 Phone: +27 76 049 6387

---

<p align="center">
  <strong>© 2025 MediConnect. All rights reserved.</strong>
  <br>
  <em>Empowering campus healthcare with AI 🚀</em>
</p>
