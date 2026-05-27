import { useState, useEffect, useRef } from "react";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { Hero } from "./components/home/Hero";
import { Features } from "./components/home/Features";
import { EditorWorkspace } from "./components/editor/EditorWorkspace";
import { Terms } from "./components/legal/Terms";
import { Privacy } from "./components/legal/Privacy";
import { SplashScreen } from "./components/layout/SplashScreen";
import { CookieToast } from "./components/layout/CookieToast";
import { Changelog } from "./components/legal/Changelog";
import { Archive } from "./components/legal/Archive";
import { FAQ } from "./components/legal/FAQ";

import { WorkspaceFile, defaultEdits } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { convertPdfToImages } from "./lib/pdfUtils";

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function App() {
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [activeView, setActiveView] = useState<'home' | 'editor' | 'terms' | 'privacy' | 'changelog' | 'archive' | 'faq'>('home');
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      return (localStorage.getItem('omni-theme') as 'light' | 'dark' | 'system') || 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    root.classList.add(effectiveTheme);
    try { localStorage.setItem('omni-theme', theme); } catch {}
  }, [theme]);

  const handleFilesAccepted = async (files: File[], append: boolean = false) => {
    const processedFiles: File[] = [];
    for (const file of files) {
      if (file.type === "application/pdf") {
        try {
          const pdfImages = await convertPdfToImages(file);
          processedFiles.push(...pdfImages);
        } catch (e) {
          console.error("Failed to convert PDF to images:", e);
        }
      } else {
        processedFiles.push(file);
      }
    }

    const results = await Promise.allSettled(
      processedFiles.map(async (file) => {
        const url = URL.createObjectURL(file);
        
        const dimensions = await new Promise<{width: number, height: number}>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
          img.src = url;
        });

        return {
          id: generateId(),
          file,
          originalUrl: url,
          previewUrl: url,
          originalWidth: dimensions.width,
          originalHeight: dimensions.height,
          edits: { ...defaultEdits },
          history: [{ ...defaultEdits }],
          historyIndex: 0,
          outputName: file.name.split('.')[0]
        };
      })
    );

    const newFiles: WorkspaceFile[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        newFiles.push(r.value);
      }
    }

    setWorkspaceFiles(prev => append ? [...prev, ...newFiles] : newFiles);
    if (newFiles.length > 0) {
      setActiveView('editor');
    }
  };

  // Revoke blob URLs when files are removed OR when their URLs change in-place
  // (e.g. after AI background removal replaces originalUrl on the same file ID).
  const prevFilesRef = useRef<WorkspaceFile[]>([]);
  useEffect(() => {
    const prev = prevFilesRef.current;
    if (prev.length > 0) {
      const currentMap = new Map(workspaceFiles.map(f => [f.id, f]));
      for (const pf of prev) {
        const cf = currentMap.get(pf.id);
        if (!cf) {
          // File was deleted — revoke both URLs
          URL.revokeObjectURL(pf.originalUrl);
          if (pf.previewUrl && pf.previewUrl !== pf.originalUrl) {
            URL.revokeObjectURL(pf.previewUrl);
          }
        } else {
          // File still exists — revoke only if URLs changed (e.g. background removal)
          if (pf.originalUrl !== cf.originalUrl) {
            URL.revokeObjectURL(pf.originalUrl);
          }
          if (
            pf.previewUrl &&
            pf.previewUrl !== pf.originalUrl &&
            pf.previewUrl !== cf.previewUrl &&
            pf.previewUrl !== cf.originalUrl
          ) {
            URL.revokeObjectURL(pf.previewUrl);
          }
        }
      }
    }
    prevFilesRef.current = workspaceFiles;
  }, [workspaceFiles]);


  return (
    <div className={`min-h-screen w-full bg-bg text-fg flex flex-col ${showSplash ? 'h-screen overflow-hidden' : ''}`}>
      <AnimatePresence>
        {showSplash ? (
          <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
        ) : (
          <motion.div 
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            <Header 
              onNavigate={(view) => setActiveView(view)} 
              theme={theme}
              onThemeChange={setTheme}
            />
            
            <main className="flex-1 flex flex-col">
              <AnimatePresence 
                 mode="wait" 
                 onExitComplete={() => window.scrollTo({ top: 0, behavior: 'instant' })}
              >
                {activeView === 'home' && (
                  <motion.div 
                     key="home"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Hero onFilesAccepted={(files) => handleFilesAccepted(files, false)} />
                    <Features />
                    <Footer onNavigate={(view) => setActiveView(view)} />
                  </motion.div>
                )}

                {activeView === 'privacy' && (
                  <motion.div 
                     key="privacy"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                     className="flex flex-col flex-1"
                  >
                    <Privacy />
                    <Footer onNavigate={(view) => setActiveView(view)} />
                  </motion.div>
                )}

                {activeView === 'terms' && (
                  <motion.div 
                     key="terms"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                     className="flex flex-col flex-1"
                  >
                    <Terms />
                    <Footer onNavigate={(view) => setActiveView(view)} />
                  </motion.div>
                )}

                {activeView === 'changelog' && (
                  <motion.div 
                     key="changelog"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                     className="flex flex-col flex-1"
                  >
                    <Changelog onNavigate={(view) => setActiveView(view)} />
                    <Footer onNavigate={(view) => setActiveView(view)} />
                  </motion.div>
                )}

                {activeView === 'archive' && (
                  <motion.div 
                     key="archive"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                     className="flex flex-col flex-1"
                  >
                    <Archive onNavigate={(view) => setActiveView(view)} />
                    <Footer onNavigate={(view) => setActiveView(view)} />
                  </motion.div>
                )}

                {activeView === 'faq' && (
                  <motion.div 
                     key="faq"
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                     className="flex flex-col flex-1"
                  >
                    <FAQ />
                    <Footer onNavigate={(view) => setActiveView(view)} />
                  </motion.div>
                )}

                {activeView === 'editor' && (
                  <motion.div 
                     key="editor"
                     initial={{ opacity: 0, scale: 0.98 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 0.3 }}
                     className="fixed inset-0 z-[100] bg-bg flex flex-col overflow-hidden"
                  >
                     <EditorWorkspace 
                        files={workspaceFiles} 
                        setFiles={setWorkspaceFiles} 
                        onClose={() => setActiveView('home')}
                        onAddFiles={(files) => handleFilesAccepted(files, true)}
                     />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
            <CookieToast />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
