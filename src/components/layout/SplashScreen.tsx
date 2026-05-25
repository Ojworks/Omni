import { motion } from "motion/react";
import { useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
  key?: string;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    // Show splash screen for 2 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center justify-center w-full max-w-md px-10 antialiased"
      >
        <motion.h1 
          layoutId="brand-label"
          className="font-brand text-6xl font-black tracking-tighter sm:text-8xl text-fg uppercase will-change-transform"
        >
          OMNI
        </motion.h1>
        
        <div className="w-full h-px bg-border my-4 relative overflow-hidden">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 bg-fg origin-left"
          />
        </div>

        <motion.p 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted text-center will-change-transform"
        >
          LOCAL DOCUMENT STUDIO
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
