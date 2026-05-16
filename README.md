# AutoInsight AI 🚀
### AI-Powered Data Analysis Platform (Power BI + ChatGPT Inspired)

AutoInsight AI is an advanced data analysis platform that transforms raw, unstructured datasets into clean, interactive, and insight-rich dashboards — without writing a single line of code.

It combines **data cleaning, visualization, AI insights, and conversational analytics** into one unified interface.

---

## 🌐 Live Demo

👉 https://autoinsight-ai.rs01.workers.dev/

---

## ⚡ Core Features

### 📂 Smart Data Processing
- Upload CSV / Excel files
- Automatically cleans unformatted datasets
- Handles missing values, duplicates, inconsistencies
- **Cloud storage** — files saved to your account via Supabase Storage
- **Dataset history** — previous uploads accessible across devices and sessions
- **Auto-expiry** — uploaded files are automatically deleted after 48 hours. A secure API route (`/api/cron`) triggered by an external cron service (e.g., cron-job.org) wipes expired data globally, with a client-side fallback for logged-in users.

---

### 📊 Power BI–Style Tables
- Conditional formatting (Low / Mid / High color coding)
- Structured tabular data view
- Sort, search, and filter across all columns
- Download dataset as formatted Excel file

---

### 📈 Interactive Analytics Engine
- Multi-column filtering
- Dynamic charts (Bar, Line, Pie, Scatter)
- Real-time aggregation (Sum, Avg, Min, Max)
- Custom X/Y axis selection
- Drill-down with bookmark snapshots

---

### 🤖 AI Dashboard Insights
- Auto-generated dataset summary
- Key insights extraction computed over the **full dataset** (not a sample)
- Anomaly detection
- Actionable recommendations
- Export insights as PDF report

---

### 💬 Chat with Data (AI Assistant)
- Ask questions in plain English
- Full column-level statistics sent as context — accurate answers across 10,000+ row datasets
- Powered by Groq (Llama 3.3 70B)

---

### 🔐 Authentication & Data Security
- Google OAuth via Supabase Auth
- Route-level auth guards — all pages protected
- Per-user data isolation (Row Level Security)
- Logout clears local session data instantly

---

### 📄 Export System
- Download cleaned dataset as Excel with conditional formatting
- Export AI insights as branded PDF

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + TypeScript |
| Routing | TanStack Router (SSR-capable) |
| State | Zustand + localStorage persistence |
| Backend / Auth | Supabase (PostgreSQL + Auth + Storage) |
| AI | Groq API — Llama 3.3 70B |
| Charts | Recharts |
| Deployment | Cloudflare Pages |

---

## 📁 Project Structure

```
project-root/
├── src/
│   ├── components/       # Sidebar, MissingKeysBanner, UI primitives
│   ├── lib/              # parseFile.ts, supabase.ts
│   ├── routes/           # upload, tables, dashboard, analytics, chat
│   ├── store/            # dataStore.ts, settingsStore
│   ├── router.tsx
│   └── styles.css
├── public/
├── package.json
└── vite.config.ts
```

---

## ⚙️ Environment Variables

Create a `.env` file:

```
VITE_GROQ_API_KEY=your_groq_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_CRON_SECRET=your_secret_cron_password
```

---

## 🗄️ Supabase Setup

### 1. Create the datasets table

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

### 2. Create the storage bucket

Create a private bucket named `datasets` in Supabase Storage, then add policies:

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

```bash
git clone https://github.com/rishabhsingh8445/AutoInsight-Ai.git
cd AutoInsight-Ai
npm install
npm run dev
```

App runs on: http://localhost:8080

---

## 🚀 Deployment

- Hosted on **Cloudflare Pages** (natively optimized via `wrangler.jsonc`)
- Environment variables configured in the Cloudflare dashboard
- Automated 48-hour background cleanup powered by a secure `/api/cron` route, scheduled via [cron-job.org](https://cron-job.org/)
- Automatic CI/CD via GitHub

---

## 🔐 Security Notes

- API keys stored in environment variables — never committed to source
- Supabase RLS ensures users can only access their own data
- Storage policies enforce per-user file isolation
- Session data cleared on logout

---

## 🧠 Why This Project Stands Out

End-to-end data pipeline in a single interface:

```
Upload → Clean → Visualize → AI Insights → Chat → Export
```

- Full-dataset AI context — column stats computed over all rows, not a sample
- Cloud persistence with auto-expiry — no manual cleanup needed
- Production-grade auth with route guards and RLS
- Combines: Power BI + AI Analyst + Data Cleaner

---

## 📌 Future Improvements

- Serverless proxy for AI API calls (remove frontend key exposure)
- Streaming AI responses in Chat
- Predictive analytics (ML models)
- Multi-user dataset sharing

---

## 👨‍💻 Author

**Rishabh Singh**
[GitHub](https://github.com/rishabhsingh8445)

---

## ⭐ Support

If you found this useful, consider giving a ⭐ on GitHub