'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, Users, Key, Shield, Bell, Globe, Palette, Database } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const tabs = [
  { key: 'general', label: 'General', icon: Settings },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'api', label: 'API Keys', icon: Key },
  { key: 'billing', label: 'Billing', icon: Database },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'integrations', label: 'Integrations', icon: Globe },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const { user, currentWorkspace } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage workspace preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-56 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                activeTab === tab.key
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-card border rounded-xl p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-lg">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Workspace Name</label>
                  <input
                    type="text"
                    defaultValue={currentWorkspace?.name}
                    className="w-full px-4 py-2 border rounded-lg bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Workspace Slug</label>
                  <input
                    type="text"
                    defaultValue={currentWorkspace?.slug}
                    disabled
                    className="w-full px-4 py-2 border rounded-lg bg-muted text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select className="w-full px-4 py-2 border rounded-lg bg-background text-sm">
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <select className="w-full px-4 py-2 border rounded-lg bg-background text-sm">
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  </select>
                </div>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Team Members</h3>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
                  Invite Member
                </button>
              </div>
              <p className="text-sm text-muted-foreground">Manage who has access to this workspace.</p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Security</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <button className="px-3 py-1.5 border rounded-lg text-sm">Enable</button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Session Management</p>
                    <p className="text-sm text-muted-foreground">View and manage active sessions</p>
                  </div>
                  <button className="px-3 py-1.5 border rounded-lg text-sm">View Sessions</button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Audit Logs</p>
                    <p className="text-sm text-muted-foreground">Track all workspace activity</p>
                  </div>
                  <button className="px-3 py-1.5 border rounded-lg text-sm">View Logs</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">API Keys</h3>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
                  Generate Key
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Use API keys to integrate Fame Developers with external services.
              </p>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Billing & Subscription</h3>
              <div className="p-4 border rounded-lg bg-primary/5">
                <p className="font-medium">Professional Plan</p>
                <p className="text-sm text-muted-foreground">5,000 leads • 500 properties • 25 users</p>
                <button className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
                  Upgrade Plan
                </button>
              </div>
            </div>
          )}

          {['notifications', 'appearance', 'integrations'].includes(activeTab) && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg capitalize">{activeTab}</h3>
              <p className="text-sm text-muted-foreground">Configure your {activeTab} preferences.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
