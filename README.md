<div align="center">
  <h1>🚀 AutoInsight AI</h1>
  <p><strong>AI-Powered Data Analysis Platform (Power BI + ChatGPT Inspired)</strong></p>
  <p>
    <a href="https://autoinsight-ai.rs01.workers.dev/"><b>Live Demo</b></a> •
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
* **Auto-Cleaning:** Automatically cleans unformatted datasets, handling missing values, duplicates, and inconsistencies.
* **Cloud Storage:** Files are securely saved to your account via Supabase Storage.
* **Dataset History:** Previous uploads are accessible across devices and sessions.
* **Auto-Expiry:** Uploaded files are automatically deleted after 48 hours for data hygiene. A secure API route (`/api/cron`) triggered by an external service (e.g., cron-job.org) handles global cleanup, with a client-side fallback.

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
* **Powered by Groq:** Utilizing the lightning-fast Llama 3.3 70B model.

### 🔐 Authentication & Data Security
* **Seamless Login:** Google OAuth powered by Supabase Auth.
* **Secure Navigation:** Route-level auth guards protect all application pages.
* **Data Isolation:** Per-user data isolation utilizing Row Level Security (RLS) in PostgreSQL.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 + Vite + TypeScript |
| **Styling** | Tailwind CSS v4 + Radix UI + Custom Cinematic CSS Animations |
| **Routing** | TanStack Router (SSR-capable) |
| **State Management**| Zustand + localStorage persistence |
| **Backend / Auth** | Supabase (PostgreSQL + Auth + Storage) |
| **AI Engine** | Groq API — Llama 3.3 70B |
| **Visualization** | Recharts |
| **Data Parsing** | PapaParse, SheetJS (xlsx), ExcelJS |
| **Deployment** | Cloudflare Pages |

---

## 📁 Project Structure

```text
AutoInsight-Ai/
├── src/
│   ├── components/       # Reusable React components
│   │   ├── ui/           # Radix UI primitives & generic design components
│   │   ├── Sidebar.tsx   # Main application navigation sidebar
│   │   ├── WorkflowShowcase.tsx # Landing page workflow animation
│   │   └── BackgroundParticles.tsx # Cinematic background effect
│   ├── lib/              # Core utilities and configuration
│   │   ├── parseFile.ts  # CSV/Excel parsing logic (PapaParse, SheetJS)
│   │   ├── supabase.ts   # Supabase client configuration
│   │   ├── theme.ts      # Theming utilities
│   │   └── utils.ts      # Helper functions (Tailwind merge, clsx, etc.)
│   ├── routes/           # TanStack Router page components
│   │   ├── api/          # API routes (e.g., cron jobs)
│   │   ├── index.tsx     # Landing page
│   │   ├── upload.tsx    # Data upload interface
│   │   ├── tables.tsx    # Data grid view
│   │   ├── analytics.tsx # Charts and AI insights
│   │   ├── dashboard.tsx # Main dashboard overview
│   │   └── chat.tsx      # Conversational AI interface
│   ├── store/            # Global state management
│   │   └── dataStore.ts  # Zustand store for dataset state
│   ├── hooks/            # Custom React hooks
│   │   └── use-mobile.tsx # Responsive utility hook
│   ├── router.tsx        # TanStack Router configuration
│   ├── routeTree.gen.ts  # Auto-generated route definitions
│   └── styles.css        # Global CSS, Tailwind config, & Custom Cinematic Styling
├── public/               # Static assets
├── package.json          # Project dependencies and scripts
├── vite.config.ts        # Vite build configuration
├── eslint.config.js      # ESLint configuration
└── wrangler.jsonc        # Cloudflare Workers configuration
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GROQ_API_KEY=your_groq_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_CRON_SECRET=your_secret_cron_password
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

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:8080` (or the port specified by Vite).

---

## 🚀 Deployment

* **Hosting:** Natively optimized for **Cloudflare Pages** via `wrangler.jsonc`.
* **Configuration:** Environment variables must be configured in the Cloudflare dashboard.
* **Cron Jobs:** Automated 48-hour background cleanup powered by a secure `/api/cron` route, scheduled via [cron-job.org](https://cron-job.org/).
* **CI/CD:** Automatic deployments configured via GitHub integrations.

---

## 🧠 Why This Project Stands Out

Provides an end-to-end data pipeline in a single, visually striking interface:
`Upload → Clean → Visualize → AI Insights → Chat → Export`

* **Full-dataset AI context:** Column stats computed over all rows, not a sample.
* **Cloud persistence with auto-expiry:** Zero manual cleanup needed.
* **Production-grade architecture:** Secure routing, authentication, and RLS.
* **Cinematic UI:** A highly polished, dynamic aesthetic that feels premium and state-of-the-art.

---

## 📌 Future Improvements

* Serverless proxy for AI API calls (remove frontend key exposure).
* Streaming AI responses in Chat for better perceived latency.
* Predictive analytics using dedicated ML models.
* Multi-user dataset sharing capabilities.

---

<div align="center">
  <p>Developed by <strong>Rishabh Singh</strong> • <a href="https://github.com/rishabhsingh8445">GitHub Profile</a></p>
  <p>⭐ If you found this project useful, consider giving it a star on GitHub!</p>
</div>