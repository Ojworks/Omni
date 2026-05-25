import { motion } from "motion/react";
import { Calendar, ArrowRight } from "lucide-react";

const changes: any[] = [];

export const Archive = ({ onNavigate }: { onNavigate?: (view: any) => void }) => {
  return (
    <div className="pt-20 md:pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 md:mb-16 text-center"
        >
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-4 md:mb-6 leading-[0.9]">
            Archive
          </h1>
          <p className="text-muted text-base md:text-lg max-w-xl mx-auto px-4 md:px-0">
            Development history and past updates from the early testing phase of OMNI.
          </p>
        </motion.div>

        <div className="space-y-12">
          {changes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 border border-dashed border-border rounded-3xl"
            >
              <p className="text-muted text-sm uppercase tracking-widest font-bold">No archived versions available yet.</p>
            </motion.div>
          ) : changes.map((change, idx) => (
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
          className="mt-16 md:mt-20 flex justify-center w-full"
        >
          <button 
            onClick={() => onNavigate?.('changelog')}
            className="w-full md:w-auto px-8 py-4 rounded-xl md:rounded-2xl bg-surface-hover border border-border text-fg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-border transition-all text-center cursor-pointer"
          >
            Back to Latest Updates
          </button>
        </motion.div>
      </div>
    </div>
  );
};
