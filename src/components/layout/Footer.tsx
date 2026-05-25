interface FooterProps {
  onNavigate?: (view: 'home' | 'editor' | 'terms' | 'privacy' | 'changelog' | 'faq') => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="py-6 md:py-8 border-t border-border bg-bg text-fg">
      <div className="container mx-auto flex w-full max-w-[1400px] flex-col md:flex-row items-center justify-between gap-6 px-6">
        <div className="flex flex-col items-center md:items-start gap-1 cursor-pointer" onClick={() => onNavigate?.('home')}>
          <span className="font-brand text-lg font-black tracking-tighter">OMNI</span>
          <span className="font-brand text-[10px] font-black tracking-[0.2em] uppercase text-fg">Professional Document & Image Tools</span>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-muted">
          <button 
            onClick={() => onNavigate?.('changelog')} 
            className="hover:text-fg transition-colors uppercase tracking-widest cursor-pointer py-2 px-2 active:scale-95"
          >
            Changelog
          </button>
          <button 
            onClick={() => onNavigate?.('terms')} 
            className="hover:text-fg transition-colors uppercase tracking-widest cursor-pointer py-2 px-2 active:scale-95"
          >
            Terms
          </button>
          <button 
            onClick={() => onNavigate?.('privacy')} 
            className="hover:text-fg transition-colors uppercase tracking-widest cursor-pointer py-2 px-2 active:scale-95"
          >
            Privacy
          </button>
          <button 
            onClick={() => onNavigate?.('faq')} 
            className="hover:text-fg transition-colors uppercase tracking-widest cursor-pointer py-2 px-2 active:scale-95"
          >
            FAQ
          </button>
        </div>
      </div>
    </footer>
  );
}
