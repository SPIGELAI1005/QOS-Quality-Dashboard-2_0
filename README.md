# QOS ET Quality Report

Web application for analyzing manufacturing quality data (SAP S/4HANA exports). It processes Excel files (complaints/notifications, deliveries, plant master data) to generate KPIs (incl. PPM) and AI-assisted insights.

## Key capabilities

- **Quality metrics**: Q1 (Customer), Q2 (Supplier), Q3 (Internal), Deviations (D*), PPAP (P*)
- **PPM calculation**:
  - Customer PPM = (Q1 defective parts / customer deliveries) × 1,000,000
  - Supplier PPM = (Q2 defective parts / supplier deliveries) × 1,000,000
- **Dashboards & pages**: KPI tiles, charts, tables, filters (plants/months), AI insights
- **Uploads**: Structured multi-file upload sections + progress + change history + manual entry form
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
- npm

### Install

```bash
npm install
```

### Environment variables

Create `.env.local` (never commit this file):

```bash
# Optional AI configuration
AI_API_KEY=
AI_PROVIDER=openai  # or "anthropic"
AI_MODEL=           # optional override
AI_BASE_URL=        # optional (for compatible/custom endpoints)
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

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

- **Do not commit secrets**: never commit `.env.local`, API keys, tokens, or credentials.
- **Avoid sensitive datasets**: use anonymized/sample files for development where possible.
- If GitHub blocks a push due to secret scanning, rotate the credential immediately and remove it from git history.

## License

MIT


