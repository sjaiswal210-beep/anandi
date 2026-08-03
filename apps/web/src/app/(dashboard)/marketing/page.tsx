'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus, Megaphone, TrendingUp, Eye, MousePointerClick, IndianRupee,
  Instagram, Facebook, Linkedin, Globe, Mail, Calendar, Sparkles,
  Copy, Download, RefreshCw, Send, Image, FileText, Hash, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const platformColors: Record<string, string> = {
  google: 'bg-blue-100 text-blue-700',
  meta: 'bg-indigo-100 text-indigo-700',
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  linkedin: 'bg-sky-100 text-sky-700',
  email: 'bg-green-100 text-green-700',
};

type TabType = 'campaigns' | 'social' | 'content';

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [contentType, setContentType] = useState('instagram');
  const [contentPrompt, setContentPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/reports/marketing', { params: { period: 'monthly' } }),
  });

  const campaigns = campaignsData?.data?.campaigns || [];
  const totalSpent = campaigns.reduce((s: number, c: any) => s + Number(c.spent || 0), 0);
  const totalLeads = campaigns.reduce((s: number, c: any) => s + (c.metrics?.leads || 0), 0);

  // AI Content Generation (uses the Marketing Agent)
  const generateContent = async () => {
    if (!contentPrompt.trim()) {
      toast.error('Enter what content you want to generate');
      return;
    }
    setIsGenerating(true);
    try {
      // Find marketing agent and use chat
      const agentsRes: any = await api.get('/ai-agents');
      const marketingAgent = agentsRes?.data?.find((a: any) => a.type === 'MARKETING');
      if (!marketingAgent) { toast.error('Marketing agent not found'); return; }

      const prompt = `Generate ${contentType} content for: ${contentPrompt}. 
Format the response as a social media post with:
- Caption/Text (engaging, with emojis)
- Hashtags (10 relevant ones)
- Best posting time
- Content type suggestion (image/video/carousel)`;

      const res: any = await api.post(`/ai-agents/${marketingAgent.id}/chat`, {
        message: prompt,
        sessionId: 'marketing-' + Date.now(),
      });

      const newContent = {
        id: Date.now(),
        platform: contentType,
        prompt: contentPrompt,
        content: res?.data?.reply || 'Content generated successfully. Configure OpenAI API key for AI responses.',
        createdAt: new Date().toISOString(),
      };
      setGeneratedContent((prev) => [newContent, ...prev]);
      setContentPrompt('');
      toast.success('Content generated!');
    } catch (err) {
      toast.error('Generation failed - check API key');
    } finally {
      setIsGenerating(false);
    }
  };

  // Predefined content plans
  const contentCalendar = [
    { day: 'Monday', type: 'Property Showcase', platform: 'Instagram', desc: 'High-quality property photos with features', status: 'posted' },
    { day: 'Tuesday', type: 'Client Testimonial', platform: 'Facebook', desc: 'Video testimonial from happy buyer', status: 'scheduled' },
    { day: 'Wednesday', type: 'Market Insight', platform: 'LinkedIn', desc: 'Real estate market trends & analysis', status: 'scheduled' },
    { day: 'Thursday', type: 'Behind the Scenes', platform: 'Instagram', desc: 'Construction progress / team at work', status: 'draft' },
    { day: 'Friday', type: 'Weekend Open House', platform: 'All', desc: 'Invite for weekend site visits', status: 'draft' },
    { day: 'Saturday', type: 'Tips & Education', platform: 'Instagram', desc: 'Home buying tips, loan guide', status: 'draft' },
    { day: 'Sunday', type: 'Lifestyle Post', platform: 'Instagram', desc: 'Community living, amenities showcase', status: 'draft' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing & Social Media</h1>
          <p className="text-muted-foreground mt-1">Campaigns, content generation, and social scheduling</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {[
          { key: 'campaigns' as const, label: 'Ad Campaigns', icon: Megaphone },
          { key: 'social' as const, label: 'Social Content Generator', icon: Sparkles },
          { key: 'content' as const, label: 'Content Calendar', icon: Calendar },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Campaigns', value: campaigns.filter((c: any) => c.status === 'ACTIVE').length, icon: Megaphone, color: 'text-blue-600' },
              { label: 'Total Leads', value: totalLeads, icon: TrendingUp, color: 'text-green-600' },
              { label: 'Total Spent', value: formatCurrency(totalSpent), icon: IndianRupee, color: 'text-orange-600' },
              { label: 'Avg. Cost/Lead', value: totalLeads > 0 ? formatCurrency(Math.round(totalSpent / totalLeads)) : '₹0', icon: MousePointerClick, color: 'text-purple-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border rounded-xl p-4 flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Campaign</th>
                  <th className="text-left px-4 py-3 font-medium">Platform</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Budget</th>
                  <th className="text-left px-4 py-3 font-medium">Spent</th>
                  <th className="text-left px-4 py-3 font-medium">Leads</th>
                  <th className="text-left px-4 py-3 font-medium">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaigns.map((campaign: any, i: number) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{campaign.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${platformColors[campaign.platform] || 'bg-gray-100'}`}>
                        {campaign.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        campaign.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                        campaign.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' : ''
                      }`}>{campaign.status}</span>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(Number(campaign.budget || 0))}</td>
                    <td className="px-4 py-3">{formatCurrency(Number(campaign.spent || 0))}</td>
                    <td className="px-4 py-3 font-medium text-green-600">{campaign.metrics?.leads || '-'}</td>
                    <td className="px-4 py-3">{campaign.metrics?.ctr ? `${campaign.metrics.ctr}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Social Content Generator Tab */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generator */}
          <div className="space-y-4">
            <div className="bg-card border rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> AI Content Generator
              </h3>

              {/* Platform Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'hover:bg-pink-50 hover:border-pink-300' },
                    { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'hover:bg-blue-50 hover:border-blue-300' },
                    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'hover:bg-sky-50 hover:border-sky-300' },
                    { key: 'blog', label: 'Blog Post', icon: FileText, color: 'hover:bg-green-50 hover:border-green-300' },
                    { key: 'email', label: 'Email', icon: Mail, color: 'hover:bg-orange-50 hover:border-orange-300' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setContentType(p.key)}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition ${
                        contentType === p.key ? 'bg-primary/10 border-primary text-primary' : p.color
                      }`}
                    >
                      <p.icon className="h-4 w-4" /> {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">What do you want to post about?</label>
                <textarea
                  value={contentPrompt}
                  onChange={(e) => setContentPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g., New 3BHK launch in Baner, Pune with rooftop pool and garden view..."
                  className="w-full px-4 py-3 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Quick Templates */}
              <div className="mb-4">
                <label className="block text-xs text-muted-foreground mb-2">Quick templates:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'New property launch', 'Festival greeting', 'Client testimonial',
                    'Market update', 'Open house invite', 'Price drop alert',
                  ].map((t) => (
                    <button
                      key={t}
                      onClick={() => setContentPrompt(t)}
                      className="px-2.5 py-1 bg-muted rounded-full text-xs hover:bg-primary/10 transition"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateContent}
                disabled={isGenerating || !contentPrompt.trim()}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition"
              >
                {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Content</>}
              </button>
            </div>
          </div>

          {/* Generated Content */}
          <div className="space-y-4">
            <h3 className="font-semibold">Generated Content</h3>
            {generatedContent.length === 0 ? (
              <div className="bg-card border rounded-xl p-8 text-center">
                <Image className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground text-sm">Your AI-generated content will appear here</p>
              </div>
            ) : (
              generatedContent.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${platformColors[item.platform] || 'bg-gray-100'}`}>
                      {item.platform}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { navigator.clipboard.writeText(item.content); toast.success('Copied!'); }} className="p-1.5 hover:bg-muted rounded" title="Copy">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded" title="Schedule">
                        <Calendar className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Content Calendar Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Weekly Content Plan
            </h3>
            <div className="space-y-3">
              {contentCalendar.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition">
                  <div className="w-20 text-center">
                    <p className="font-bold text-sm">{item.day}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{item.type}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        item.platform === 'Instagram' ? 'bg-pink-100 text-pink-700' :
                        item.platform === 'Facebook' ? 'bg-blue-100 text-blue-700' :
                        item.platform === 'LinkedIn' ? 'bg-sky-100 text-sky-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>{item.platform}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    item.status === 'posted' ? 'bg-green-100 text-green-700' :
                    item.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{item.status}</span>
                  <button
                    onClick={() => { setActiveTab('social'); setContentPrompt(item.desc); setContentType(item.platform.toLowerCase()); }}
                    className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                  >
                    Generate
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Social Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Instagram className="h-5 w-5 text-pink-600" />
                <span className="font-medium">Instagram</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div><p className="text-xl font-bold">12.4K</p><p className="text-xs text-muted-foreground">Followers</p></div>
                <div><p className="text-xl font-bold">4.2%</p><p className="text-xs text-muted-foreground">Engagement</p></div>
                <div><p className="text-xl font-bold">28</p><p className="text-xs text-muted-foreground">Posts/Month</p></div>
                <div><p className="text-xl font-bold">890</p><p className="text-xs text-muted-foreground">Avg. Likes</p></div>
              </div>
            </div>
            <div className="bg-card border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Facebook className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Facebook</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div><p className="text-xl font-bold">8.7K</p><p className="text-xs text-muted-foreground">Page Likes</p></div>
                <div><p className="text-xl font-bold">3.1%</p><p className="text-xs text-muted-foreground">Engagement</p></div>
                <div><p className="text-xl font-bold">15</p><p className="text-xs text-muted-foreground">Posts/Month</p></div>
                <div><p className="text-xl font-bold">42</p><p className="text-xs text-muted-foreground">Leads/Month</p></div>
              </div>
            </div>
            <div className="bg-card border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Linkedin className="h-5 w-5 text-sky-600" />
                <span className="font-medium">LinkedIn</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div><p className="text-xl font-bold">2.3K</p><p className="text-xs text-muted-foreground">Connections</p></div>
                <div><p className="text-xl font-bold">5.8%</p><p className="text-xs text-muted-foreground">Engagement</p></div>
                <div><p className="text-xl font-bold">8</p><p className="text-xs text-muted-foreground">Posts/Month</p></div>
                <div><p className="text-xl font-bold">12</p><p className="text-xs text-muted-foreground">B2B Leads</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
