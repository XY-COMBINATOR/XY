# XY COMBINATOR — Different Coordinates. One Direction.

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?style=flat&logo=vercel)](https://xy-combinator.vercel.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)](https://react.dev/)
[![tRPC](https://img.shields.io/badge/tRPC-11-2596be?style=flat&logo=trpc)](https://trpc.io/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-yellow?style=flat&logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> **Live Application:** [xy-combinator.vercel.app](https://xy-combinator.vercel.app/)  
> **Source Repository:** [github.com/XY-COMBINATOR/XY](https://github.com/XY-COMBINATOR/XY)

---

## ✦ Overview

**XY COMBINATOR** is a digital portfolio, creative collective platform, and authenticated team operating system (**XY OS**). Designed around a **Kinetic Editorial** aesthetic, the platform combines Swiss-influenced digital publishing, structured typography, and dynamic interactive motion graphics.

### Key Capabilities

- **Kinetic Editorial Experience:** High-contrast typography (`DM Mono`, `Space Grotesk`, `Manrope`), asymmetric layouts, and interactive canvas-driven orbital geometry.
- **Full-Stack Type Safety:** End-to-end type safety between client and server via **tRPC** and **Zod**.
- **XY OS Dashboard:** Authenticated team workspace with real-time network offline detection, resilient query retries, and data skeleton loading.
- **Hardened Security Baseline:** Multi-layer security headers (CSP, HSTS, X-Frame-Options), bot honeypot traps, strict rate limiters, and atomic write operations.
- **Serverless Resilience:** Built to run on Vercel Serverless Functions with fallback asset routing and client error recovery.

---

## ✦ Tech Stack

| Layer               | Technologies                                                                               |
| :------------------ | :----------------------------------------------------------------------------------------- |
| **Frontend**        | React 19, TypeScript, Vite, Tailwind CSS, Radix UI Primitives, Lucide Icons, Framer Motion |
| **Routing & State** | Wouter, TanStack React Query v5                                                            |
| **Backend & API**   | Node.js (ESM), Express 5, tRPC v11, Zod                                                    |
| **Database & ORM**  | Drizzle ORM, PostgreSQL (Neon / Supabase compatible)                                       |
| **Authentication**  | Supabase Auth + Session Proxy Architecture                                                 |
| **Cloud Storage**   | AWS S3 SDK with presigned URL capabilities                                                 |
| **Testing & CI/CD** | Vitest, V8 Coverage, GitHub Actions (Quality Gate, CodeQL, Dependabot)                     |
| **Deployment**      | Vercel Serverless Functions & Edge CDN                                                     |

---

## ✦ Project Structure

```text
XY/
├── .github/workflows/       # GitHub Actions CI/CD workflows
├── api/
│   └── index.ts             # Vercel serverless entry point
├── client/
│   ├── public/              # Static icons, vector marks, and web manifests
│   └── src/
│       ├── components/      # Design system & accessible UI components
│       ├── contexts/        # Auth, theme, and network state providers
│       ├── hooks/           # useOfflineStatus, useAuth, motion hooks
│       ├── lib/             # tRPC client, queryClient, feature flags
│       ├── pages/           # Routed application views (Home, Projects, Dashboard, etc.)
│       ├── App.tsx          # App router and global providers
│       └── index.css        # Kinetic Editorial styling and theme tokens
├── server/
│   ├── app.ts               # Express configuration & security middlewares
│   ├── authProxy.ts         # Authentication proxy & cookie management
│   ├── contactGuard.ts      # Contact abuse protection & rate limiting
│   ├── db.ts                # Drizzle ORM database connection & schemas
│   ├── routers.ts           # tRPC API router endpoints
│   ├── security.ts          # CSP headers, CORS policies, sanitization
│   └── *.test.ts            # 15+ Vitest automated test suites
├── drizzle/                 # Database migrations
├── vercel.json              # Vercel routing rules & cache-control headers
├── vite.config.ts           # Vite build & chunking configuration
└── vitest.config.ts         # Vitest test runner configuration
```

---

## ✦ Getting Started

### Prerequisites

- **Node.js** `>= 20.x` (Recommended: `24.x`)
- **pnpm** `>= 9.x` (or `npx pnpm`)

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/XY-COMBINATOR/XY.git
cd XY
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database (MySQL / TiDB / PlanetScale)
DATABASE_URL=mysql://user:password@host:3306/xy_db

# Supabase Authentication (Optional for local guest preview)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Inbound Lead Notifications (Optional - Discord / Slack webhook URL)
CONTACT_WEBHOOK_URL=https://discord.com/api/webhooks/...


# Storage (AWS S3 - Optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key-id
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
```

### 3. Running Development Server

Start the client and server concurrently:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✦ Available Scripts

| Command             | Description                                               |
| :------------------ | :-------------------------------------------------------- |
| `pnpm dev`          | Starts development server with hot-module reload          |
| `pnpm build`        | Bundles client with Vite and compiles server with esbuild |
| `pnpm start`        | Runs the production-compiled server                       |
| `pnpm test`         | Runs the complete Vitest test suite                       |
| `pnpm coverage`     | Generates Vitest V8 code coverage report                  |
| `pnpm check`        | Runs TypeScript typechecker (`tsc --noEmit`)              |
| `pnpm format`       | Formats codebase using Prettier                           |
| `pnpm format:check` | Verifies formatting for changed files                     |
| `pnpm db:push`      | Generates and runs Drizzle ORM migrations                 |

---

## ✦ Deployment to Vercel

The application is architected for zero-configuration Vercel deployment:

1. Import the repository in [Vercel](https://vercel.com).
2. Set the Framework Preset to **Vite**.
3. Add the required Environment Variables (`DATABASE_URL`, `SUPABASE_URL`, etc.).
4. Deploy! The serverless API bridge in `api/index.ts` will handle all backend routes.

---

## ✦ License

This project is licensed under the [MIT License](LICENSE).
