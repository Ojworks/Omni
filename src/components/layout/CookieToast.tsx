import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cookie, X } from "lucide-react";

export const CookieToast = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const showTimer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      // Auto dismiss after 8 seconds of visibility
      const dismissTimer = setTimeout(() => {
        setIsVisible(false);
        localStorage.setItem("cookie-consent", "dismissed");
      }, 10000);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(dismissTimer);
      };
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("cookie-consent", "dismissed");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[350px] z-50"
        >
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/85 p-5 backdrop-blur-xl shadow-2xl studio-texture">
            {/* Background Glow */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/5 blur-3xl" />
            
            <div className="relative flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Cookie className="h-5 w-5" />
                </div>
                <button
                  onClick={handleDismiss}
                  className="rounded-lg p-1 text-muted hover:bg-surface-hover hover:text-fg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="text-[15px] font-black text-fg uppercase tracking-wider">Storage Preferences</h3>
                <p className="text-[13px] leading-relaxed text-muted font-medium">
                  OMNI doesn't track you or use cookies. We only save settings (like your choice of light or dark mode) directly on your own device.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleAccept}
                  className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-xs font-black uppercase tracking-widest text-accent-fg hover:opacity-90 transition-all active:scale-95 text-center"
                >
                  Got It
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-black uppercase tracking-widest text-fg hover:bg-surface-hover transition-all active:scale-95 text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

