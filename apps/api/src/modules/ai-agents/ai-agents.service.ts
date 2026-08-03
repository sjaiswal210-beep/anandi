import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class AIAgentsService {
  private geminiModel: any = null;

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {
    this.initGemini();
  }

  private async initGemini() {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (apiKey) {
        const genAI = new GoogleGenerativeAI(apiKey);
        this.geminiModel = genAI.getGenerativeModel({
          model: this.configService.get<string>('GEMINI_MODEL', 'gemini-1.5-flash'),
        });
      }
    } catch (e) {
      console.error('Gemini init failed:', e);
    }
  }

  async findAll(workspaceId: string) {
    return this.prisma.aIAgent.findMany({
      where: { workspaceId },
      orderBy: { type: 'asc' },
      include: { _count: { select: { executions: true, conversations: true } } },
    });
  }

  async findById(id: string, workspaceId: string) {
    const agent = await this.prisma.aIAgent.findFirst({
      where: { id, workspaceId },
      include: {
        executions: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: { select: { executions: true, conversations: true } },
      },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }

  async configure(id: string, workspaceId: string, config: Record<string, unknown>) {
    const agent = await this.prisma.aIAgent.findFirst({ where: { id, workspaceId } });
    if (!agent) throw new NotFoundException('Agent not found');
    return this.prisma.aIAgent.update({ where: { id }, data: { config: config as any } });
  }

  async toggle(id: string, workspaceId: string) {
    const agent = await this.prisma.aIAgent.findFirst({ where: { id, workspaceId } });
    if (!agent) throw new NotFoundException('Agent not found');
    return this.prisma.aIAgent.update({ where: { id }, data: { isActive: !agent.isActive } });
  }

  async execute(id: string, workspaceId: string, input: Record<string, unknown>) {
    const agent = await this.prisma.aIAgent.findFirst({ where: { id, workspaceId } });
    if (!agent) throw new NotFoundException('Agent not found');

    const execution = await this.prisma.agentExecution.create({
      data: { agentId: id, trigger: 'manual', input: input as any, status: 'running' },
    });

    this.runAgent(agent, execution.id, input).catch(console.error);
    return { executionId: execution.id, status: 'running' };
  }

  async chat(agentId: string, workspaceId: string, message: string, sessionId: string) {
    const agent = await this.prisma.aIAgent.findFirst({ where: { id: agentId, workspaceId } });
    if (!agent) throw new NotFoundException('Agent not found');

    // Save user message
    await this.prisma.agentConversation.create({
      data: { agentId, sessionId, role: 'user', content: message },
    });

    // Get conversation history
    const history = await this.prisma.agentConversation.findMany({
      where: { agentId, sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const systemPrompt = agent.systemPrompt || this.getDefaultPrompt(agent.type);

    let reply = 'I could not generate a response. Please check AI configuration.';
    let tokensUsed = 0;

    try {
      if (this.geminiModel) {
        // Use Gemini
        const chatHistory = history.slice(0, -1).map((h) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        }));

        const chat = this.geminiModel.startChat({
          history: [
            { role: 'user', parts: [{ text: `System instructions: ${systemPrompt}` }] },
            { role: 'model', parts: [{ text: 'Understood. I will act as instructed.' }] },
            ...chatHistory,
          ],
        });

        const result = await chat.sendMessage(message);
        reply = result.response.text();
        tokensUsed = reply.length / 4; // approximate
      }
    } catch (err: any) {
      console.error('AI chat error:', err.message);
      reply = `I encountered an error: ${err.message}. Please try again.`;
    }

    // Save assistant message
    await this.prisma.agentConversation.create({
      data: { agentId, sessionId, role: 'assistant', content: reply },
    });

    // Update agent stats
    await this.prisma.aIAgent.update({
      where: { id: agentId },
      data: { lastRunAt: new Date(), totalRuns: { increment: 1 } },
    });

    return { reply, tokensUsed };
  }

  async getConversations(agentId: string, sessionId?: string) {
    return this.prisma.agentConversation.findMany({
      where: { agentId, ...(sessionId && { sessionId }) },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  private async runAgent(
    agent: { id: string; type: string; systemPrompt: string | null },
    executionId: string,
    input: Record<string, unknown>,
  ) {
    const startTime = Date.now();
    try {
      const systemPrompt = agent.systemPrompt || this.getDefaultPrompt(agent.type);
      let output = 'Execution completed';

      if (this.geminiModel) {
        const result = await this.geminiModel.generateContent(
          `${systemPrompt}\n\nTask: ${JSON.stringify(input)}`,
        );
        output = result.response.text();
      }

      await this.prisma.agentExecution.update({
        where: { id: executionId },
        data: { status: 'completed', output: { result: output } as any, duration: Date.now() - startTime, completedAt: new Date() },
      });
      await this.prisma.aIAgent.update({
        where: { id: agent.id },
        data: { lastRunAt: new Date(), totalRuns: { increment: 1 } },
      });
    } catch (error: any) {
      await this.prisma.agentExecution.update({
        where: { id: executionId },
        data: { status: 'failed', error: error.message, duration: Date.now() - startTime, completedAt: new Date() },
      });
    }
  }

  async initializeAgents(workspaceId: string) {
    const agentTypes = [
      { type: 'SALES', name: 'Sales Agent' },
      { type: 'MARKETING', name: 'Marketing Agent' },
      { type: 'ADVERTISEMENT', name: 'Advertisement Agent' },
      { type: 'FOLLOW_UP', name: 'Follow-up Agent' },
      { type: 'LEAD_QUALIFICATION', name: 'Lead Qualification Agent' },
      { type: 'CALLING', name: 'Calling Agent' },
      { type: 'SEO', name: 'SEO Agent' },
      { type: 'SOCIAL_MEDIA', name: 'Social Media Agent' },
      { type: 'CEO', name: 'CEO Agent' },
      { type: 'ANALYTICS', name: 'Analytics Agent' },
    ];
    for (const a of agentTypes) {
      await this.prisma.aIAgent.upsert({
        where: { workspaceId_type: { workspaceId, type: a.type as any } },
        create: { workspaceId, type: a.type as any, name: a.name, isActive: true, systemPrompt: this.getDefaultPrompt(a.type) },
        update: {},
      });
    }
  }

  private getDefaultPrompt(type: string): string {
    const prompts: Record<string, string> = {
      SALES: `You are an expert real estate sales agent AI for an Indian real estate company. You help with: calling leads, replying on WhatsApp, generating emails, booking site visits, and updating CRM. Always be professional and use Indian real estate context (prices in Lakhs/Crores, Indian cities, RERA compliance). Provide actionable advice.`,
      MARKETING: `You are a real estate marketing expert AI. You create: social media posts (Instagram, Facebook, LinkedIn), blog articles, ad copy, festival greetings, email campaigns, and content calendars. Use emojis, hashtags, and engaging language. Focus on Indian real estate market.`,
      ADVERTISEMENT: `You are a digital advertising expert AI for real estate. You manage Google Ads, Meta Ads, campaign optimization, A/B testing, budget allocation, and keyword research. Provide data-driven recommendations with ROI focus.`,
      FOLLOW_UP: `You are a follow-up specialist AI. You create personalized follow-up messages, schedule reminders, nurture cold leads, and maintain engagement. Be persistent but polite. Use Indian communication norms.`,
      LEAD_QUALIFICATION: `You are a lead qualification AI. You ask budget, location, property type, timeline, loan requirements. Score leads 0-100. Recommend agent assignment. Use Indian real estate price ranges.`,
      CALLING: `You are a voice AI assistant for real estate calls. You prepare call scripts, summarize conversations, identify customer sentiment, and recommend next actions.`,
      SEO: `You are an SEO expert AI for real estate. You create landing pages, blog content, meta tags, schema markup, keyword clusters, and internal linking strategies. Focus on local SEO for Indian cities.`,
      SOCIAL_MEDIA: `You are a social media manager AI. You create engaging posts with captions, hashtags, suggest posting times, reply to comments, and plan content calendars. Focus on visual real estate content.`,
      CEO: `You are a CEO-level business analyst AI. You provide daily business summaries, revenue analysis, growth opportunities, problem detection, and strategic recommendations. Be concise and data-driven.`,
      ANALYTICS: `You are a data analytics AI. You generate KPI reports, sales analytics, marketing ROI, conversion funnels, and forecasts. Present insights clearly with recommendations.`,
    };
    return prompts[type] || `You are an AI assistant for real estate. Be helpful and professional.`;
  }
}
