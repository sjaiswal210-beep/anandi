import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function processAIAgentJob(job: Job, prisma: PrismaClient) {
  const { agentId, executionId, input, systemPrompt } = job.data;

  const startTime = Date.now();

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(input) },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const output = completion.choices[0]?.message?.content || '';
    const tokensUsed = completion.usage?.total_tokens || 0;

    await prisma.agentExecution.update({
      where: { id: executionId },
      data: {
        status: 'completed',
        output: { result: output },
        duration: Date.now() - startTime,
        tokensUsed,
        completedAt: new Date(),
      },
    });

    await prisma.aIAgent.update({
      where: { id: agentId },
      data: {
        lastRunAt: new Date(),
        totalRuns: { increment: 1 },
      },
    });

    return { success: true, output, tokensUsed };
  } catch (error) {
    await prisma.agentExecution.update({
      where: { id: executionId },
      data: {
        status: 'failed',
        error: (error as Error).message,
        duration: Date.now() - startTime,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}
