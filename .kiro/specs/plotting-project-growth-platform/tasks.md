# Implementation Tasks

## Phase 1: Plot Inventory & Project Website

- [ ] 1. Add PlotInventory, SocialPost, CallRecord, CustomerImport, BroadcastCampaign models to Prisma schema
- [ ] 2. Extend LeadSource enum with CALL, INSTAGRAM_DM, CUSTOMER_IMPORT
- [ ] 3. Run prisma db push to apply schema changes
- [ ] 4. Create plot-inventory NestJS module (module, service, controller) with CRUD + status updates
- [ ] 5. Create plotting project website page at /project/plots with visual plot grid, availability, and booking form
- [ ] 6. Wire plot booking form to lead ingestion API
- [ ] 7. Seed sample plot inventory data (20 plots with various statuses)

## Phase 2: Unified Lead Ingestion

- [ ] 8. Create lead-ingestion NestJS module with unified ingest() method
- [ ] 9. Add webhook endpoints for external lead sources (Meta, Google Forms)
- [ ] 10. Implement deduplication logic (phone + email matching)
- [ ] 11. Add real-time WebSocket notification on new lead arrival
- [ ] 12. Create /plotting/leads frontend page with source attribution breakdown chart
- [ ] 13. Add source filter pills (All, Calls, WhatsApp, Instagram, Facebook, Meta Ads, Website, Manual)

## Phase 3: WhatsApp AI Bot

- [ ] 14. Create whatsapp-bot NestJS module extending existing WhatsApp service
- [ ] 15. Implement AI conversation handler with Gemini (project context + lead profile + history)
- [ ] 16. Add intent detection (buy, visit, price, loan, not-interested)
- [ ] 17. Implement auto-escalation to HOT status on purchase intent
- [ ] 18. Add 24-hour follow-up scheduler via BullMQ
- [ ] 19. Create /plotting/whatsapp-bot frontend page with conversation list, bot metrics, and override controls
- [ ] 20. Add business-hours auto-reply configuration

## Phase 4: Social Media & Marketing Agent

- [ ] 21. Create social-media NestJS module with ISocialMediaAdapter interface
- [ ] 22. Implement Meta Graph API stub adapter (logs + mock responses)
- [ ] 23. Build content generation flow using Gemini (platform-specific formats)
- [ ] 24. Add post scheduling via BullMQ with publish-at-time logic
- [ ] 25. Create /plotting/social frontend page with content generator, calendar, and analytics
- [ ] 26. Add AI image prompt generator for flashy social creatives (returns descriptive prompts + picsum placeholders)

## Phase 5: Customer Data Agent

- [ ] 27. Create customer-data NestJS module with import (CSV/Excel) + broadcast
- [ ] 28. Implement file parsing with xlsx package and validation
- [ ] 29. Build broadcast campaign service (WhatsApp/Email/SMS channels)
- [ ] 30. Add response tracking and auto-conversion to lead
- [ ] 31. Create /plotting/customers frontend page with upload, campaign creation, and metrics
- [ ] 32. Wire broadcast delivery to existing notification/WhatsApp services

## Phase 6: Ads Network Agent

- [ ] 33. Create ads-network NestJS module with IGoogleAdsAdapter and IMetaAdsAdapter interfaces
- [ ] 34. Implement stub adapters returning mock campaign data and metrics
- [ ] 35. Build AI creative generation (ad copy + banner dimensions via Gemini)
- [ ] 36. Create /plotting/ads frontend page with campaign builder, creative preview, and performance dashboard
- [ ] 37. Add offline banner download feature (standard sizes with plot project branding)

## Phase 7: AI Calling Agent

- [ ] 38. Create ai-calling NestJS module with ITelephonyAdapter and ITTSAdapter interfaces
- [ ] 39. Implement Twilio + Exotel telephony stubs and ElevenLabs + Google TTS stubs
- [ ] 40. Build call script generator using Gemini (personalized per lead)
- [ ] 41. Implement call campaign orchestrator (queue calls, track status, store transcripts)
- [ ] 42. Create /plotting/calling frontend page with campaign creation, call logs, and performance metrics
- [ ] 43. Add intent detection on call transcripts and auto-lead-status update

## Phase 8: Dashboard Integration

- [ ] 44. Add "Plotting Project" collapsible section to sidebar navigation
- [ ] 45. Create /plotting overview page with summary KPIs from all modules
- [ ] 46. Wire WebSocket events for real-time updates across all plotting pages
- [ ] 47. Add plotting project module imports to app.module.ts
- [ ] 48. End-to-end testing: lead flows from each source → CRM → notification
