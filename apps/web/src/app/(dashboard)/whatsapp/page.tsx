'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Send, Search, Phone, Video, MoreVertical, Check, CheckCheck, Paperclip, Smile, Bot, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Message {
  id: string;
  from: string;
  to: string;
  direction: string;
  content: any;
  status: string;
  createdAt: string;
}

interface Contact {
  phone: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

export default function WhatsAppPage() {
  const queryClient = useQueryClient();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: () => api.get('/whatsapp/conversations'),
    refetchInterval: 5000,
  });

  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['whatsapp-messages', selectedContact],
    queryFn: () => api.get('/whatsapp/messages', { params: { phone: selectedContact } }),
    enabled: !!selectedContact,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (data: { to: string; message: string }) => api.post('/whatsapp/send', data),
    onSuccess: () => {
      setMessage('');
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
    onError: () => toast.error('Failed to send'),
  });

  const conversations: Message[] = conversationsData?.data || [];
  const messages: Message[] = messagesData?.data || [];

  // Build contacts list from conversations
  const contactsMap = new Map<string, Contact>();
  conversations.forEach((msg) => {
    const phone = msg.direction === 'incoming' ? msg.from : msg.to;
    if (!contactsMap.has(phone)) {
      const names: Record<string, string> = {
        '919876543001': 'Priya Sharma', '919876543002': 'Amit Patel',
        '919876543003': 'Vikram Singh', '919876543004': 'Neha Gupta',
        '919876543005': 'Rajesh Kumar',
      };
      contactsMap.set(phone, {
        phone,
        name: names[phone] || phone,
        lastMessage: msg.content?.text?.body?.slice(0, 50) || 'Media',
        lastTime: msg.createdAt,
        unread: msg.direction === 'incoming' ? 1 : 0,
      });
    }
  });
  const contacts = [...contactsMap.values()].sort((a, b) =>
    new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
  );

  const selectedName = contacts.find((c) => c.phone === selectedContact)?.name || selectedContact;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !selectedContact) return;
    sendMutation.mutate({ to: selectedContact, message });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex border rounded-xl overflow-hidden bg-card">
      {/* Left Sidebar - Contact List */}
      <div className="w-96 border-r flex flex-col bg-background">
        {/* Header */}
        <div className="p-4 border-b bg-[#008069] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Fame Developers Business</p>
              <p className="text-xs text-white/70">AI-powered</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-white/80 cursor-pointer" />
            <MoreVertical className="h-5 w-5 text-white/80 cursor-pointer" />
          </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted text-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Phone className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No conversations yet
            </div>
          ) : (
            contacts.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((contact) => (
              <button
                key={contact.phone}
                onClick={() => setSelectedContact(contact.phone)}
                className={`w-full text-left px-4 py-3 border-b border-muted/50 hover:bg-muted/50 transition flex items-center gap-3 ${
                  selectedContact === contact.phone ? 'bg-muted' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {contact.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{contact.name}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(contact.lastTime)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate pr-2">
                      {contact.lastMessage}
                    </p>
                    {contact.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#25D366] text-white text-[10px] flex items-center justify-center shrink-0">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b bg-[#f0f2f5] dark:bg-muted flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                  {selectedName?.[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedName}</p>
                  <p className="text-xs text-green-600">online</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <Video className="h-5 w-5 cursor-pointer hover:text-foreground" />
                <Phone className="h-5 w-5 cursor-pointer hover:text-foreground" />
                <Search className="h-5 w-5 cursor-pointer hover:text-foreground" />
                <MoreVertical className="h-5 w-5 cursor-pointer hover:text-foreground" />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'400\' height=\'400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3Cpattern id=\'a\' patternUnits=\'userSpaceOnUse\' width=\'40\' height=\'40\'%3E%3Cpath d=\'M0 20h40M20 0v40\' fill=\'none\' stroke=\'%23e5e5e5\' stroke-width=\'.3\'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width=\'400\' height=\'400\' fill=\'%23efeae2\' /%3E%3Crect width=\'400\' height=\'400\' fill=\'url(%23a)\' opacity=\'.3\'/%3E%3C/svg%3E")' }}>
              {messages.map((msg, i) => {
                const isOutgoing = msg.direction === 'outgoing';
                const showDate = i === 0 || formatDate(messages[i-1].createdAt) !== formatDate(msg.createdAt);
                return (
                  <div key={msg.id || i}>
                    {showDate && (
                      <div className="text-center my-3">
                        <span className="px-3 py-1 bg-white dark:bg-card rounded-lg text-xs text-muted-foreground shadow-sm">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-1`}
                    >
                      <div className={`max-w-[65%] rounded-lg px-3 py-2 shadow-sm relative ${
                        isOutgoing ? 'bg-[#d9fdd3] dark:bg-green-900/40 rounded-tr-none' : 'bg-white dark:bg-card rounded-tl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content?.text?.body || ''}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isOutgoing ? '' : ''}`}>
                          <span className="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
                          {isOutgoing && (
                            <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 py-3 border-t bg-[#f0f2f5] dark:bg-muted flex items-center gap-3">
              <Smile className="h-6 w-6 text-muted-foreground cursor-pointer" />
              <Paperclip className="h-6 w-6 text-muted-foreground cursor-pointer" />
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message"
                className="flex-1 px-4 py-2.5 rounded-lg bg-white dark:bg-background border-0 text-sm focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
                className="w-10 h-10 rounded-full bg-[#008069] text-white flex items-center justify-center hover:bg-[#006e5a] transition disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#f0f2f5] dark:bg-muted/30">
            <div className="text-center">
              <div className="w-64 h-64 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/10 flex items-center justify-center">
                <Phone className="h-24 w-24 text-green-200 dark:text-green-800" />
              </div>
              <h3 className="text-2xl font-light text-muted-foreground">Fame Developers WhatsApp Business</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Send and receive messages from your leads. AI auto-replies when you are away.
                Select a conversation to start chatting.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
