<div align="center">
  <h1>🚀 AutoInsight AI</h1>
  <p><strong>AI-Powered Data Analysis Platform (Power BI + ChatGPT Inspired)</strong></p>
  <p>
    <a href="#-core-features"><b>Features</b></a> •
    <a href="#️-tech-stack"><b>Tech Stack</b></a> •
    <a href="#-project-structure"><b>Structure</b></a>
  </p>
</div>

---

AutoInsight AI is an advanced, visually stunning data analysis platform that transforms raw, unstructured datasets into clean, interactive, and insight-rich dashboards — without writing a single line of code.

It features a **cinematic dark tech UI** and combines **data cleaning, visualization, AI insights, and conversational analytics** into one unified, seamless interface.

---

## ⚡ Core Features

### 📂 Smart Data Processing & Storage
* **Multi-format Support:** Upload CSV and Excel files.
* **Client-Side Parsing:** Files are processed locally in the browser (via PapaParse/XLSX) to bypass server timeouts, allowing seamless handling of massive datasets (e.g., 50k+ rows).
* **Auto-Cleaning:** Automatically cleans datasets, removes empty rows/duplicates, and detects correct data types.
* **Cloud Storage:** Files are securely saved to your account via Supabase Storage.
* **Dataset History:** Previous uploads are accessible across devices and sessions.

### 📊 Power BI–Style Tables
* **Conditional Formatting:** Low / Mid / High color coding for instant visual data comprehension.
* **Interactive Grid:** Structured tabular data view with sort, search, and filter capabilities across all columns.
* **Excel Export:** Download your cleaned and formatted dataset locally as a modern Excel (`.xlsx`) file.

### 📈 Interactive Analytics Engine
* **Dynamic Charts:** Support for Bar, Line, Pie, and Scatter charts powered by Recharts.
* **High-Res Snapshots:** Export premium, dark-mode, high-resolution PNG snapshots of your charts along with their active filters, drill-downs, and KPI metadata.
* **Custom Configurations:** Custom X/Y axis selection and real-time aggregation (Sum, Avg, Min, Max).
* **Drill-down & Bookmarks:** Capture insights with bookmark snapshots to save and load your chart configurations.

### 🤖 AI Dashboard Insights
* **Deep Analysis:** Auto-generated dataset summaries and key insights extraction computed over the **full dataset** (not just a sample).
* **Intelligence:** Built-in anomaly detection and actionable recommendations.
* **PDF Reporting:** Export comprehensive AI insights as a clean, branded PDF report.

### 💬 Chat with Data (AI Assistant)
* **Conversational Interface:** Ask questions about your data in plain English.
* **High Accuracy:** Full column-level statistics are sent as context, ensuring accurate answers even across huge datasets.
* **Powered by Groq:** Utilizing the lightning-fast Llama 3.3 70B model via a secure Python FastAPI backend.

### 🔐 Authentication & Data Security
* **Seamless Login:** Google OAuth powered by Supabase Auth (with secure session management).
* **Secure API:** API keys are never exposed to the frontend; all AI and Database requests run through a secure backend.
* **Data Isolation:** Per-user data isolation utilizing Row Level Security (RLS) in PostgreSQL.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 + Vite + TypeScript |
| **Backend** | Python + FastAPI |
| **Styling** | Tailwind CSS v4 + Radix UI + Custom Cinematic CSS Animations |
| **Routing** | TanStack Router |
| **State Management**| Zustand + localStorage persistence |
| **Database / Auth** | Supabase (PostgreSQL + Auth + Storage) |
| **AI Engine** | Groq API — Llama 3.3 70B (Proxied through FastAPI) |
| **Data & Charts** | Recharts, PapaParse, XLSX, ExcelJS, jsPDF |

---

## 📁 Project Structure

```text
AutoInsight-Ai/
├── frontend/             # React Vite Application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── lib/          # Data parsers, Exporters (Excel/PDF/Snapshots), Utilities
│   │   ├── routes/       # TanStack Pages (Upload, Tables, Analytics, Dashboard)
│   │   ├── store/        # Zustand global state
│   │   └── styles.css    # Cinematic Styling
│   ├── package.json
│   └── vite.config.ts
│
├── backend/              # Python FastAPI Application
│   ├── routes/
│   │   ├── auth.py       # Supabase Session validation
│   │   ├── chat.py       # Secure Groq AI endpoint
│   │   └── datasets.py   # Dataset metadata management
│   ├── core/             # Supabase client config
│   ├── requirements.txt
│   └── main.py           # FastAPI server entry point
│
└── .env                  # Shared environment variables
```

---

## ⚙️ Environment Variables

Create a `.env` file in the backend directory:

```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Create a `.env` file in the frontend directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000  # Or your deployed backend URL
```

---

## 💻 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rishabhsingh8445/AutoInsight-Ai.git
   cd AutoInsight-Ai
   ```

2. **Start the Python Backend (Terminal 1):**
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate   # (Windows)
   # source venv/bin/activate # (Mac/Linux)
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   *The backend will run on `http://localhost:8000`*

3. **Start the React Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`*

---

## 🚀 Deployment

- **Frontend:** Fully optimized for deployment on Vercel, Netlify, or Cloudflare Pages with `npm run build`.
- **Backend:** Ready for deployment on platforms like Render, Railway, or AWS running `uvicorn main:app --host 0.0.0.0 --port $PORT`.

---

## 🧠 Why This Project Stands Out

Provides an end-to-end data pipeline in a single, visually striking interface:
`Upload → Clean → Visualize → AI Insights → Chat → Export`

* **Massive File Performance:** By processing the heavy-lifting of file parsing and deduplication directly inside the user's browser, the application completely avoids server-side memory limits and API timeouts (bypassing Vercel's 4.5MB payload limit entirely).
* **Export Anything:** Download raw data as cleaned Excel files, detailed text reports as PDFs, and high-fidelity custom data visualizations as PNG snapshots.
* **Full-dataset AI context:** Column stats computed over all rows, not a sample.
* **Cinematic UI:** A highly polished, dynamic aesthetic that feels premium and state-of-the-art.

---

<div align="center">
  <p>Developed by <strong>Rishabh Singh</strong> • <a href="https://github.com/rishabhsingh8445">GitHub Profile</a></p>
  <p>⭐ If you found this project useful, consider giving it a star on GitHub!</p>
</div>