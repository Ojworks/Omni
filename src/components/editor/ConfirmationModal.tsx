import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = 'danger'
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4 md:p-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg/40 backdrop-blur-[2px] pointer-events-auto"
          />
          
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="relative w-full max-w-[340px] overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-surface/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-5 md:p-6 pointer-events-auto mb-safe"
          >
            <div className="flex flex-col gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-sm md:text-base font-black uppercase tracking-tighter text-fg flex items-center justify-center md:justify-start gap-2">
                  <AlertCircle className={`h-4 w-4 ${type === 'danger' ? 'text-red-500' : 'text-accent'}`} />
                  {title}
                </h3>
                <p className="text-[11px] md:text-xs text-muted leading-relaxed mt-1">
                  {message}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-border bg-surface text-[9px] font-black uppercase tracking-[0.2em] text-muted hover:text-fg hover:border-fg transition-all active:scale-95"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm ${
                    type === 'danger' 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-fg text-bg hover:opacity-90'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
