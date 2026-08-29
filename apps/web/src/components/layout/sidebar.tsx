'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Map,
  Target,
  Phone,
  MessageSquare,
  Share2,
  Search,
  Users,
  FileText,
  Globe,
  BarChart3,
  Palette,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Plot Inventory', href: '/plotting/inventory', icon: Map },
  { name: 'Leads', href: '/leads', icon: Target },
  { name: 'Voice Calls', href: '/plotting/calling', icon: Phone },
  { name: 'WhatsApp Bot', href: '/plotting/whatsapp-bot', icon: MessageSquare },
  { name: 'Social Media', href: '/plotting/social', icon: Share2 },
  { name: 'Marketing Kit', href: '/marketing-kit', icon: Palette },
  { name: 'Ads & Costs', href: '/plotting/ads', icon: BarChart3 },
  { name: 'Lead Scraper', href: '/plotting/scraper', icon: Search },
  { name: 'Customers', href: '/plotting/customers', icon: Users },
  { name: 'Team & HR', href: '/plotting/hr', icon: Users },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Project Website', href: '/project', icon: Globe },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2 }}
      className="h-full border-r bg-sidebar flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/richland-transparent.png" alt="Rich-Land Developers" className="h-9 w-9 shrink-0 object-contain" />
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="leading-tight"
            >
              <span className="font-bold text-base block">Anandi Park</span>
              <span className="text-[10px] text-muted-foreground">by Rich-Land Developers</span>
            </motion.div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                collapsed && 'justify-center',
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-emerald-600')} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Project badge */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">84 Plots · Bakori, Wagholi</p>
          <p className="text-[10px] text-emerald-600/70 mt-0.5">GAT No. 279, Taluka Haveli, Pune</p>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="border-t p-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
