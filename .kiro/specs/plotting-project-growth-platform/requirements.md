# Requirements Document

## Introduction

The Plotting Project Growth Platform is a comprehensive automation and marketing suite built on top of the existing RealtyOS AI system. It provides end-to-end capabilities for launching, marketing, and managing sales for a new land plotting project. The platform integrates a dedicated project website, multi-channel marketing AI agents, unified lead management across all sources, ads network management, a native WhatsApp AI bot, customer data ingestion with broadcast campaigns, and an AI-powered calling agent. All modules integrate into the existing RealtyOS dashboard with shared authentication, workspace context, and navigation.

## Glossary

- **Platform**: The Plotting Project Growth Platform feature set within RealtyOS AI
- **Dashboard**: The existing RealtyOS web application dashboard accessible at the `(dashboard)` route group
- **Website_Builder**: The existing website generation module that creates and publishes workspace websites
- **Marketing_Agent**: The AI agent responsible for content creation and social media posting across Instagram, Facebook, and WhatsApp
- **Ads_Agent**: The AI agent responsible for managing advertising campaigns across Google AdWords, Meta Ads, and WhatsApp Ads
- **WhatsApp_Bot**: The native WhatsApp AI bot module that handles automated conversations, sales support, and follow-ups
- **Customer_Data_Agent**: The AI agent that ingests existing customer databases and converts contacts into leads with broadcast notifications
- **Calling_Agent**: The AI agent providing text-to-speech humanized voice calling for leads and follow-ups
- **Leads_CRM**: The existing unified lead management module that collects and manages leads from multiple sources
- **Workspace**: A multi-tenant organizational unit representing a real estate business within RealtyOS
- **Adapter**: A software pattern providing a unified interface to external service APIs, with stub implementations for development
- **Plotting_Project**: A land development project of type PLOT within the existing properties module
- **Gemini_AI**: Google Gemini 2.5 Flash model used for AI-generated content and conversational responses
- **Meta_Graph_API**: Facebook/Instagram Graph API for social media posting and DM reading
- **Meta_Marketing_API**: Meta advertising platform API for creating and managing ad campaigns
- **Broadcast_Campaign**: A message sent to multiple recipients via WhatsApp, Email, or SMS channels

## Requirements

### Requirement 1: Plotting Project Website Page

**User Story:** As a real estate developer, I want a dedicated plotting project page on my generated website, so that potential buyers can view plot details and initiate bookings.

#### Acceptance Criteria

1. WHEN a workspace has a Plotting_Project configured, THE Website_Builder SHALL generate a dedicated project page displaying plot layout maps, pricing tables, and availability status.
2. WHEN a visitor accesses the plotting project page, THE Website_Builder SHALL display a plot booking inquiry form collecting name, phone, email, preferred plot number, and budget range.
3. WHEN a visitor submits the plot booking inquiry form, THE Website_Builder SHALL create a new lead in the Leads_CRM with source set to "WEBSITE" and custom fields containing the selected plot details.
4. THE Website_Builder SHALL display real-time plot availability status sourced from the bookings module for the associated Plotting_Project.
5. IF the plotting project page fails to load property data, THEN THE Website_Builder SHALL display a user-friendly error message and retry the data fetch within 3 seconds.

### Requirement 2: Marketing AI Agent Enhancement

**User Story:** As a marketing manager, I want the Marketing_Agent to create and post AI-generated visual content across Instagram, Facebook, and WhatsApp, so that I can maintain consistent multi-channel presence with minimal effort.

#### Acceptance Criteria

1. WHEN a user triggers content generation, THE Marketing_Agent SHALL generate image content using Gemini_AI with prompts tailored to the target social platform format and dimensions.
2. WHEN content is approved for publishing, THE Marketing_Agent SHALL post to Instagram, Facebook, or WhatsApp via the respective platform adapter.
3. THE Marketing_Agent SHALL implement a Meta_Graph_API adapter using the adapter pattern with a stub implementation that logs requests and returns mock success responses.
4. WHEN a user schedules content, THE Marketing_Agent SHALL queue the post for publishing at the specified date and time using BullMQ job scheduling.
5. WHEN a post is published via an adapter, THE Marketing_Agent SHALL store the post metadata including platform, content, media URLs, timestamp, and status in the database.
6. IF a platform adapter returns an error during publishing, THEN THE Marketing_Agent SHALL mark the post as failed, store the error details, and notify the user via the notifications module.

### Requirement 3: Unified Lead Management

**User Story:** As a sales manager, I want a single consolidated view of all leads from every source (calls, WhatsApp, manual entry, Instagram DMs, Facebook, Meta Ads), so that no potential customer is missed and all follow-ups are tracked in one place.

#### Acceptance Criteria

1. THE Leads_CRM SHALL accept and store leads from the following sources: CALL, WHATSAPP, MANUAL, INSTAGRAM_DM, FACEBOOK, META_ADS, WEBSITE, CUSTOMER_IMPORT, and REFERRAL.
2. WHEN a lead arrives from any automated source (WhatsApp_Bot, Marketing_Agent, Ads_Agent, Customer_Data_Agent), THE Leads_CRM SHALL create the lead record with the originating source, timestamp, and raw message content within 5 seconds of receipt.
3. THE Leads_CRM SHALL provide a unified dashboard page displaying all leads with filtering by source, status, date range, assigned agent, and tags.
4. WHEN duplicate leads are detected based on matching phone number or email, THE Leads_CRM SHALL flag the duplicate and present a merge option to the user rather than creating a separate record.
5. WHEN a new lead is created from an automated source, THE Leads_CRM SHALL send a real-time notification to assigned team members via socket.io.
6. THE Leads_CRM SHALL display a source attribution breakdown showing lead count and conversion rate per source channel on the dashboard.

### Requirement 4: Ads Network Agent Enhancement

**User Story:** As a marketing manager, I want the Ads_Agent to manage ad campaigns across Google AdWords, Meta Ads, and WhatsApp Ads with AI-generated creatives, so that I can run multi-platform advertising from a single interface.

#### Acceptance Criteria

1. THE Ads_Agent SHALL provide campaign creation with configurable parameters including platform (Google, Meta, WhatsApp), budget, duration, target audience, and creative assets.
2. WHEN a user creates a campaign, THE Ads_Agent SHALL generate ad creative options including images and copy text using Gemini_AI based on the Plotting_Project details.
3. THE Ads_Agent SHALL implement a Google Ads API adapter using the adapter pattern with a stub implementation that validates request structure and returns mock campaign metrics.
4. THE Ads_Agent SHALL implement a Meta_Marketing_API adapter using the adapter pattern with a stub implementation that validates request structure and returns mock campaign metrics.
5. WHEN a user requests offline banners, THE Ads_Agent SHALL generate printable banner designs in standard sizes (horizontal 1200x628, vertical 1080x1920, square 1080x1080) using Gemini_AI image generation.
6. THE Ads_Agent SHALL track campaign performance metrics (impressions, clicks, conversions, spend) per platform and display them on a unified campaign analytics dashboard.
7. IF an ad platform adapter returns a rate limit error, THEN THE Ads_Agent SHALL implement exponential backoff retry with a maximum of 3 attempts before marking the operation as failed.

### Requirement 5: WhatsApp AI Bot (Native Module)

**User Story:** As a business owner, I want a native WhatsApp AI bot built on the existing WhatsApp module that handles all sales conversations, customer support, and lead follow-ups automatically using Gemini AI, so that I can engage every prospect without manual intervention or message limits.

#### Acceptance Criteria

1. WHEN an incoming WhatsApp message is received, THE WhatsApp_Bot SHALL generate a contextual AI response using Gemini_AI with the conversation history, lead profile data, and Plotting_Project details as context.
2. THE WhatsApp_Bot SHALL maintain conversation state per contact, storing all messages, intent classification, and follow-up schedule in the database.
3. WHEN a conversation indicates purchase intent (keywords: book, buy, price, visit, interested), THE WhatsApp_Bot SHALL escalate the lead status to HOT and notify the assigned sales agent in real time.
4. WHEN a lead has not responded for 24 hours, THE WhatsApp_Bot SHALL send an automated follow-up message personalized with the lead's name and last discussed topic.
5. THE WhatsApp_Bot SHALL support unlimited message processing without per-message rate caps, bounded only by WhatsApp Business API rate limits (80 messages per second).
6. WHEN a user sends a message outside business hours, THE WhatsApp_Bot SHALL respond with an auto-reply acknowledging receipt and providing estimated response time for human follow-up.
7. THE WhatsApp_Bot SHALL provide a dashboard page showing active conversations, response times, intent distribution, and escalation metrics.
8. IF Gemini_AI fails to generate a response within 10 seconds, THEN THE WhatsApp_Bot SHALL send a predefined fallback message and queue the conversation for manual review.

### Requirement 6: Customer Data Agent

**User Story:** As a project manager, I want to import my existing customer database and automatically notify those customers about the new plotting project, converting interested responses into CRM leads, so that I can leverage my existing network for the new project launch.

#### Acceptance Criteria

1. WHEN a user uploads a customer data file (CSV or Excel), THE Customer_Data_Agent SHALL parse and validate the file, extracting name, phone, email, and any additional fields present.
2. WHEN customer data is ingested, THE Customer_Data_Agent SHALL deduplicate records against existing leads in the Leads_CRM using phone number and email matching.
3. WHEN a broadcast campaign is triggered, THE Customer_Data_Agent SHALL send notifications via the selected channel (WhatsApp, Email, or SMS) to all targeted customer records.
4. WHEN a customer responds positively to a broadcast (replies on WhatsApp, clicks email link, or responds to SMS), THE Customer_Data_Agent SHALL create a new lead in the Leads_CRM with source set to "CUSTOMER_IMPORT" and link the original customer record.
5. THE Customer_Data_Agent SHALL track broadcast delivery metrics including sent count, delivered count, read count, response count, and conversion count per campaign.
6. IF a broadcast message fails to deliver to a specific contact, THEN THE Customer_Data_Agent SHALL mark that contact as unreachable for the failed channel and attempt the next available channel.
7. THE Customer_Data_Agent SHALL enforce rate limiting of 80 messages per second for WhatsApp broadcasts and 50 emails per second for email broadcasts to comply with provider limits.

### Requirement 7: AI Calling Agent

**User Story:** As a sales manager, I want an AI calling agent with humanized text-to-speech that can call leads, conduct initial conversations, and follow up on interest, so that I can scale outbound calling without proportionally increasing team size.

#### Acceptance Criteria

1. WHEN a call campaign is initiated, THE Calling_Agent SHALL generate a conversation script using Gemini_AI based on the lead profile, Plotting_Project details, and call objective (introduction, follow-up, or booking confirmation).
2. THE Calling_Agent SHALL implement a telephony adapter using the adapter pattern with stub implementations for Twilio and Exotel that validate call parameters and return mock call session data.
3. THE Calling_Agent SHALL implement a TTS adapter using the adapter pattern with stub implementations for ElevenLabs and Google TTS that accept text input and return mock audio stream references.
4. WHEN a call is completed, THE Calling_Agent SHALL store the call record including duration, transcript summary, detected intent, and recommended next action in the database.
5. WHEN a call recipient expresses interest (detected via intent classification), THE Calling_Agent SHALL update the lead status in the Leads_CRM and schedule a human follow-up task.
6. THE Calling_Agent SHALL provide a call campaigns dashboard showing total calls made, connected count, average duration, interest rate, and follow-up conversion rate.
7. IF a call fails to connect after 30 seconds of ringing, THEN THE Calling_Agent SHALL mark the attempt as unanswered and schedule a retry at a different time slot within the same business day.

### Requirement 8: Dashboard Integration and Navigation

**User Story:** As a RealtyOS user, I want all Plotting Project Growth Platform features accessible from the existing dashboard with proper navigation and consistent UI, so that I can manage the entire project lifecycle from one interface.

#### Acceptance Criteria

1. THE Dashboard SHALL add a "Plotting Project" section in the sidebar navigation containing links to: Project Website, Marketing, Ads Campaigns, WhatsApp Bot, Customer Data, and AI Calling.
2. THE Dashboard SHALL render all new pages within the existing `(dashboard)` layout group, inheriting shared authentication, workspace context, and responsive design.
3. WHEN a user navigates to any Plotting Project page, THE Dashboard SHALL validate the user's workspace membership and permissions before rendering the page content.
4. THE Dashboard SHALL display a Plotting Project overview page summarizing key metrics: total leads by source, active campaigns, WhatsApp conversations, and call campaign performance.
5. THE Dashboard SHALL use the existing Radix UI component library and Tailwind CSS styling consistent with other RealtyOS dashboard pages.
6. WHEN real-time events occur (new lead, WhatsApp message, call completion), THE Dashboard SHALL update the relevant UI components via socket.io without requiring a page refresh.
