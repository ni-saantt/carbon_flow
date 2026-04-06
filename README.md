# 🌿 CarbonFlow

CarbonFlow is a premium, enterprise-grade sustainability platform built to help organizations track, analyze, and strategically reduce their carbon footprints. It transforms raw emission data into actionable intelligence through automated data visualization, collaborative team initiatives, and AI-driven reduction engines.

## ✨ Key Features
- **Intuitive Intelligence Dashboard:** Real-time KPI metrics and dynamic Recharts-powered graphs (Stacked Bar Charts, Doughnut Charts) offering live Scope 1, 2, and 3 emission breakdowns.
- **Collaborative Initiatives Hub:** A multiplayer enterprise workspace where System Admins can launch industry-standard carbon reduction templates, and employees can "Join" them to collectively track participation.
- **AI Strategy Engine:** Fully integrated with Google's Gemini AI to algorithmically analyze your exact organizational emission data and synthesize tailored, actionable ESG reports instantly.
- **Automated Reporting:** Generates dynamic, filterable, and paginated data tables from user logs that can be instantly exported to cleanly formatted CSVs for compliance audits.
- **Highly Secure Architecture:** Built entirely on Next.js App Router and secured by Supabase PostgreSQL Row-Level Security (RLS) policies.

## 🛠️ Tech Stack
- **Frontend Component Layer:** Next.js 14 (App Router), React, Recharts, Vanilla CSS Custom Properties (HSL Glassmorphism), Lucide Vectors.
- **Backend Infrastructure:** Supabase (PostgreSQL, Authentication, RLS Access Policies).
- **Artificial Intelligence:** Google Generative AI SDK (`gemini-pro`).

---

## 🚀 Getting Started

Follow these steps to safely set up and run the CarbonFlow application on your local machine.

### Prerequisites
1. **Node.js** (v18 or higher)
2. A **Supabase Account** (to host the PostgreSQL database and handle Authentication)
3. A **Google AI Studio Key** (for authenticating the Gemini API)

### 1. Clone the Repository
```bash
git clone https://github.com/ni-saantt/carbon_flow.git
cd carbon_flow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a new file named `.env.local` in the root folder of the project. Insert the following keys and update them with your live credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_supabase_postgresql_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
```

### 4. Setup the Supabase Database
You must configure the required relational tables before launching the dashboard.
1. Log into your Supabase Dashboard online.
2. Navigate to the **SQL Editor** tab on the left.
3. Locate the `supabase/` folder provided in this repository.
4. Open the file `supabase/schema.sql`, copy all text, paste it into the SQL Editor, and click **Run**. This establishes the core tables, UUID relations, and security policies.
5. Open the secondary file `supabase/initiatives_schema.sql`, copy all text, paste it, and click **Run**. This enables the enterprise Collaborative Initiatives backend logic.

### 5. Run the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. You will immediately be redirected to the secure login shell.

---

### 📝 Important Development Notes
When testing the platform natively:
- Signing up automatically drafts you as a standard **Member**.
- To test the prestigious Admin features (like utilizing the AI Engine or launching Company Initiatives), navigate to the `users` table via the Supabase Table Editor and manually change your user column's `role` from `Member` to `admin`. Ensure you refresh your frontend afterward.
