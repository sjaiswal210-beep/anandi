import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';

// Core Modules
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { LeadsModule } from './modules/leads/leads.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { VisitsModule } from './modules/visits/visits.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AIAgentsModule } from './modules/ai-agents/ai-agents.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { WebsiteModule } from './modules/website/website.module';
import { FinanceModule } from './modules/finance/finance.module';
import { PlotInventoryModule } from './modules/plot-inventory/plot-inventory.module';
import { LeadIngestionModule } from './modules/lead-ingestion/lead-ingestion.module';
import { WhatsAppBotModule } from './modules/whatsapp-bot/whatsapp-bot.module';
import { SocialMediaModule } from './modules/social-media/social-media.module';
import { CustomerDataModule } from './modules/customer-data/customer-data.module';
import { AICallingModule } from './modules/ai-calling/ai-calling.module';
import { LeadScraperModule } from './modules/lead-scraper/lead-scraper.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 1000,
      },
    ]),

    // Scheduler
    ScheduleModule.forRoot(),

    // BullMQ Queues (requires Redis - optional)
    ...(process.env.REDIS_URL ? [BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    })] : []),

    // Core
    PrismaModule,
    RedisModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    WorkspacesModule,
    LeadsModule,
    PropertiesModule,
    BookingsModule,
    VisitsModule,
    DocumentsModule,
    NotificationsModule,
    AIAgentsModule,
    DashboardModule,
    ReportsModule,
    WhatsAppModule,
    WebsiteModule,
    FinanceModule,
    HealthModule,
    PlotInventoryModule,
    LeadIngestionModule,
    WhatsAppBotModule,
    SocialMediaModule,
    CustomerDataModule,
    AICallingModule,
    LeadScraperModule,
  ],
})
export class AppModule {}
