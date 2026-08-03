# Design Document: Plotting Project Growth Platform

## Overview

This platform extends the existing RealtyOS AI dashboard with 7 new capabilities focused on automating the entire sales and marketing lifecycle for a land plotting project. All modules integrate into the existing monorepo architecture.

## Architecture Decisions

### 1. Adapter Pattern for External Services
All third-party integrations (Meta Graph API, Google Ads, Twilio, ElevenLabs) use an adapter interface pattern. Each adapter has:
- An **interface** defining the contract
- A **stub implementation** for development/demo
- A **live implementation** plugged in when API credentials are configured

### 2. Agent-per-Domain
Each business domain (marketing, ads, whatsapp, calling, customer-data) gets its own AI agent with domain-specific system prompts and memory. Agents communicate through the event bus (BullMQ queues).

### 3. Real-time Lead Ingestion
All lead sources feed into a single `LeadIngestionService` that deduplicates, scores, assigns, and notifies in real-time via WebSocket.

---

## Database Schema Changes

### New Models

```prisma
model PlotInventory {
  id          String   @id @default(cuid())
  projectId   String
  plotNumber  String
  area        Decimal  @db.Decimal(10, 2)
  dimensions  String?
  facing      String?
  price       Decimal  @db.Decimal(15, 2)
  status      PropertyStatus @default(AVAILABLE)
  roadFacing  Boolean  @default(false)
  corner      Boolean  @default(false)
  coordinates Json     @default("[]")
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project Project @relation(fields: [projectId], references: [id])
  @@unique([projectId, plotNumber])
  @@map("plot_inventory")
}

model SocialPost {
  id          String   @id @default(cuid())
  workspaceId String
  platform    String   // instagram, facebook, whatsapp
  content     String   @db.Text
  mediaUrls   String[] @default([])
  hashtags    String[] @default([])
  status      String   @default("draft") // draft, scheduled, published, failed
  publishedAt DateTime?
  scheduledAt DateTime?
  metrics     Json     @default("{}")
  adapterResponse Json @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("social_posts")
}

model CallRecord {
  id          String   @id @default(cuid())
  workspaceId String
  leadId      String?
  phone       String
  direction   String   // outbound, inbound
  status      String   @default("initiated") // initiated, ringing, connected, completed, failed, no_answer
  duration    Int?     // seconds
  script      String?  @db.Text
  transcript  String?  @db.Text
  intentDetected String?
  sentiment   String?
  nextAction  String?
  provider    String?  // twilio, exotel
  providerCallId String?
  recordingUrl String?
  createdAt   DateTime @default(now())
  completedAt DateTime?
  @@map("call_records")
}

model CustomerImport {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  phone       String
  email       String?
  source      String?  // existing_db, csv, excel
  tags        String[] @default([])
  broadcastSent Boolean @default(false)
  broadcastChannel String?
  responded   Boolean  @default(false)
  convertedToLeadId String?
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())
  @@map("customer_imports")
}

model BroadcastCampaign {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  channel     String   // whatsapp, email, sms
  template    String   @db.Text
  targetCount Int      @default(0)
  sentCount   Int      @default(0)
  deliveredCount Int   @default(0)
  readCount   Int      @default(0)
  respondedCount Int   @default(0)
  convertedCount Int   @default(0)
  status      String   @default("draft") // draft, sending, completed, paused
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())
  completedAt DateTime?
  @@map("broadcast_campaigns")
}
```

### Enum Extensions

```prisma
// Add to LeadSource
CALL
INSTAGRAM_DM
CUSTOMER_IMPORT

// Add to AgentType
WHATSAPP_BOT
CUSTOMER_DATA
```

---

## Backend Modules (NestJS)

### Module 1: Plot Inventory Module
**Path:** `apps/api/src/modules/plot-inventory/`
- `plot-inventory.module.ts`
- `plot-inventory.service.ts` — CRUD for plot inventory, status updates
- `plot-inventory.controller.ts` — REST API for plot management
- Integrates with existing Properties/Bookings modules

### Module 2: Social Media Module (Enhanced Marketing)
**Path:** `apps/api/src/modules/social-media/`
- `social-media.module.ts`
- `social-media.service.ts` — Content generation, scheduling, publishing
- `social-media.controller.ts` — REST API
- `adapters/meta-graph.adapter.ts` — Interface + Stub for Instagram/Facebook
- `adapters/whatsapp-social.adapter.ts` — Interface + Stub for WhatsApp Status
- Uses Gemini AI for image prompt generation and captions

### Module 3: Lead Ingestion Module (Enhanced Leads)
**Path:** `apps/api/src/modules/lead-ingestion/`
- `lead-ingestion.module.ts`
- `lead-ingestion.service.ts` — Unified entry point for all lead sources
- `lead-ingestion.controller.ts` — Webhook endpoints for external sources
- Deduplication, scoring, auto-assignment, real-time notification

### Module 4: Ads Network Module (Enhanced Ads)
**Path:** `apps/api/src/modules/ads-network/`
- `ads-network.module.ts`
- `ads-network.service.ts` — Campaign management, creative generation
- `ads-network.controller.ts` — REST API
- `adapters/google-ads.adapter.ts` — Interface + Stub
- `adapters/meta-ads.adapter.ts` — Interface + Stub
- `adapters/image-generator.adapter.ts` — Gemini for banner generation

### Module 5: WhatsApp Bot Module (Enhanced WhatsApp)
**Path:** `apps/api/src/modules/whatsapp-bot/`
- `whatsapp-bot.module.ts`
- `whatsapp-bot.service.ts` — AI conversation handler, context management
- `whatsapp-bot.controller.ts` — Webhook + manual override
- Uses existing WhatsAppService for message sending
- Gemini AI with project context for intelligent replies
- Intent detection, escalation logic, follow-up scheduling

### Module 6: Customer Data Module
**Path:** `apps/api/src/modules/customer-data/`
- `customer-data.module.ts`
- `customer-data.service.ts` — Import, broadcast, conversion tracking
- `customer-data.controller.ts` — REST API (upload, broadcast, metrics)
- CSV/Excel parsing, deduplication, channel routing

### Module 7: AI Calling Module
**Path:** `apps/api/src/modules/ai-calling/`
- `ai-calling.module.ts`
- `ai-calling.service.ts` — Call orchestration, script generation
- `ai-calling.controller.ts` — REST API (campaigns, call records)
- `adapters/telephony.adapter.ts` — Interface + Stubs (Twilio, Exotel)
- `adapters/tts.adapter.ts` — Interface + Stubs (ElevenLabs, Google TTS)

---

## Frontend Pages (Next.js)

### New Dashboard Pages

| Route | Component | Purpose |
|-------|-----------|---------|
| `/plotting` | PlottingOverviewPage | Summary metrics dashboard |
| `/plotting/inventory` | PlotInventoryPage | Visual grid of all plots with status |
| `/plotting/website` | PlotWebsitePage | Website builder for project |
| `/plotting/social` | SocialMediaPage | Content gen + scheduling + analytics |
| `/plotting/ads` | AdsNetworkPage | Campaign management across platforms |
| `/plotting/whatsapp-bot` | WhatsAppBotPage | Bot conversations, settings, metrics |
| `/plotting/customers` | CustomerDataPage | Import, broadcast, conversion tracking |
| `/plotting/calling` | AICallingPage | Call campaigns, scripts, recordings |
| `/plotting/leads` | UnifiedLeadsPage | All-source lead view with attribution |

### Sidebar Addition
Add "Plotting Project" collapsible group in sidebar with nested links to above pages.

---

## Key Data Flows

### Lead Ingestion Flow
```
[WhatsApp] → webhook → LeadIngestionService.ingest()
[Instagram DM] → Meta webhook → LeadIngestionService.ingest()
[Facebook] → Meta webhook → LeadIngestionService.ingest()
[Google Ads] → form submission → LeadIngestionService.ingest()
[Website] → form → LeadIngestionService.ingest()
[AI Calling] → intent detected → LeadIngestionService.ingest()
[Manual] → dashboard form → LeadIngestionService.ingest()
                              ↓
                    Deduplicate → Score → Assign → Notify (WebSocket)
                              ↓
                         Leads CRM (unified view)
```

### WhatsApp Bot Flow
```
Incoming Message → WhatsApp Webhook
    ↓
WhatsAppBotService.handleMessage()
    ↓
Load conversation history + lead profile + project context
    ↓
Gemini AI generates response
    ↓
Intent detection (buy/visit/price → escalate to HOT)
    ↓
Send reply via WhatsAppService
    ↓
Store in AgentConversation + update lead timeline
    ↓
If no reply in 24h → schedule follow-up via BullMQ
```

### AI Calling Flow
```
Call Campaign Created → AICallingService.initiateCampaign()
    ↓
For each lead:
  1. Generate personalized script (Gemini AI)
  2. Convert to speech (TTS adapter)
  3. Initiate call (Telephony adapter)
  4. Handle conversation (detect intents)
  5. Store transcript + intent + next action
  6. Update lead status in CRM
    ↓
Campaign dashboard shows metrics
```

---

## External Service Adapters

| Service | Adapter Interface | Stub Behavior | Live Provider |
|---------|------------------|---------------|---------------|
| Instagram/Facebook Posts | `ISocialMediaAdapter` | Logs + mock success | Meta Graph API |
| Google Ads | `IGoogleAdsAdapter` | Mock campaigns/metrics | Google Ads API |
| Meta Ads | `IMetaAdsAdapter` | Mock campaigns/metrics | Meta Marketing API |
| Telephony | `ITelephonyAdapter` | Mock call sessions | Twilio / Exotel |
| TTS | `ITTSAdapter` | Returns mock audio URL | ElevenLabs / Google TTS |
| Image Generation | `IImageGenAdapter` | Returns picsum URLs | Gemini Image / DALL-E |

---

## Technology Choices

- **AI**: Gemini 2.5 Flash (already configured, fast, free tier)
- **Queues**: BullMQ (existing, for scheduled posts, broadcasts, call campaigns)
- **Real-time**: Socket.IO (existing, for lead notifications)
- **File Parsing**: `xlsx` package for Excel, built-in CSV parsing
- **Image Placeholders**: picsum.photos for stubs until real generation is wired

---

## Implementation Order

1. **Phase 1** — Plot Inventory + Website Page (extends existing)
2. **Phase 2** — Unified Lead Ingestion (extends existing leads module)
3. **Phase 3** — WhatsApp Bot (extends existing WhatsApp module)
4. **Phase 4** — Social Media + Marketing Agent
5. **Phase 5** — Customer Data Agent + Broadcasts
6. **Phase 6** — Ads Network Agent
7. **Phase 7** — AI Calling Agent
8. **Phase 8** — Dashboard integration + overview page
