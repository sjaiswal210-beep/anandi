'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Phone, MessageSquare, TrendingUp, Megaphone, UserCheck,
  Mic, Globe, Share2, BarChart3, Play, Pause, Settings,
  Activity, Zap, Send, X, Loader2, RefreshCw, History,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const agentConfigs = [
  { type: 'SALES', name: 'Sales Agent', icon: Phone, color: 'from-blue-500 to-blue-600',
    description: 'Calls leads, replies WhatsApp, generates emails, books visits, updates CRM.',
    capabilities: ['Call Leads', 'WhatsApp Reply', 'Email Generation', 'Book Visits', 'Update CRM'],
    samplePrompts: ['Call all new leads from today', 'Draft a follow-up email for Priya Sharma', 'Which leads should I prioritize today?'] },
  { type: 'MARKETING', name: 'Marketing Agent', icon: Megaphone, color: 'from-purple-500 to-purple-600',
    description: 'Creates social posts, blogs, ads, festival posts, carousels, email campaigns.',
    capabilities: ['Social Posts', 'Blog Writing', 'Ad Copy', 'Festival Posts', 'Email Campaigns'],
    samplePrompts: ['Create an Instagram post for Skyline Heights', 'Write a blog about home buying tips', 'Generate a Diwali greeting post'] },
  { type: 'ADVERTISEMENT', name: 'Advertisement Agent', icon: TrendingUp, color: 'from-orange-500 to-orange-600',
    description: 'Manages Google Ads, Meta Ads with campaign optimization and A/B testing.',
    capabilities: ['Google Ads', 'Meta Ads', 'Budget Optimization', 'A/B Testing', 'Keyword Suggestions'],
    samplePrompts: ['Optimize my current Google Ads campaign', 'Suggest keywords for 3BHK flats in Pune', 'What is my ad ROI this month?'] },
  { type: 'FOLLOW_UP', name: 'Follow-up Agent', icon: MessageSquare, color: 'from-green-500 to-green-600',
    description: 'Sends automated messages, schedules calls, reminders, nurtures pipeline.',
    capabilities: ['Auto Messages', 'Schedule Calls', 'Reminders', 'Lead Nurturing', 'Pipeline Updates'],
    samplePrompts: ['Send follow-up to all leads contacted 3 days ago', 'Which leads need immediate follow-up?', 'Create a nurture sequence for cold leads'] },
  { type: 'LEAD_QUALIFICATION', name: 'Lead Qualification Agent', icon: UserCheck, color: 'from-cyan-500 to-cyan-600',
    description: 'Asks qualifying questions, generates lead scores, assigns to salespersons.',
    capabilities: ['Ask Questions', 'Score Leads', 'Auto Assignment', 'Budget Analysis', 'Timeline Assessment'],
    samplePrompts: ['Score all unscored leads', 'Which leads have budget above 1 Cr?', 'Assign hot leads to top performers'] },
  { type: 'CALLING', name: 'Calling Agent', icon: Mic, color: 'from-red-500 to-red-600',
    description: 'Voice AI that calls customers, understands speech, generates summaries.',
    capabilities: ['Voice Calls', 'Speech Recognition', 'Call Summary', 'Book Visits', 'Sentiment Analysis'],
    samplePrompts: ['Call Aarav Mehta and check his interest level', 'Summarize last 5 calls', 'Schedule callbacks for missed calls'] },
  { type: 'SEO', name: 'SEO Agent', icon: Globe, color: 'from-teal-500 to-teal-600',
    description: 'Generates landing pages, blogs, meta tags, schemas, keyword clusters.',
    capabilities: ['Landing Pages', 'Blog Generation', 'Meta Tags', 'Schema Markup', 'Keyword Clustering'],
    samplePrompts: ['Create a landing page for Skyline Heights 3BHK', 'Generate meta tags for all properties', 'What keywords should I target for Pune real estate?'] },
  { type: 'SOCIAL_MEDIA', name: 'Social Media Agent', icon: Share2, color: 'from-pink-500 to-pink-600',
    description: 'Creates images, captions, videos, hashtags, schedules posts, replies to comments.',
    capabilities: ['Content Creation', 'Caption Writing', 'Hashtags', 'Post Scheduling', 'Comment Replies'],
    samplePrompts: ['Create a week of Instagram content for our new project', 'Generate trending hashtags for real estate', 'Reply to pending comments on Facebook'] },
  { type: 'CEO', name: 'CEO Agent', icon: BarChart3, color: 'from-indigo-500 to-indigo-600',
    description: 'Daily business analysis, revenue forecasts, suggestions, growth opportunities.',
    capabilities: ['Business Analysis', 'Revenue Forecast', 'Growth Suggestions', 'Problem Detection', 'Weekly Reports'],
    samplePrompts: ['Give me today\'s business summary', 'What are our growth bottlenecks?', 'Forecast next month\'s revenue'] },
  { type: 'ANALYTICS', name: 'Analytics Agent', icon: Activity, color: 'from-amber-500 to-amber-600',
    description: 'Generates charts, KPIs, sales analytics, ROI tracking, and forecasts.',
    capabilities: ['Charts', 'KPI Tracking', 'Sales Analytics', 'ROI Analysis', 'Forecasting'],
    samplePrompts: ['Show me conversion rate by source', 'What is our cost per lead?', 'Compare this month vs last month performance'] },
];

interface AgentData {
  id: string;
  type: string;
  name: string;
  isActive: boolean;
  lastRunAt: string | null;
  totalRuns: number;
  _count?: { executions: number; conversations: number };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAgentsPage() {
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sessionId] = useState(() => 'session-' + Date.now().toString(36));

  const { data: agentsData, isLoading } = useQuery({
    queryKey: ['ai-agents'],
    queryFn: () => api.get('/ai-agents'),
  });

  const agents: AgentData[] = agentsData?.data || [];

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.post(`/ai-agents/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success('Agent status updated');
    },
  });

  const executeMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      api.post(`/ai-agents/${id}/execute`, input),
    onSuccess: (data: any) => {
      toast.success('Agent execution started');
    },
  });

  const chatMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      api.post(`/ai-agents/${id}/chat`, { message, sessionId }),
    onSuccess: (data: any) => {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data?.data?.reply || 'Agent responded.', timestamp: new Date() },
      ]);
    },
    onError: () => {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I could not process that request. Please check your OpenAI API key configuration.', timestamp: new Date() },
      ]);
    },
  });

  const handleSendChat = () => {
    if (!chatInput.trim() || !selectedAgent) return;
    const agentData = agents.find((a) => a.type === selectedAgent);
    if (!agentData) return;

    setChatMessages((prev) => [...prev, { role: 'user', content: chatInput, timestamp: new Date() }]);
    chatMutation.mutate({ id: agentData.id, message: chatInput });
    setChatInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    setChatInput(prompt);
  };

  const selectedConfig = agentConfigs.find((a) => a.type === selectedAgent);
  const selectedData = agents.find((a) => a.type === selectedAgent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" /> AI Agents
          </h1>
          <p className="text-muted-foreground mt-1">10 autonomous AI agents working 24/7 for your business</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>{agents.filter((a) => a.isActive).length} Active</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        {/* Agent List (Left Panel) */}
        <div className="w-80 space-y-2 overflow-y-auto pr-2">
          {agentConfigs.map((config) => {
            const data = agents.find((a) => a.type === config.type);
            const isSelected = selectedAgent === config.type;
            return (
              <motion.button
                key={config.type}
                onClick={() => { setSelectedAgent(config.type); setChatMessages([]); }}
                className={`w-full text-left rounded-xl p-4 border transition-all ${
                  isSelected ? 'border-primary bg-primary/5 shadow-md' : 'hover:border-primary/30 hover:bg-muted/50'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${config.color}`}>
                    <config.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{config.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{config.description.slice(0, 40)}...</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${data?.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                {data && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{data.totalRuns} runs</span>
                    {data.lastRunAt && <span>Last: {new Date(data.lastRunAt).toLocaleDateString()}</span>}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Agent Detail & Chat (Right Panel) */}
        <div className="flex-1 flex flex-col border rounded-xl overflow-hidden bg-card">
          {selectedAgent && selectedConfig ? (
            <>
              {/* Agent Header */}
              <div className={`bg-gradient-to-r ${selectedConfig.color} p-5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                      <selectedConfig.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{selectedConfig.name}</h2>
                      <p className="text-sm text-white/80">{selectedConfig.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => selectedData && toggleMutation.mutate(selectedData.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                        selectedData?.isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {selectedData?.isActive ? <><Pause className="h-3 w-3" /> Active</> : <><Play className="h-3 w-3" /> Paused</>}
                    </button>
                    <button
                      onClick={() => selectedData && executeMutation.mutate({ id: selectedData.id, input: { trigger: 'manual_run' } })}
                      disabled={executeMutation.isPending}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/20 text-white flex items-center gap-1.5 hover:bg-white/30"
                    >
                      {executeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                      Run Now
                    </button>
                  </div>
                </div>
                {/* Capabilities */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedConfig.capabilities.map((cap) => (
                    <span key={cap} className="px-2 py-0.5 bg-white/15 rounded-full text-xs text-white/90">{cap}</span>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <selectedConfig.icon className="h-16 w-16 text-muted-foreground/20 mb-4" />
                    <p className="text-lg font-medium mb-2">Chat with {selectedConfig.name}</p>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md">
                      Ask me to perform tasks, get insights, or generate content. I work with your real CRM data.
                    </p>
                    <div className="space-y-2 w-full max-w-md">
                      <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
                      {selectedConfig.samplePrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => handleQuickPrompt(prompt)}
                          className="w-full text-left px-4 py-2.5 border rounded-lg text-sm hover:bg-muted/50 hover:border-primary/30 transition"
                        >
                          &ldquo;{prompt}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-[10px] opacity-60 mt-1">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {selectedConfig.name} is thinking...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                    placeholder={`Ask ${selectedConfig.name} anything...`}
                    className="flex-1 px-4 py-3 border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    disabled={chatMutation.isPending}
                  />
                  <button
                    onClick={handleSendChat}
                    disabled={!chatInput.trim() || chatMutation.isPending}
                    className="px-4 py-3 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 hover:bg-primary/90 transition"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <Bot className="h-20 w-20 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Select an AI Agent</h3>
                <p className="text-muted-foreground max-w-sm">
                  Choose an agent from the left panel to chat, configure, or execute tasks.
                  Each agent specializes in a different area of your business.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
