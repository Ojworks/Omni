import { motion } from "motion/react";
import { Moon, Sun, Monitor, Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface HeaderProps {
  onNavigate?: (view: 'home' | 'editor' | 'terms' | 'privacy' | 'changelog') => void;
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export function Header({ onNavigate, theme, onThemeChange }: HeaderProps) {

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate?.('home')} className="font-brand text-3xl font-black tracking-tighter cursor-pointer">OMNI</button>
        </div>
        
        <nav className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded border border-border bg-surface px-1 py-1">
            <button
              onClick={() => onThemeChange('light')}
              className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${theme === 'light' ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg'}`}
              aria-label="Light theme"
            >
              <Sun className="h-3 w-3" />
            </button>
            <button
              onClick={() => onThemeChange('dark')}
              className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${theme === 'dark' ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg'}`}
              aria-label="Dark theme"
            >
              <Moon className="h-3 w-3" />
            </button>
            <button
              onClick={() => onThemeChange('system')}
              className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${theme === 'system' ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg'}`}
              aria-label="System theme"
            >
              <Monitor className="h-3 w-3" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
