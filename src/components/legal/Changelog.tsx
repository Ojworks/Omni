import { motion } from "motion/react";
import { Calendar, ArrowRight } from "lucide-react";

const changes = [
  {
    version: "1.1.0",
    date: "May 26, 2026",
    title: "Editor Overhaul & Batch Controls",
    items: [
      "Rebuilt the desktop editor toolbar with a clean tab-based layout: Filters, Transform, Resize, and Magic — all accessible in one click.",
      "Filters now show a live color swatch preview so you can see the effect before applying it.",
      "Improved the mobile editor with larger tap targets, visual filter swatches, and a cleaner layout throughout.",
      "Replaced the mobile quality slider with a smooth drop-up sheet matching the desktop quality dropdown (Low, Medium, High, Maximum).",
      "Added \"Apply Edits to All\" and \"Reset All\" batch controls — available in the desktop sidebar and the mobile Files screen.",
      "Fixed the mobile file thumbnail delete buttons being clipped by the scroll container.",
      "Fixed a React hooks violation where state was being called after a conditional return in the toolbar."
    ],
    type: "Minor"
  },
  {
    version: "1.0.0",
    date: "May 25, 2026",
    title: "Initial Launch",
    items: [
      "Official launch of OMNI: A fast, private workspace for editing documents and images.",
      "Added the Magic Background Remover, which runs using smart AI directly on your device.",
      "Added 10+ custom filters (like Clean Scan and Mono Sharp) to make scanned pages look crisp and clear.",
      "Created a fast batch editing tool to work with multiple student files or photos all at once.",
      "Added handy editing tools to crop, rotate, flip, and resize images with ease.",
      "Built the entire application to run 100% on your device, ensuring your files are never uploaded or shared.",
      "Designed a clean, modern, and easy-to-use interface to help you focus on your work."
    ],
    type: "Major"
  }
];

export const Changelog = ({ onNavigate }: { onNavigate?: (view: any) => void }) => {
  return (
    <div className="pt-20 md:pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 md:mb-16 text-center"
        >
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-4 md:mb-6 leading-[0.9]">
            Changelog
          </h1>
          <p className="text-muted text-base md:text-lg max-w-xl mx-auto px-4 md:px-0">
            Following the evolution of OMNI. Every update, every detail, and every performance boost.
          </p>
        </motion.div>

        <div className="space-y-12">
          {changes.map((change, idx) => (
            <motion.div 
              key={change.version}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative pl-8 md:pl-0"
            >
              <div className="md:grid md:grid-cols-4 gap-8">
                <div className="mb-4 md:mb-0">
                  <div className="md:sticky md:top-32">
                    <div className="flex items-center gap-2 text-accent font-mono text-xs md:text-sm font-black mb-1">
                      <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" /> {change.date}
                    </div>
                    <div className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                      Version {change.version}
                    </div>
                    <div className={`mt-2 md:mt-3 inline-block px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-widest ${
                      change.type === 'Major' ? 'bg-accent text-bg' : 'border border-border text-muted'
                    }`}>
                      {change.type}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3 pb-8 md:pb-12 border-b border-border/50 last:border-0">
                  <h2 className="text-lg md:text-2xl font-black uppercase tracking-tight mb-4 flex items-center gap-3">
                    {change.title}
                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-accent opacity-20" />
                  </h2>
                  <ul className="space-y-4">
                    {change.items.map((item, i) => (
                      <li key={i} className="flex gap-3 md:gap-4 text-muted leading-relaxed">
                        <span className="mt-2 h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-accent/30 shrink-0" />
                        <span className="text-sm md:text-[15px]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Timeline Line */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-border md:hidden" />
              <div className="absolute left-[-3px] top-0 h-1.5 w-1.5 rounded-full bg-accent md:hidden" />
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-16 md:mt-20 p-6 md:p-8 rounded-2xl md:rounded-3xl bg-surface border border-border text-center"
        >
          <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-2">Have a suggestion?</h3>
          <p className="text-muted text-xs md:text-sm mb-6">We're constantly evolving based on user feedback. Let us know what you want to see next.</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <a 
              href="mailto:features@omni.local?subject=Feature Request: OMNI"
              className="w-full md:w-auto px-8 py-4 rounded-xl md:rounded-2xl bg-fg text-bg text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all text-center"
            >
              Request Feature
            </a>
            <button 
              onClick={() => onNavigate?.('archive')}
              className="w-full md:w-auto px-8 py-4 rounded-xl md:rounded-2xl bg-surface-hover border border-border text-fg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-border transition-all text-center cursor-pointer"
            >
              View Development History
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
