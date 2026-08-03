# RealtyOS AI

> AI Powered Business Operating System for Real Estate Agents, Brokers and Builders

## Architecture

```
realtyos-ai/
├── apps/
│   ├── api/          # NestJS Backend API
│   ├── web/          # Next.js 15 Frontend
│   └── worker/       # BullMQ Background Worker
├── packages/
│   ├── database/     # Prisma Schema & Client
│   └── shared/       # Shared Types, Validators, Utils
├── nginx/            # Reverse Proxy Configuration
├── monitoring/       # Prometheus & Grafana Config
└── docker-compose.yml
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion |
| Backend | NestJS, TypeScript, Prisma, PostgreSQL |
| Auth | Auth.js / JWT with RBAC |
| Realtime | Socket.IO |
| Queue | BullMQ + Redis |
| AI | OpenAI GPT-4, Gemini |
| Storage | AWS S3 / Cloudflare R2 |
| Monitoring | Prometheus + Grafana |
| CI/CD | GitHub Actions |
| Deploy | Docker Compose + NGINX |

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### Development Setup

```bash
# Clone and install
cd realtyos-ai
npm install

# Start infrastructure
docker compose up postgres redis -d

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed

# Start development
npm run dev
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@realtyos.ai | Admin@123! |
| Sales Manager | rahul@realtyos.ai | Sales@123! |
| Sales Executive | sneha@realtyos.ai | Sales@123! |

## Features

### Core CRM
- Lead Management with scoring & assignment
- Customer Management with full timeline
- Duplicate detection & bulk operations
- Import/Export (CSV, Excel)
- Advanced search & filters
- Custom fields & tags

### Property Management
- Projects with towers, wings, floors, units
- Visual inventory (available/reserved/sold)
- Photos, videos, floor plans
- Price history & QR codes
- Map integration

### Site Visits
- Scheduling with calendar view
- Driver assignment & GPS navigation
- Feedback & photos
- Visit status tracking
- Reminders & notifications

### Bookings & Finance
- Complete booking lifecycle
- Payment tracking & receipts
- Loan management
- Commission calculations
- GST & tax handling

### 10 AI Agents
1. **Sales Agent** - Lead outreach, WhatsApp replies, email generation
2. **Marketing Agent** - Social posts, blogs, ads, campaigns
3. **Advertisement Agent** - Google/Meta Ads optimization
4. **Follow-up Agent** - Automated follow-ups & nurturing
5. **Lead Qualification Agent** - Scoring & assignment
6. **Calling Agent** - Voice AI for calls
7. **SEO Agent** - Landing pages, blogs, meta tags
8. **Social Media Agent** - Content creation & scheduling
9. **CEO Agent** - Business analysis & forecasts
10. **Analytics Agent** - Charts, KPIs, ROI tracking

### WhatsApp Business
- Auto-reply with AI
- Template messages
- Broadcast campaigns
- Lead capture from messages
- Real-time notifications

### Website Builder
- SEO-optimized pages
- Property landing pages
- Contact forms with lead capture
- WhatsApp & call buttons

## User Roles (RBAC)

- Super Admin
- Builder
- Agency Owner
- Sales Manager
- Sales Executive
- Marketing Executive
- Finance Executive
- Customer
- Guest

## API Documentation

Available at `/docs` when the API is running (Swagger UI).

## Deployment

```bash
# Production build
docker compose up -d

# Access
# Web: http://localhost (via NGINX)
# API: http://localhost/api
# Docs: http://localhost:4000/docs
# Grafana: http://localhost:3001
```

## License

Proprietary - All Rights Reserved
