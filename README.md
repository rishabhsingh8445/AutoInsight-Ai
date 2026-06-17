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

### 📂 Smart Data Processing
* **Multi-format Support:** Upload CSV / Excel files.
* **Auto-Cleaning:** Automatically cleans unformatted datasets, handling missing values, duplicates, and inconsistencies using Pandas.
* **Cloud Storage:** Files are securely saved to your account via Supabase Storage.
* **Dataset History:** Previous uploads are accessible across devices and sessions.

### 📊 Power BI–Style Tables
* **Conditional Formatting:** Low / Mid / High color coding for instant visual data comprehension.
* **Interactive Grid:** Structured tabular data view with sort, search, and filter capabilities across all columns.
* **Export:** Download your cleaned and formatted dataset as an Excel file.

### 📈 Interactive Analytics Engine
* **Dynamic Charts:** Support for Bar, Line, Pie, and Scatter charts powered by Recharts.
* **Custom Configurations:** Custom X/Y axis selection and real-time aggregation (Sum, Avg, Min, Max).
* **Advanced Filtering:** Multi-column filtering to slice and dice your data.
* **Drill-down:** Capture insights with bookmark snapshots.

### 🤖 AI Dashboard Insights
* **Deep Analysis:** Auto-generated dataset summaries and key insights extraction computed over the **full dataset** (not just a sample).
* **Intelligence:** Built-in anomaly detection and actionable recommendations.
* **Reporting:** Export comprehensive AI insights as a branded PDF report.

### 💬 Chat with Data (AI Assistant)
* **Conversational Interface:** Ask questions about your data in plain English.
* **High Accuracy:** Full column-level statistics are sent as context, ensuring accurate answers even across 10,000+ row datasets.
* **Powered by Groq:** Utilizing the lightning-fast Llama 3.3 70B model via a secure Python proxy backend.

### 🔐 Authentication & Data Security
* **Seamless Login:** Google OAuth powered by Supabase Auth (with secure HTTP-only cookies).
* **Secure API:** API keys are never exposed to the frontend; all AI and Database requests run through a secure FastAPI backend.
* **Data Isolation:** Per-user data isolation utilizing Row Level Security (RLS) in PostgreSQL.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 + Vite + TypeScript |
| **Backend** | Python + FastAPI + Pandas |
| **Styling** | Tailwind CSS v4 + Radix UI + Custom Cinematic CSS Animations |
| **Routing** | TanStack Router |
| **State Management**| Zustand + localStorage persistence |
| **Database / Auth** | Supabase (PostgreSQL + Auth + Storage) |
| **AI Engine** | Groq API — Llama 3.3 70B (Proxied through FastAPI) |
| **Visualization** | Recharts |

---

## 📁 Project Structure

```text
AutoInsight-Ai/
├── frontend/             # React Vite Application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── lib/          # Utilities, API fetchers
│   │   ├── routes/       # TanStack Pages (Upload, Tables, Dashboard)
│   │   ├── store/        # Zustand global state
│   │   └── styles.css    # Cinematic Styling
│   ├── package.json
│   └── vite.config.ts    # Proxies API requests to Python
│
├── backend/              # Python FastAPI Application
│   ├── routes/
│   │   ├── auth.py       # Supabase PKCE OAuth Flow
│   │   ├── chat.py       # Secure Groq AI endpoint
│   │   └── datasets.py   # Pandas CSV/Excel Data parsing & storage
│   ├── core/             # Supabase client config
│   ├── requirements.txt
│   └── main.py           # FastAPI server entry point
│
└── .env                  # Shared environment variables
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GROQ_API_KEY=your_groq_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🗄️ Supabase Setup

### 1. Create the `datasets` table

```sql
create table datasets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  row_count integer,
  column_count integer,
  columns text[],
  uploaded_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '48 hours')
);

alter table datasets enable row level security;

create policy "Users see own datasets"
  on datasets for all
  using (auth.uid() = user_id);
```

### 2. Configure Storage Bucket

Create a private bucket named `datasets` in Supabase Storage, then apply the following policies:

```sql
create policy "Users can upload own files"
on storage.objects for insert to authenticated
with check (bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can read own files"
on storage.objects for select to authenticated
using (bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own files"
on storage.objects for delete to authenticated
using (bucket_id = 'datasets' AND (storage.foldername(name))[1] = auth.uid()::text);
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
   python main.py
   ```
   *The backend will run on `http://localhost:8000`*

3. **Start the React Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`. API requests are automatically proxied to Port 8000.*

---

## 🚀 Deployment

- **Frontend:** Can be deployed as a static site (Cloudflare Pages, Vercel, Netlify) with build command `npm run build`.
- **Backend:** Can be deployed to any Python host (Render, Railway, AWS, DigitalOcean) running `uvicorn main:app --host 0.0.0.0 --port 8000`.

---

## 🧠 Why This Project Stands Out

Provides an end-to-end data pipeline in a single, visually striking interface:
`Upload → Clean → Visualize → AI Insights → Chat → Export`

* **Full-dataset AI context:** Column stats computed over all rows, not a sample.
* **Secure API Architecture:** API keys and heavy data processing are securely handled by a Python FastAPI backend.
* **Production-grade architecture:** Secure routing, HTTP-only cookies, and Row Level Security.
* **Cinematic UI:** A highly polished, dynamic aesthetic that feels premium and state-of-the-art.

---

<div align="center">
  <p>Developed by <strong>Rishabh Singh</strong> • <a href="https://github.com/rishabhsingh8445">GitHub Profile</a></p>
  <p>⭐ If you found this project useful, consider giving it a star on GitHub!</p>
</div>