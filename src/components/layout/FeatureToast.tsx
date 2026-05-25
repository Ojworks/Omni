import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wand2, X } from "lucide-react";

export const FeatureToast = ({ onNavigate }: { onNavigate: (view: any) => void }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("feature-bg-remover-seen");
    if (!seen) {
      const showTimer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);

      // Auto dismiss after 8 seconds of visibility
      const dismissTimer = setTimeout(() => {
        setIsVisible(false);
        localStorage.setItem("feature-bg-remover-seen", "true");
      }, 9500);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(dismissTimer);
      };
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("feature-bg-remover-seen", "true");
    setIsVisible(false);
  };

  const handleTryIt = () => {
    handleDismiss();
    onNavigate('editor');
  };

  const handleChangelog = () => {
    handleDismiss();
    onNavigate('changelog');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-24 right-6 left-6 md:left-auto md:right-8 md:w-[320px] z-[90]"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/90 p-5 backdrop-blur-xl shadow-2xl studio-texture">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
            
            <div className="relative flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/20 text-accent">
                    <Wand2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-[11px] font-black text-fg uppercase tracking-[0.2em]">New Feature</h3>
                </div>
                <button
                  onClick={handleDismiss}
                  className="rounded-lg p-1 text-muted hover:bg-surface-hover hover:text-fg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-[13px] leading-relaxed text-muted font-medium">
                Magic Background Remover is now live! Instantly remove backgrounds using smart AI right on your device.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleTryIt}
                  className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-accent-fg hover:opacity-90 transition-all active:scale-95 text-center"
                >
                  Try in Studio
                </button>
                <button
                  onClick={handleChangelog}
                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-fg hover:bg-surface-hover transition-all active:scale-95 text-center"
                >
                  Changelog
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
