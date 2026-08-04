'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, MapPin } from 'lucide-react';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 text-emerald-600" />
        <span>Bakori, Wagholi-Bakori Road, Taluka Haveli, Pune</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-2 pl-3 border-l">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
            AP
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium leading-none">Admin</p>
            <p className="text-[10px] text-muted-foreground">Anandi Park</p>
          </div>
        </div>
      </div>
    </header>
  );
}
