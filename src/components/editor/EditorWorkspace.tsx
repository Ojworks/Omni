import { useState, useRef, Dispatch, SetStateAction, useEffect } from 'react';
import { WorkspaceFile, ImageEdits, FileFormat, defaultEdits } from '@/src/types';
import { EditorToolbar } from './EditorToolbar';
import { StudioCanvas } from './StudioCanvas';
import { BatchSidebar } from './BatchSidebar';
import { MobileToolSelector, ToolCategory } from './MobileToolSelector';
import { UploadDropzone } from './UploadDropzone';
import { ConfirmationModal } from './ConfirmationModal';
import { Crop } from 'react-image-crop';
import { ArrowLeft, Undo, Redo, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMobile } from '@/src/lib/hooks';
import { removeBackground } from '@imgly/background-removal';

interface EditorWorkspaceProps {
  files: WorkspaceFile[];
  setFiles: Dispatch<SetStateAction<WorkspaceFile[]>>;
  onClose: () => void;
  onAddFiles: (files: File[]) => void;
}

export function EditorWorkspace({ files, setFiles, onClose, onAddFiles }: EditorWorkspaceProps) {
  const [activeFileId, setActiveFileId] = useState<string>(files[0]?.id || '');
  const filesRef = useRef(files);

  // Keep ref in sync with latest files to avoid stale closures in effects without triggering re-runs
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const [isCropActive, setIsCropActive] = useState(false);
  const [cropAspect, setCropAspect] = useState<number | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>('image/jpeg');
  const [exportQuality, setExportQuality] = useState(90);
  const [initialEdits, setInitialEdits] = useState<ImageEdits | undefined>(undefined);
  // Stores the crop value (or undefined) that was active BEFORE entering crop mode.
  // Used by Cancel to restore cleanly without touching history.
  const [initialCrop, setInitialCrop] = useState<Crop | undefined>(undefined);
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('none');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [fileToDeleteId, setFileToDeleteId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [isProcessingMagic, setIsProcessingMagic] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const file = filesRef.current.find(f => f.id === activeFileId);
    if (activeCategory !== 'none' && file) {
      setInitialEdits(file.edits);
    }
    if (activeCategory === 'none') {
      setInitialEdits(undefined);
    }
  }, [activeCategory, activeFileId]);

  useEffect(() => {
    const file = filesRef.current.find(f => f.id === activeFileId);
    if (isCropActive && file) {
      // Snapshot the crop BEFORE entering crop mode (may be undefined).
      // This is used by Cancel to restore the exact pre-crop state.
      setInitialCrop(file.edits.crop);

      // If no crop exists yet, initialize a full-frame default live (no history touch).
      if (!file.edits.crop) {
        setFiles(prev => prev.map(f => {
          if (f.id === activeFileId && !f.edits.crop) {
            // Only update edits — history and historyIndex are left completely untouched.
            return { ...f, edits: { ...f.edits, crop: { unit: '%', x: 0, y: 0, width: 100, height: 100 } as Crop } };
          }
          return f;
        }));
      }
    }
  }, [isCropActive, activeFileId, setFiles]);

  // Sync crop mode between desktop and mobile when viewport changes
  useEffect(() => {
    if (isMobile) {
      // Switched to mobile: if crop was active on desktop, open the mobile transform overlay
      setActiveCategory(prev => {
        if (prev === 'none' && isCropActive) return 'transform';
        return prev;
      });
    } else {
      // Switched to desktop: cancel any open mobile tool to rollback unsaved edits
      setActiveCategory(prev => {
        if (prev !== 'none') {
          // Rollback edits that were in-progress on mobile
          setInitialEdits(undefined);
          setIsCropActive(false);
          return 'none';
        }
        return prev;
      });
    }
  }, [isMobile, isCropActive]);

  const handleExitClick = () => {
    if (files.length > 0) {
      setShowExitModal(true);
    } else {
      onClose();
    }
  };

  const handleCancelTool = () => {
    if (initialEdits) {
      handleEditChange(initialEdits, false);
    }
    setActiveCategory('none');
    setIsCropActive(false);
  };

  const handleApplyTool = () => {
    // Mobile "Done": if crop is active, commit it as one history step then close.
    if (isCropActive) {
      handleConfirmCrop();
      setActiveCategory('none');
      return;
    }
    setActiveCategory('none');
    setIsCropActive(false);
  };

  const handleCancelCrop = () => {
    // Restore the exact pre-crop state (crop: undefined if there was none) without touching history.
    updateCropLive(initialCrop);
    setIsCropActive(false);
  };

  // The ONE place a confirmed crop is committed to undo history.
  const handleConfirmCrop = () => {
    if (!activeFile) return;
    // Push the final crop as a brand-new history entry on top of the pre-crop state.
    handleEditChange({ crop: activeFile.edits.crop }, true);
    setIsCropActive(false);
  };

  useEffect(() => {
    if (!activeFileId && files.length > 0) {
      setActiveFileId(files[0].id);
    }
  }, [files, activeFileId]);

  const activeFile = files.find(f => f.id === activeFileId);

  const handleEditChange = (newEdits: Partial<ImageEdits>, pushHistory = true) => {
    if (!activeFile) return;

    setFiles(prev => prev.map(f => {
      if (f.id === activeFile.id) {
        const edits = { ...f.edits, ...newEdits };
        if (!pushHistory) {
          // Only update the active edits, do NOT mutate the current history slot.
          // This preserves the original state so that Undo can correctly revert uncommitted changes.
          return { ...f, edits };
        }
        const history = f.history.slice(0, f.historyIndex + 1);
        history.push(edits);
        return { ...f, edits, history, historyIndex: history.length - 1 };
      }
      return f;
    }));
  };

  // Updates edits.crop live during a drag — history is never touched.
  // This is the correct way to reflect intermediate crop positions without
  // polluting the undo stack.
  const updateCropLive = (crop: Crop | undefined) => {
    if (!activeFile) return;
    setFiles(prev => prev.map(f =>
      f.id === activeFile.id
        ? { ...f, edits: { ...f.edits, crop } }
        : f
    ));
  };

  const handleUndo = () => {
    if (!activeFile || activeFile.historyIndex <= 0) return;
    setFiles(prev => prev.map(f => {
      if (f.id === activeFile.id) {
        const newIndex = f.historyIndex - 1;
        return { ...f, edits: f.history[newIndex], historyIndex: newIndex };
      }
      return f;
    }));
  };

  const handleRedo = () => {
    if (!activeFile || activeFile.historyIndex >= activeFile.history.length - 1) return;
    setFiles(prev => prev.map(f => {
      if (f.id === activeFile.id) {
        const newIndex = f.historyIndex + 1;
        return { ...f, edits: f.history[newIndex], historyIndex: newIndex };
      }
      return f;
    }));
  };

  const removeFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (!fileToRemove) return;

    const fileHasEdits = fileToRemove.edits.rotate !== 0 ||
                         fileToRemove.edits.flipX ||
                         fileToRemove.edits.flipY ||
                         fileToRemove.edits.filter !== 'none' ||
                         fileToRemove.edits.crop !== undefined ||
                         fileToRemove.edits.resize !== undefined;

    const isLastFile = files.length === 1;

    if (fileHasEdits || isLastFile) {
      setFileToDeleteId(id);
    } else {
      executeRemoveFile(id);
    }
  };

  const executeRemoveFile = (id: string) => {
    const isRemovingActive = id === activeFileId;
    const remainingFiles = files.filter(f => f.id !== id);
    
    if (remainingFiles.length === 0) {
      onClose();
      setFiles([]);
    } else {
      if (isRemovingActive) {
        setActiveFileId(remainingFiles[0].id);
      }
      setFiles(remainingFiles);
    }
  };

  const updateOutputName = (id: string, name: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, outputName: name } : f));
  };

  const processImage = async (file: WorkspaceFile, format: FileFormat, quality: number = 0.9): Promise<{ blob: Blob, dataUrl: string, width: number, height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const { rotate, flipX, flipY, crop, resize } = file.edits;
        const rad = (rotate * Math.PI) / 180;

        // ── Step 1: Bake rotation + flip into an intermediate canvas ──
        // When rotated 90 or 270° the output dimensions swap.
        const isSwapped = rotate % 180 !== 0;
        const rotW = isSwapped ? img.height : img.width;
        const rotH = isSwapped ? img.width  : img.height;

        const rotCanvas = document.createElement('canvas');
        rotCanvas.width  = rotW;
        rotCanvas.height = rotH;
        const rotCtx = rotCanvas.getContext('2d')!;

        rotCtx.save();
        rotCtx.translate(rotW / 2, rotH / 2);
        rotCtx.rotate(rad);
        rotCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        rotCtx.drawImage(img, -img.width / 2, -img.height / 2);
        rotCtx.restore();

        // ── Step 2: Determine crop region (relative to rotated canvas) ──
        let sourceX = 0, sourceY = 0;
        let sourceWidth  = rotW;
        let sourceHeight = rotH;

        if (crop && crop.width && crop.height) {
          sourceX      = (crop.x      / 100) * rotW;
          sourceY      = (crop.y      / 100) * rotH;
          sourceWidth  = (crop.width  / 100) * rotW;
          sourceHeight = (crop.height / 100) * rotH;
        }

        // ── Step 3: Determine final output size (respects manual resize) ──
        const targetWidth  = resize?.width  ?? Math.round(sourceWidth);
        const targetHeight = resize?.height ?? Math.round(sourceHeight);

        // ── Step 4: Draw cropped + resized image with pixel filters ──
        const outCanvas = document.createElement('canvas');
        outCanvas.width  = targetWidth;
        outCanvas.height = targetHeight;
        const outCtx = outCanvas.getContext('2d')!;

        let filterStr = '';
        if (file.edits.filter !== 'none') filterStr += file.edits.filter;
        outCtx.filter = filterStr.trim();

        outCtx.drawImage(
          rotCanvas,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, targetWidth, targetHeight
        );

        const outFormat = format === 'original' ? file.file.type : format;
        const dataUrl = outCanvas.toDataURL(outFormat, quality);

        outCanvas.toBlob((blob) => {
          if (blob) {
            resolve({ blob, dataUrl, width: outCanvas.width, height: outCanvas.height });
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        }, outFormat, quality);
      };
      img.onerror = reject;
      img.src = file.originalUrl;
    });
  };

  const handleExport = async (format: FileFormat, batch: boolean, quality: number = 0.9) => {
    setIsExporting(true);
    try {
      const filesToProcess = batch ? files : [activeFile!];

      if (format === 'application/pdf') {
        let defaultPdfName = filesToProcess.length > 1 ? 'Omni_Collection' : filesToProcess[0].outputName;
        let pdfName = defaultPdfName;
        if (!pdfName.toLowerCase().endsWith('.pdf')) {
          pdfName += '.pdf';
        }

        let pdf: jsPDF | null = null;
        
        for (let i = 0; i < filesToProcess.length; i++) {
          // Using JPEG for PDF generation with quality compression
          const processed = await processImage(filesToProcess[i], 'image/jpeg', quality);
          
          if (!pdf) {
            pdf = new jsPDF({ 
              orientation: processed.width > processed.height ? 'l' : 'p', 
              unit: 'px', 
              format: [processed.width, processed.height] 
            });
          } else {
            pdf.addPage([processed.width, processed.height], processed.width > processed.height ? 'l' : 'p');
          }
          
          pdf.addImage(processed.dataUrl, 'JPEG', 0, 0, processed.width, processed.height, '', 'FAST');
        }
        
        if (pdf) {
          pdf.save(pdfName);
        }

      } else {
        for (const f of filesToProcess) {
          const processed = await processImage(f, format, quality);
          const ext = format === 'original' ? f.file.name.split('.').pop() : format.split('/')[1];
          
          const a = document.createElement('a');
          a.href = processed.dataUrl;
          a.download = `${f.outputName}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleApplyEditsToAll = (editsToApply: Partial<ImageEdits>) => {
    setFiles(prev => prev.map(f => {
      const edits = { ...f.edits, ...editsToApply };
      // Preserve crop as it is usually image-specific
      edits.crop = f.edits.crop;
      const history = f.history.slice(0, f.historyIndex + 1);
      history.push(edits);
      return { ...f, edits, history, historyIndex: history.length - 1 };
    }));
  };

  const handleRemoveBackground = async () => {
    if (!activeFile || isProcessingRef.current || activeFile.hasBackgroundRemoved) return;
    isProcessingRef.current = true;
    setIsProcessingMagic(true);
    setMagicError(null);
    try {
      // Process the image first to bake in any rotation/crop
      const processed = await processImage(activeFile, 'image/png');

      // Call removeBackground directly — running it in a Worker was blocked by
      // Cross-Origin-Embedder-Policy: require-corp, which prevents the worker
      // from fetching the ONNX/WASM models from the img.ly CDN.
      const blob = await removeBackground(processed.blob);

      const url = URL.createObjectURL(blob);
      const newFile = new File([blob], `${activeFile.outputName}-nobg.png`, { type: 'image/png' });
      
      setFiles(prev => prev.map(f => {
        if (f.id === activeFile.id) {
          return {
            ...f,
            file: newFile,
            originalUrl: url,
            previewUrl: url,
            outputName: `${f.outputName}-nobg`,
            edits: { ...defaultEdits },
            history: [{ ...defaultEdits }],
            historyIndex: 0,
            hasBackgroundRemoved: true
          };
        }
        return f;
      }));
      
    } catch (err: any) {
      setMagicError(err?.message || 'Background removal failed. Please try again.');
    } finally {
      isProcessingRef.current = false;
      setIsProcessingMagic(false);
    }
  };

  const isUnexpectedlyMissing = files.length > 0 && activeFileId !== '' && !activeFile;

  return (
    <>
      <AnimatePresence mode="wait">
        {!activeFile ? (
          files.length > 0 ? (
            <div className="flex h-screen w-full items-center justify-center bg-bg">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center bg-bg relative p-8 md:p-12 lg:p-16"
            >
              <button 
                onClick={onClose}
                className="absolute top-6 left-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-fg hover:text-muted transition-colors rounded border border-border bg-surface px-4 py-2 z-20"
              >
                <ArrowLeft className="h-4 w-4" /> Exit Editor
              </button>
              <div className="w-full max-w-md p-6 relative z-10 flex flex-col items-center justify-center">
                <div className="text-center mb-8">
                  <h2 className="font-brand text-4xl font-black tracking-tighter uppercase mb-2">
                      {isUnexpectedlyMissing ? 'File Missing' : 'OMNI Empty'}
                  </h2>
                  <p className="text-muted text-sm mb-8 max-w-xs mx-auto">Upload some documents to start editing in OMNI.</p>
                  <UploadDropzone onFilesAccepted={onAddFiles} />
                </div>
              </div>
            </motion.div>
          )
        ) : (
          <motion.div 
            key="workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-screen w-full overflow-hidden bg-bg"
          >
            <EditorToolbar 
               file={activeFile}
               onEditChange={handleEditChange}
               isCropActive={isCropActive}
               setIsCropActive={setIsCropActive}
               onUndo={handleUndo}
               onRedo={handleRedo}
               hasUndo={activeFile.historyIndex > 0}
               hasRedo={activeFile.historyIndex < activeFile.history.length - 1}
               onApplyEditsToAll={handleApplyEditsToAll}
               cropAspect={cropAspect}
               setCropAspect={setCropAspect}
               onCancelCrop={handleCancelCrop}
               onConfirmCrop={handleConfirmCrop}
               onRemoveBackground={handleRemoveBackground}
               isProcessingMagic={isProcessingMagic}
               magicError={magicError}
               onDismissMagicError={() => setMagicError(null)}
               className="hidden lg:flex"
               mode="desktop"
            />
            
            <div className="flex-1 flex flex-col min-w-0 bg-surface h-full relative overflow-hidden">
              <div className="hidden lg:flex h-16 items-center px-6 border-b border-border bg-surface shrink-0 gap-4 z-20">
                <button 
                  onClick={handleExitClick}
                  disabled={isCropActive}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest p-0 rounded transition-all duration-300 ${isCropActive ? 'opacity-50 pointer-events-none text-muted' : 'text-fg hover:text-muted'}`}
                >
                  <ArrowLeft className="h-4 w-4" /> <span>Exit Editor</span>
                </button>
                <div className="w-px h-4 bg-border"></div>
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-muted truncate flex-1">{activeFile.file.name}</span>
              </div>
              
              <div className="flex-1 relative min-h-0 flex flex-col">
                {/* Mobile floating control bar — back, undo, redo, reset */}
                <div className="lg:hidden absolute top-0 left-0 right-0 flex items-center justify-between px-3 pt-3 z-30 pointer-events-none">
                  {/* Back / Exit */}
                  <button
                    onClick={handleExitClick}
                    disabled={isCropActive}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface/90 backdrop-blur-2xl border border-border shadow-lg pointer-events-auto active:scale-95 transition-all duration-200 ${isCropActive ? 'opacity-30 pointer-events-none' : 'text-fg'}`}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Back</span>
                  </button>

                  {/* Undo / Redo / Reset group */}
                  <div className={`flex items-center gap-1 bg-surface/90 backdrop-blur-2xl border border-border rounded-xl shadow-lg pointer-events-auto overflow-hidden transition-all duration-300 ${isCropActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <button
                      onClick={handleUndo}
                      disabled={activeFile.historyIndex === 0}
                      className="px-3 py-2 text-fg disabled:opacity-25 transition-colors active:scale-95 hover:bg-surface-hover"
                      title="Undo"
                    >
                      <Undo className="h-4 w-4" />
                    </button>
                    <div className="w-px h-5 bg-border" />
                    <button
                      onClick={handleRedo}
                      disabled={activeFile.historyIndex === activeFile.history.length - 1}
                      className="px-3 py-2 text-fg disabled:opacity-25 transition-colors active:scale-95 hover:bg-surface-hover"
                      title="Redo"
                    >
                      <Redo className="h-4 w-4" />
                    </button>
                    {(activeFile.edits.rotate !== 0 ||
                      activeFile.edits.filter !== 'none' ||
                      activeFile.edits.flipX ||
                      activeFile.edits.flipY) && (
                      <>
                        <div className="w-px h-5 bg-border" />
                        <button
                          onClick={() => setShowResetModal(true)}
                          className="px-3 py-2 text-red-500 transition-colors active:scale-95 hover:bg-red-500/10"
                          title="Reset All"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Canvas fills remaining space; pt-14 reserves space for the floating top bar */}
                <StudioCanvas 
                   file={activeFile} 
                   isCropActive={isCropActive}
                   cropAspect={cropAspect}
                   onCropChange={(c) => updateCropLive(c)}
                   onCropComplete={(c) => updateCropLive(c)}
                   className="lg:hidden pt-14"
                   isProcessingMagic={isProcessingMagic}
                />
                {/* Desktop canvas — no floating bar, no top padding needed */}
                <StudioCanvas 
                   file={activeFile} 
                   isCropActive={isCropActive}
                   cropAspect={cropAspect}
                   onCropChange={(c) => updateCropLive(c)}
                   onCropComplete={(c) => updateCropLive(c)}
                   className="hidden lg:flex"
                   isProcessingMagic={isProcessingMagic}
                />
              </div>

              {/* Mobile bottom sheet tool panel — always sits on top of the canvas, never replaces it */}
              <div className="lg:hidden flex flex-col w-full relative">
                <AnimatePresence initial={false}>
                  {activeCategory !== 'none' && (
                    <motion.div
                      key="mobile-tool-sheet"
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                      className="absolute bottom-0 left-0 right-0 z-40 bg-surface border-t border-border rounded-t-2xl shadow-[0_-12px_40px_rgba(0,0,0,0.2)] overflow-visible will-change-transform"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      {/* Sheet header: Cancel / Title / Done */}
                      <div className="relative flex items-center justify-between border-b border-border bg-surface/80 backdrop-blur-xl rounded-t-2xl h-14 shrink-0 w-full">
                        <button
                          onClick={handleCancelTool}
                          className="flex items-center gap-1.5 h-full px-4 text-[10px] font-brand font-black uppercase tracking-widest text-muted hover:text-fg transition-colors active:scale-95 cursor-pointer z-20"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Cancel
                        </button>
                        <h3 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-xs sm:text-sm font-black tracking-widest uppercase font-brand truncate max-w-[40%] select-none pointer-events-none z-10">
                          {activeCategory === 'transform' ? (isCropActive ? 'Crop' : 'Transform') :
                           activeCategory === 'adjust' ? 'Adjust' :
                           activeCategory === 'filters' ? 'Filters' :
                           activeCategory === 'resize' ? 'Resize' :
                           activeCategory === 'batch' ? 'Files' :
                           activeCategory === 'magic' ? 'Magic' :
                           activeCategory === 'export' ? 'Export' : 'OMNI'}
                        </h3>
                        {activeCategory !== 'export' ? (
                          <button
                            onClick={handleApplyTool}
                            className="h-full px-4 flex items-center justify-center text-[10px] font-brand font-black uppercase tracking-widest text-accent hover:opacity-70 transition-opacity active:scale-95 cursor-pointer z-20"
                          >
                            {activeCategory === 'batch' ? 'Select' : 'Done'}
                          </button>
                        ) : (
                          <button
                            disabled={isExporting}
                            onClick={async () => {
                              await handleExport(selectedFormat, false, exportQuality / 100);
                              setActiveCategory('none');
                            }}
                            className="h-full px-4 flex items-center justify-center text-[10px] font-brand font-black uppercase tracking-widest text-accent hover:opacity-70 transition-opacity active:scale-95 cursor-pointer z-20 disabled:opacity-50 disabled:pointer-events-none"
                          >
                            {isExporting ? 'Saving...' : 'Export'}
                          </button>
                        )}
                      </div>

                      {/* Tool panel content */}
                      <EditorToolbar 
                          file={activeFile}
                          files={files}
                          onEditChange={handleEditChange}
                          isCropActive={isCropActive}
                          setIsCropActive={setIsCropActive}
                          onUndo={handleUndo}
                          onRedo={handleRedo}
                          hasUndo={activeFile.historyIndex > 0}
                          hasRedo={activeFile.historyIndex < activeFile.history.length - 1}
                          onApplyEditsToAll={handleApplyEditsToAll}
                          cropAspect={cropAspect}
                          setCropAspect={setCropAspect}
                          onCancelCrop={handleCancelCrop}
                          onConfirmCrop={handleConfirmCrop}
                          mode="mobile"
                          activeCategory={activeCategory}
                          onCloseMobile={() => setActiveCategory('none')}
                          setActiveFileId={setActiveFileId}
                          removeFile={removeFile}
                          onAddFiles={onAddFiles}
                          onExport={handleExport}
                          isExporting={isExporting}
                          selectedFormat={selectedFormat}
                          onFormatChange={setSelectedFormat}
                          exportQuality={exportQuality}
                          setExportQuality={setExportQuality}
                          onRemoveBackground={handleRemoveBackground}
                          isProcessingMagic={isProcessingMagic}
                          magicError={magicError}
                          onDismissMagicError={() => setMagicError(null)}
                          className="!border-t-0 bg-transparent"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <MobileToolSelector 
                   activeCategory={activeCategory} 
                   setActiveCategory={setActiveCategory}
                   className="z-50 w-full"
                />
              </div>
            </div>

            <BatchSidebar 
               files={files}
               activeFileId={activeFileId}
               setActiveFileId={setActiveFileId}
               removeFile={removeFile}
               onAddFiles={onAddFiles}
               updateOutputName={updateOutputName}
               onExport={handleExport}
               isExporting={isExporting}
               activeCategory={activeCategory}
               onReorder={setFiles}
               exportQuality={exportQuality}
               setExportQuality={setExportQuality}
               className="hidden lg:flex transition-all duration-300"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal 
         isOpen={showResetModal}
         onClose={() => setShowResetModal(false)}
         onConfirm={() => handleEditChange({ ...defaultEdits, crop: undefined, resize: undefined })}
         title="Reset All Edits?"
         message="This will revert all transforms, adjustments, and filters for this image. This action cannot be undone."
         confirmText="Reset Image"
         cancelText="Keep Edits"
         type="danger"
      />

      <ConfirmationModal 
         isOpen={showExitModal}
         onClose={() => setShowExitModal(false)}
         onConfirm={() => {
           setShowExitModal(false);
           onClose();
         }}
         title="Exit OMNI Studio?"
         message="Are you sure you want to exit? All your uploaded files, edits, and unsaved changes will be permanently lost."
         confirmText="Exit Studio"
         cancelText="Keep Editing"
         type="danger"
      />

      <ConfirmationModal 
         isOpen={fileToDeleteId !== null}
         onClose={() => setFileToDeleteId(null)}
         onConfirm={() => {
           if (fileToDeleteId) {
             executeRemoveFile(fileToDeleteId);
             setFileToDeleteId(null);
           }
         }}
         title={files.length === 1 ? "Exit Studio?" : "Delete File?"}
         message={
           files.length === 1 
             ? "Deleting the last file will exit the studio and erase all your current progress. Do you want to continue?"
             : "Are you sure you want to delete this file? All edits made to this image will be permanently lost."
         }
         confirmText={files.length === 1 ? "Exit and Delete" : "Delete File"}
         cancelText="Cancel"
         type="danger"
      />
    </>
  );
}
