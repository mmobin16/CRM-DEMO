# CRM Pro

A modern, enterprise-grade Customer Relationship Management (CRM) application built with Next.js, TypeScript, and Prisma.

![CRM Pro](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-5-teal)

## Features

- **Dashboard** — KPI cards, lead funnel, revenue charts, activity breakdown, recent timeline
- **Lead Management** — Full CRUD, search, filter, pagination, convert to customer
- **Customer Management** — CRUD, CSV import/export, detailed profile with tabs
- **Contact Management** — Multiple contacts per customer
- **Opportunity Pipeline** — Drag-and-drop Kanban board
- **Activities** — Calendar view with call, meeting, task, email types
- **Tasks** — Priority-based task board
- **Quotations** — Line items with auto-calculated totals, PDF export
- **Documents** — File center with categories and preview
- **Reports** — Charts with CSV/Excel export
- **Settings** — Company info, roles & permissions matrix, email templates
- **Global Search** — Search across leads, customers, opportunities, contacts
- **Notifications** — Real-time notification center with unread badges
- **Authentication** — NextAuth with role-based access (Admin, Sales Manager, Sales Executive)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (Radix UI)
- Lucide React Icons
- React Hook Form + Zod
- TanStack Table
- Recharts
- Zustand
- Prisma ORM (SQLite for demo, PostgreSQL/SQL Server ready)
- NextAuth.js v5

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install

# Setup database and seed demo data
npm run db:setup

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crmpro.com | password123 |
| Sales Manager | manager@crmpro.com | password123 |
| Sales Executive | sales@crmpro.com | password123 |

## Database

Default: **SQLite** (`prisma/dev.db`) for zero-config local demo.

For production, update `.env`:

```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/crm_pro"

# SQL Server
DATABASE_URL="sqlserver://localhost:1433;database=crm_pro;user=sa;password=YourPassword;encrypt=true;trustServerCertificate=true"
```

Then change `provider` in `prisma/schema.prisma` to `postgresql` or `sqlserver`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:setup` | Push schema + seed data |
| `npm run db:seed` | Seed demo data only |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Protected CRM pages
│   ├── api/             # REST API routes
│   └── login/           # Authentication
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Sidebar, Topbar
│   └── shared/          # Reusable CRM components
├── lib/                 # Utilities, auth, prisma
└── store/               # Zustand state management
prisma/
├── schema.prisma        # Database schema
└── seed.ts              # Demo data seeder
```

## Seed Data

- 100 Leads
- 50 Customers (with contacts)
- 150 Activities
- 30 Opportunities
- 40 Tasks
- 15 Quotations
- 20 Documents

## License

MIT
