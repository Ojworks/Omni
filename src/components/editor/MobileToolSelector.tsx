import { motion } from "motion/react";
import { Crop, Sliders, Palette, FileStack, Download, Maximize, Wand2 } from "lucide-react";

export type ToolCategory = 'transform' | 'adjust' | 'filters' | 'resize' | 'batch' | 'export' | 'magic' | 'none';

interface MobileToolSelectorProps {
  activeCategory: ToolCategory;
  setActiveCategory: (category: ToolCategory) => void;
  className?: string;
  disabled?: boolean;
}

export const MobileToolSelector = ({ activeCategory, setActiveCategory, className = "", disabled = false }: MobileToolSelectorProps) => {
  const categories = [
    { id: 'transform', label: 'Crop', icon: Crop },
    { id: 'filters', label: 'Filters', icon: Palette },
    { id: 'resize', label: 'Resize', icon: Maximize },
    { id: 'magic', label: 'Magic', icon: Wand2 },
    { id: 'batch', label: 'Files', icon: FileStack },
    { id: 'export', label: 'Export', icon: Download },
  ] as const;

  return (
    <div className={`flex w-full overflow-x-auto hide-scrollbar flex-nowrap border-t border-border bg-surface/90 backdrop-blur-2xl pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.08)] ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.id;
        const Icon = cat.icon;
        
        return (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id === activeCategory ? 'none' : cat.id as ToolCategory)}
            className={`relative flex-1 min-w-[64px] flex flex-col items-center justify-center gap-1 py-3 transition-all duration-300 ${isActive ? 'text-accent' : 'text-muted hover:text-fg'}`}
          >
            {/* Active background pill */}
            {isActive && (
              <motion.div
                layoutId="active-tool-bg"
                className="absolute inset-x-2 inset-y-1.5 rounded-xl bg-accent/10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
              />
            )}
            <Icon className={`relative h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
            <span className={`relative text-[8px] font-black uppercase tracking-[0.08em] transition-colors duration-300`}>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
