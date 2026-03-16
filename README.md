# QOS ET Quality Report

**Last Updated**: 2026-03-16

Web application for analyzing manufacturing quality data (SAP S/4HANA exports). It processes Excel files (complaints/notifications, deliveries, plant master data) to generate KPIs (incl. PPM) and AI-assisted insights.

## Key capabilities

- **Quality metrics**: Q1 (Customer), Q2 (Supplier), Q3 (Internal), Deviations (D*), PPAP (P*)
- **PPM calculation**:
  - Customer PPM = (Q1 defective parts / customer deliveries) × 1,000,000
  - Supplier PPM = (Q2 defective parts / supplier deliveries) × 1,000,000
- **Dashboards & pages**: KPI tiles, charts, tables, filters (plants/months), AI insights
- **Uploads**: Structured multi-file uploads + progress + change history + manual entry form
- **Incremental uploads**: complaints and deliveries can be uploaded separately; KPIs recalculate once both exist
- **Large dataset support**: parsed uploads are stored in IndexedDB (avoids localStorage quota errors)
- **Help**: FAQ & Glossary hub + “How to read this chart” links from key charts

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + Radix UI / Shadcn UI
- Recharts
- SheetJS (`xlsx`)
- `next-themes` (Dark/Light)

## Getting started

### Prerequisites

- Node.js 18+
- npm or pnpm
- PostgreSQL database (local or cloud-hosted)

### Install

```bash
npm install
# or
pnpm install
```

### Local Dev DB Setup

#### Option 1: Local PostgreSQL

1. **Install PostgreSQL** (if not already installed):
   - macOS: `brew install postgresql@14` (or use Postgres.app)
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Create a database**:
   ```bash
   createdb qos_et_db
   # or via psql:
   psql -U postgres
   CREATE DATABASE qos_et_db;
   ```

3. **Set DATABASE_URL** in `.env.local`:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/qos_et_db"
   ```

#### Option 2: Supabase (Cloud PostgreSQL)

[Supabase](https://supabase.com) provides a free PostgreSQL database:

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **Database**
3. Copy the **Connection string** (URI format)
4. Set `DATABASE_URL` in `.env.local`:
   ```bash
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
   ```

**Note**: Supabase is optional - any PostgreSQL provider works (Azure Database for PostgreSQL, AWS RDS, etc.). The app uses standard PostgreSQL via Prisma.

#### Option 3: Other Cloud Providers

- **Azure Database for PostgreSQL**: Use connection string from Azure Portal
- **AWS RDS**: Use connection string from RDS console
- Any provider that supports PostgreSQL connection strings

### Database Setup

1. **Generate Prisma Client**:
   ```bash
   pnpm db:generate
   ```

2. **Run migrations** (creates tables):
   ```bash
   pnpm db:migrate
   ```
   This will prompt for a migration name on first run.

3. **Optional: Open Prisma Studio** (database GUI):
   ```bash
   pnpm db:studio
   ```

### Environment variables

Create `.env.local` (never commit this file):

```bash
# Database (required)
DATABASE_URL="postgresql://user:password@localhost:5432/qos_et_db"

# Optional AI configuration
AI_API_KEY=
AI_PROVIDER=openai  # or "anthropic"
AI_MODEL=           # optional override
AI_BASE_URL=        # optional (for compatible/custom endpoints)
```

### Run locally

```bash
npm run dev
# or
pnpm dev
```

Open `http://localhost:3005`.

## Data / Excel files

The app supports multiple Excel exports. Typical inputs:

- **Complaints/notifications**: Q1/Q2/Q3 (and in dedicated pages also D* and P*)
- **Deliveries**:
  - Outbound files → customer deliveries
  - Inbound files → supplier deliveries
- **Plants master**: official plant list for code → city/location enrichment

Column headers are detected with flexible mapping and can be tuned in Settings.

## AI configuration

- OpenAI key: `https://platform.openai.com/api-keys`
- Anthropic key: `https://console.anthropic.com/`

AI keys are read **server-side** from `.env.local` only.

## Security & GitHub policy notes

- Do **not** commit `.env.local`, API keys, tokens, or credentials.
- Prefer anonymized/sample datasets in public repos.

## License

MIT


