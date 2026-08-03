'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Share2, Sparkles, Calendar, Send, Copy } from 'lucide-react';
import api from '@/lib/api';

const platformStyles: Record<string, string> = {
  INSTAGRAM: 'bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300',
  FACEBOOK: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
  WHATSAPP: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
  YOUTUBE: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300',
};

export default function SocialMediaPage() {
  const queryClient = useQueryClient();
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [topic, setTopic] = useState('Anandi Park NA plots at Bakori, Wagholi — limited corner plots left');
  const [notice, setNotice] = useState('');

  const { data: posts = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['social-posts'],
    queryFn: async () => {
      const res: any = await api.get('/social-media/posts');
      const payload = res?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      return [];
    },
  });

  const generate = useMutation({
    mutationFn: async () => api.post('/social-media/generate', { platform, topic }),
    onSuccess: () => {
      setNotice('Post generated.');
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    },
    onError: (err: any) => setNotice(`Generate failed: ${err?.message || 'request failed'}`),
  });

  const publish = useMutation({
    mutationFn: async (id: string) => api.post(`/social-media/${id}/publish`),
    onSuccess: () => {
      setNotice('Post marked as published.');
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
    },
    onError: (err: any) => setNotice(`Publish failed: ${err?.message || 'request failed'}`),
  });

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setNotice('Caption copied to clipboard.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Share2 className="h-8 w-8 text-primary" /> Social Media
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate and manage Instagram / Facebook content for Anandi Park
        </p>
      </div>

      {notice && (
        <div className="bg-card border rounded-xl px-4 py-3 text-sm">{notice}</div>
      )}

      {/* Generator */}
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Generate with AI
        </h2>
        <div className="flex flex-wrap gap-3">
          {['INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'YOUTUBE'].map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                platform === p ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
              }`}
            >
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={3}
          className="w-full rounded-lg border bg-background p-3 text-sm"
          placeholder="What should the post be about?"
        />
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending || !topic.trim()}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {generate.isPending ? 'Generating…' : 'Generate Post'}
        </button>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        <h2 className="font-semibold">Posts ({posts.length})</h2>

        {isLoading && (
          <div className="bg-card border rounded-xl p-6 text-sm text-muted-foreground">Loading posts…</div>
        )}
        {!isLoading && error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-6 text-sm text-red-600">
            Could not load posts: {(error as any)?.message || 'request failed'}
          </div>
        )}
        {!isLoading && !error && posts.length === 0 && (
          <div className="bg-card border rounded-xl p-6 text-sm text-muted-foreground">
            No posts yet. Generate one above.
          </div>
        )}

        {posts.map((post) => (
          <div key={post.id} className="bg-card border rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${platformStyles[post.platform] || 'bg-muted'}`}>
                  {post.platform}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted">{post.status}</span>
                {post.bestTime && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {post.bestTime}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copy(post.content || post.caption || '')}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
                {post.status !== 'PUBLISHED' && (
                  <button
                    onClick={() => publish.mutate(post.id)}
                    disabled={publish.isPending}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" /> Mark Published
                  </button>
                )}
              </div>
            </div>

            <p className="text-sm whitespace-pre-wrap">{post.content || post.caption}</p>

            {Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
              <p className="text-xs text-primary">{post.hashtags.map((h: string) => (h.startsWith('#') ? h : `#${h}`)).join(' ')}</p>
            )}

            {post.imagePrompt && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Image idea:</span> {post.imagePrompt}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
