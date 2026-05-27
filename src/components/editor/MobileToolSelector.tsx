import { memo } from "react";
import { motion } from "motion/react";
import { Crop, Sliders, Palette, FileStack, Download, Maximize, Wand2 } from "lucide-react";

export type ToolCategory = 'transform' | 'filters' | 'resize' | 'batch' | 'export' | 'magic' | 'none';

interface MobileToolSelectorProps {
  activeCategory: ToolCategory;
  setActiveCategory: (category: ToolCategory) => void;
  className?: string;
  disabled?: boolean;
}

export const MobileToolSelector = memo(({ activeCategory, setActiveCategory, className = "", disabled = false }: MobileToolSelectorProps) => {
  const categories = [
    { id: 'transform', label: 'Crop', icon: Crop },
    { id: 'filters', label: 'Filters', icon: Palette },
    { id: 'resize', label: 'Resize', icon: Maximize },
    { id: 'magic', label: 'Magic', icon: Wand2 },
    { id: 'batch', label: 'Files', icon: FileStack },
    { id: 'export', label: 'Export', icon: Download },
  ] as const;

  return (
      <div className={`flex w-full border-t border-border bg-surface/95 backdrop-blur-2xl pb-safe max-sm:pb-[max(env(safe-area-inset-bottom,0px),4px)] ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id === activeCategory ? 'none' : cat.id as ToolCategory)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 max-sm:gap-0.5 py-3 max-sm:py-2 transition-colors min-w-0 ${isActive ? 'text-accent' : 'text-muted'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tool-bg"
                  className="absolute inset-x-1 inset-y-0.5 max-sm:inset-x-0.5 rounded-xl bg-accent/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className={`relative h-[18px] w-[18px] max-sm:h-[16px] max-sm:w-[16px] transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className="relative text-[8px] max-sm:text-[7px] font-black uppercase tracking-[0.06em] truncate max-w-full">{cat.label}</span>
            </button>
          );
        })}
      </div>
  );
});
