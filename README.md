# VIRGIL — AI-Powered Payroll Fraud Detection

> **Squad Hackathon 3.0 · Challenge 01: Proof of Life**

[![MIT License](https://img.shields.io/badge/license-MIT-red.svg)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React_+_Vite-61dafb?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/AI_Service-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![Node](https://img.shields.io/badge/Backend-Node.js_+_Express-339933?logo=node.js)](https://nodejs.org)
[![Squad](https://img.shields.io/badge/Payments-Squad_API-FF4444)](https://squadco.com)

---

## The Problem

Ghost workers cost the Nigerian government an estimated **₦200 billion+** annually.  
Existing solutions detect fraud *after* money has already moved.  
**VIRGIL stops the payment before it happens.**

---

## How It Works

```
HR uploads CSV → AI scores every worker → Verified: Squad pays → Flagged: Payment blocked
```

1. **HR uploads** a payroll batch (CSV or manual entry)
2. **AI engine** scores every worker — flags anomalies across 6 fraud signals in real time
3. **Verified workers** → Squad API releases salary payment immediately
4. **Flagged workers** → Payment blocked, HR alerted for manual review
5. **Full audit trail** — every decision, every payment, immutably logged

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              VIRGIL System                   │
│                                             │
│  ┌─────────┐   REST    ┌───────────────┐   │
│  │  React  │ ────────► │  Node/Express │   │
│  │ Frontend│           │    Backend    │   │
│  └─────────┘           └──────┬────────┘   │
│                               │             │
│                    ┌──────────┴──────────┐  │
│                    │                     │  │
│            ┌───────▼──────┐   ┌─────────▼─┐│
│            │  FastAPI AI  │   │ Squad API  ││
│            │  (Python ML) │   │ (Payments) ││
│            └──────────────┘   └───────────┘│
│                    │                        │
│            ┌───────▼──────┐                 │
│            │  SQLite DB   │                 │
│            │ (Offline-    │                 │
│            │   ready)     │                 │
│            └──────────────┘                 │
└─────────────────────────────────────────────┘
```

---

## AI Fraud Signals

The Isolation Forest and relationship detection system scores every worker on **6 signals**:

| Signal | Description |
|--------|-------------|
| `nin_count` | Duplicate NIN across payroll records |
| `account_count` | Single bank account linked to multiple workers |
| `salary_zscore` | Salary deviation from department average |
| `missing_score` | Count of absent critical fields |
| `attendance_score` | Gaps or critically low attendance records |
| `days_since_verification`| Days since last biometric verification |

> Model accuracy: **Isolation Forest trained on distinct fraud archetypes**

---

## Squad API Integration

VIRGIL uses Squad as the **payment gate** — verified workers are paid, ghost workers are blocked:

```
POST /payments/release-batch
  → Squad Transfer API for each VERIFIED worker
  → Payment reference stored in audit log

GET  /payments/stats
  → Real-time breakdown of blocked vs released funds
```

- Sandbox environment: `https://sandbox-api-d.squadco.com`
- Each disbursement carries a unique `SQD-SAL-{date}-{id}` reference
- Zero funds move for flagged workers — blocked before Squad is even called

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Framer Motion |
| Backend | Node.js, Express, Sequelize |
| AI Service | Python 3, FastAPI, scikit-learn (Isolation Forest) |
| OCR | Tesseract via pytesseract |
| Database | SQLite (offline-ready, zero config) |
| Payments | Squad API |
| Styling | Vanilla CSS design system (dark/light theme) |

---

## Getting Started

### Prerequisites
- Node.js v18+
- Python 3.10+
- Git

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/virgil-proof-of-life.git
cd virgil-proof-of-life
```

### 2. Set up environment variables
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:
```env
SQUAD_SECRET_KEY=your_squad_sandbox_key
SQUAD_BASE_URL=https://sandbox-api-d.squadco.com
JWT_SECRET=your_random_secret
AI_SERVICE_URL=http://localhost:8000
PORT=3001
```

Edit `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3001
```

### 3. Run the Backend
```bash
cd backend
npm install
npm run dev
# → http://localhost:3001
```

### 4. Run the AI Service
```bash
cd ai
pip install -r requirements.txt
python -m uvicorn api:app --reload
# → http://localhost:8000
```

### 5. Run the Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Project Structure

```
virgil-proof-of-life/
├── frontend/              # React + Vite UI
│   └── src/
│       ├── pages/         # SplashScreen, Dashboard, Results, Payments...
│       ├── components/    # Sidebar, ThemeToggle
│       └── lib/           # API client, demo data
├── backend/               # Node.js Express API
│   └── src/
│       ├── routes/        # workers, payments, payroll, attendance
│       ├── models/        # Sequelize models (Worker, AuditEntry...)
│       └── services/      # aiService, squadService
├── ai/                    # Python FastAPI AI microservice
│   ├── api.py             # FastAPI endpoints
│   └── requirements.txt
└── docs/                  # Architecture diagrams, demo script
```

---

## Demo Flow

See [`docs/demo-script.md`](docs/demo-script.md) for the full 5-minute demo walkthrough.

**Quick demo path:**
1. Open `http://localhost:5173`
2. Watch the cinematic splash → click through onboarding
3. On Dashboard → click **"Upload payroll"**
4. Upload `demo_clean_payroll.csv` or `demo_public_hr.csv`
5. AI scores all workers → Results screen shows flagged ghosts
6. Navigate to **Payments** → release verified salaries via Squad
7. Check **Audit Trail** → every action logged

---

## Team

Built for Squad Hackathon 3.0 · Challenge 01: Proof of Life

---

## License

[MIT](LICENSE)
