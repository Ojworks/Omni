import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2 } from 'lucide-react';

interface ProcessingOverlayProps {
  isVisible: boolean;
}

export const ProcessingOverlay = memo(function ProcessingOverlay({ isVisible }: ProcessingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-hidden rounded-lg">
          {/* Pure CSS keyframes for a super-smooth pulsing dots animation that survives Wasm CPU spikes */}
          <style>{`
            @keyframes cssDotPulse {
              0%, 100% {
                opacity: 0.2;
                transform: scale(0.8);
              }
              50% {
                opacity: 1;
                transform: scale(1.2);
              }
            }
            .css-pulsing-dot {
              animation: cssDotPulse 1.2s infinite ease-in-out;
            }
          `}</style>

          {/* Frosted Glass Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-bg/70 backdrop-blur-md"
          />

          {/* Minimalist Floating Content */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="relative flex flex-col items-center gap-3.5 z-10"
          >
            {/* Elegant, clean rounded icon badge */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent animate-pulse border border-accent/20">
              <Wand2 className="h-5 w-5" />
            </div>
            
            {/* Minimalist modern typography with sequential pulsing dots */}
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-muted flex items-center justify-center gap-1.5 ml-[0.25em]">
              <span>LOADING</span>
              <span className="flex items-center gap-1">
                <span className="css-pulsing-dot w-1 h-1 rounded-full bg-accent" style={{ animationDelay: '0ms' }} />
                <span className="css-pulsing-dot w-1 h-1 rounded-full bg-accent" style={{ animationDelay: '200ms' }} />
                <span className="css-pulsing-dot w-1 h-1 rounded-full bg-accent" style={{ animationDelay: '400ms' }} />
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});
