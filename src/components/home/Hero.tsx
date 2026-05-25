import { motion } from "motion/react";
import { Upload, FileImage, Files } from "lucide-react";
import { UploadDropzone } from "../editor/UploadDropzone";

export function Hero({ onFilesAccepted }: { onFilesAccepted: (files: File[]) => void }) {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="container mx-auto flex max-w-[1400px] flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center w-full max-w-xl"
        >
          <motion.h1 
            layoutId="brand-label"
            className="font-brand text-6xl font-black tracking-tighter sm:text-8xl uppercase mb-6"
          >
            OMNI
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mx-auto mt-2 max-w-xl text-[10px] sm:text-sm font-bold uppercase tracking-[0.3em] text-muted leading-relaxed"
          >
            Professional document & image tools. Batch edit, convert, and organize student files and photos in one private workspace on your device.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-10 w-full max-w-2xl"
          >
            <UploadDropzone onFilesAccepted={onFilesAccepted} className="bg-surface/50 backdrop-blur shadow-2xl" />
            
            <div className="mt-12 flex flex-col items-center">
              <motion.a
                href="#features"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="group flex flex-col items-center gap-3 no-underline"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted transition-colors group-hover:text-fg">
                  Explore Features
                </span>
                <div className="relative flex h-10 w-6 items-start justify-center rounded-full border-2 border-border/50 p-1 transition-colors group-hover:border-fg">
                   <motion.div 
                     animate={{ 
                       y: [0, 16, 0],
                       opacity: [1, 0.2, 1]
                     }}
                     transition={{ 
                       repeat: Infinity, 
                       duration: 2, 
                       ease: "easeInOut" 
                     }}
                     className="h-2 w-1 rounded-full bg-accent"
                   />
                </div>
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-16 w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-surface shadow-2xl"
        >
          <div className="flex flex-col md:flex-row border-b border-border bg-surface divide-y md:divide-y-0 md:divide-x divide-border">
             <div className="flex flex-1 flex-col items-center gap-4 p-8">
                <div className="flex h-12 w-12 items-center justify-center bg-surface-hover/50 text-fg ring-1 ring-border rounded-lg group-hover:bg-accent group-hover:text-accent-fg group-hover:ring-accent transition-all duration-300">
                   <FileImage className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-black uppercase tracking-[0.2em]">Single Image</span>
                  <span className="mt-1 block text-[10px] text-muted">Edit and convert</span>
                </div>
             </div>
             <div className="flex flex-1 flex-col items-center gap-4 p-8">
                <div className="flex h-12 w-12 items-center justify-center bg-surface-hover/50 text-fg ring-1 ring-border rounded-lg group-hover:bg-accent group-hover:text-accent-fg group-hover:ring-accent transition-all duration-300">
                   <Files className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-black uppercase tracking-[0.2em]">Batch Process</span>
                  <span className="mt-1 block text-[10px] text-muted">Edit multiple files</span>
                </div>
             </div>
             <div className="flex flex-1 flex-col items-center gap-4 p-8">
                <div className="flex h-12 w-12 items-center justify-center bg-surface-hover/50 text-fg ring-1 ring-border rounded-lg group-hover:bg-accent group-hover:text-accent-fg group-hover:ring-accent transition-all duration-300">
                   <Upload className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-black uppercase tracking-[0.2em]">PDF Export</span>
                  <span className="mt-1 block text-[10px] text-muted">Combine images</span>
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
