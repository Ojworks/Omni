import { useState, useRef, useCallback, useMemo, Dispatch, SetStateAction, useEffect } from 'react';
import { WorkspaceFile, ImageEdits, FileFormat, defaultEdits, FILTERS } from '@/src/types';
import { EditorToolbar } from './EditorToolbar';
import { StudioCanvas } from './StudioCanvas';
import { BatchSidebar } from './BatchSidebar';
import { MobileToolSelector, ToolCategory } from './MobileToolSelector';
import { MobileToolScreen } from './MobileToolScreen';
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
  const activeFileIdRef = useRef(activeFileId);

  // Keep ref in sync with latest files to avoid stale closures in effects without triggering re-runs
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

  const [isCropActive, setIsCropActive] = useState(false);
  const [cropAspect, setCropAspect] = useState<number | undefined>(undefined);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>('image/jpeg');
  const [exportQuality, setExportQuality] = useState(90);
  const [initialEdits, setInitialEdits] = useState<ImageEdits | undefined>(undefined);
  // Stores the historyIndex BEFORE the tool was opened, so Cancel can restore
  // both edits AND history position, preventing undo from stepping into canceled edits.
  const [initialHistoryIndex, setInitialHistoryIndex] = useState<number>(0);
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
  const isExportingRef = useRef(false);

  useEffect(() => {
    // Read files via ref — NOT in deps — so this only re-runs when the tool
    // category or active file changes, not on every edit within the session.
    // This ensures initialEdits captures the state BEFORE the tool was opened.
    const file = filesRef.current.find(f => f.id === activeFileId);
    if (activeCategory !== 'none' && file) {
      setInitialEdits(file.edits);
      setInitialHistoryIndex(file.historyIndex);
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
          setIsCropActive(false);
          return 'none';
        }
        return prev;
      });
      // Actually restore edits outside the updater (React anti-pattern to call setters inside)
      if (initialEdits) {
        const id = activeFileIdRef.current;
        setFiles(prev => prev.map(f => {
          if (f.id === id) {
            // Truncate history so Redo can't step back into discarded mobile edits
            const history = f.history.slice(0, initialHistoryIndex + 1);
            return { ...f, edits: { ...initialEdits }, history, historyIndex: initialHistoryIndex };
          }
          return f;
        }));
      }
      setInitialEdits(undefined);
    }
  }, [isMobile, isCropActive]);

  // ── Core edit functions (defined first — no dependencies on other handlers) ──

  const handleEditChange = useCallback((newEdits: Partial<ImageEdits>, pushHistory = true) => {
    const id = activeFileIdRef.current;
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        const edits = { ...f.edits, ...newEdits };
        if (!pushHistory) {
          return { ...f, edits };
        }
        const history = f.history.slice(0, f.historyIndex + 1);
        history.push(edits);
        return { ...f, edits, history, historyIndex: history.length - 1 };
      }
      return f;
    }));
  }, []);

  const updateCropLive = useCallback((crop: Crop | undefined) => {
    const id = activeFileIdRef.current;
    setFiles(prev => prev.map(f =>
      f.id === id
        ? { ...f, edits: { ...f.edits, crop } }
        : f
    ));
  }, []);

  const handleUndo = useCallback(() => {
    const id = activeFileIdRef.current;
    setFiles(prev => prev.map(f => {
      if (f.id === id && f.historyIndex > 0) {
        const newIndex = f.historyIndex - 1;
        return { ...f, edits: f.history[newIndex], historyIndex: newIndex };
      }
      return f;
    }));
  }, []);

  const handleRedo = useCallback(() => {
    const id = activeFileIdRef.current;
    setFiles(prev => prev.map(f => {
      if (f.id === id && f.historyIndex < f.history.length - 1) {
        const newIndex = f.historyIndex + 1;
        return { ...f, edits: f.history[newIndex], historyIndex: newIndex };
      }
      return f;
    }));
  }, []);

  // ── Handlers that depend on core edit functions ──

  const handleExitClick = useCallback(() => {
    if (filesRef.current.length > 0) {
      setShowExitModal(true);
    } else {
      onClose();
    }
  }, [onClose]);

  const handleConfirmCrop = useCallback(() => {
    const af = filesRef.current.find(f => f.id === activeFileIdRef.current);
    if (!af) return;
    handleEditChange({ crop: af.edits.crop }, true);
    setIsCropActive(false);
  }, [handleEditChange]);

  const handleCancelCrop = useCallback(() => {
    updateCropLive(initialCrop);
    setIsCropActive(false);
  }, [initialCrop]);

  const handleCancelTool = useCallback(() => {
    if (initialEdits) {
      const id = activeFileIdRef.current;
      setFiles(prev => prev.map(f => {
        if (f.id === id) {
          // Truncate history so Redo can't resurface discarded edits after Cancel
          const history = f.history.slice(0, initialHistoryIndex + 1);
          return { ...f, edits: { ...initialEdits }, history, historyIndex: initialHistoryIndex };
        }
        return f;
      }));
    }
    setActiveCategory('none');
    setIsCropActive(false);
  }, [initialEdits, initialHistoryIndex]);

  const handleApplyTool = useCallback(() => {
    if (isCropActive) {
      handleConfirmCrop();
      setActiveCategory('none');
      return;
    }
    setActiveCategory('none');
    setIsCropActive(false);
  }, [isCropActive, handleConfirmCrop]);

  useEffect(() => {
    if (!activeFileId && files.length > 0) {
      setActiveFileId(files[0].id);
    }
  }, [files, activeFileId]);

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);

  const executeRemoveFile = useCallback((id: string) => {
    const isRemovingActive = id === activeFileIdRef.current;
    const remainingFiles = filesRef.current.filter(f => f.id !== id);
    
    if (remainingFiles.length === 0) {
      onClose();
      setFiles([]);
    } else {
      if (isRemovingActive) {
        setActiveFileId(remainingFiles[0].id);
      }
      setFiles(remainingFiles);
    }
  }, [onClose]);

  const removeFile = useCallback((id: string) => {
    const fileToRemove = filesRef.current.find(f => f.id === id);
    if (!fileToRemove) return;

    const fileHasEdits = fileToRemove.edits.rotate !== 0 ||
                         fileToRemove.edits.flipX ||
                         fileToRemove.edits.flipY ||
                         fileToRemove.edits.filter !== 'none' ||
                         fileToRemove.edits.crop !== undefined ||
                         fileToRemove.edits.resize !== undefined;

    const isLastFile = filesRef.current.length === 1;

    if (fileHasEdits || isLastFile) {
      setFileToDeleteId(id);
    } else {
      executeRemoveFile(id);
    }
  }, [executeRemoveFile]);

  const updateOutputName = useCallback((id: string, name: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, outputName: name } : f));
  }, []);

  const processImage = async (file: WorkspaceFile, format: FileFormat, quality: number = 0.9): Promise<{ blob: Blob, dataUrl: string, width: number, height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const { rotate: rawRotate, flipX, flipY, crop, resize } = file.edits;
        const cleanRotate = ((rawRotate % 360) + 360) % 360;
        const rad = (cleanRotate * Math.PI) / 180;

        // ── Step 1: Crop from original image ──
        // Crop percentages are defined on the ORIGINAL image (crop mode shows
        // it unrotated). Rotation is applied to the cropped result.
        let cropX = 0, cropY = 0;
        let cropW = img.width, cropH = img.height;

        if (crop && crop.width && crop.height) {
          cropX = (crop.x / 100) * img.width;
          cropY = (crop.y / 100) * img.height;
          // Clamp to minimum 1px to prevent canvas context crash on zero-size crop
          cropW = Math.max(1, (crop.width / 100) * img.width);
          cropH = Math.max(1, (crop.height / 100) * img.height);
        }

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = Math.round(cropW);
        cropCanvas.height = Math.round(cropH);
        const cropCtx = cropCanvas.getContext('2d')!;
        cropCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        // ── Step 2: Apply rotation + flip to the cropped result ──
        const isSwapped = cleanRotate % 180 !== 0;
        const rotW = isSwapped ? cropH : cropW;
        const rotH = isSwapped ? cropW : cropH;

        const rotCanvas = document.createElement('canvas');
        rotCanvas.width = Math.round(rotW);
        rotCanvas.height = Math.round(rotH);
        const rotCtx = rotCanvas.getContext('2d')!;
        rotCtx.save();
        rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
        rotCtx.rotate(rad);
        rotCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
        rotCtx.drawImage(cropCanvas, -cropW / 2, -cropH / 2);
        rotCtx.restore();

        // ── Step 3: Determine final output size (respects manual resize) ──
        const targetWidth  = resize?.width  ?? Math.round(rotW);
        const targetHeight = resize?.height ?? Math.round(rotH);

        // ── Step 4: Draw rotated + resized image with pixel filters ──
        const outCanvas = document.createElement('canvas');
        outCanvas.width  = targetWidth;
        outCanvas.height = targetHeight;
        const outCtx = outCanvas.getContext('2d')!;

        const filterDef = FILTERS.find(f => f.id === file.edits.filter);
        const filterStr = filterDef && filterDef.css !== 'none' ? filterDef.css : '';
        outCtx.filter = filterStr;

        outCtx.drawImage(
          rotCanvas,
          0, 0, rotCanvas.width, rotCanvas.height,
          0, 0, targetWidth, targetHeight
        );

        const outFormat = format === 'original' ? file.file.type : format;
        // Canvas toBlob/toDataURL expect quality in [0, 1]; our UI stores [0, 100]
        const outQuality = quality > 1 ? quality / 100 : quality;
        const dataUrl = outCanvas.toDataURL(outFormat, outQuality);

        outCanvas.toBlob((blob) => {
          if (blob) {
            resolve({ blob, dataUrl, width: outCanvas.width, height: outCanvas.height });
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        }, outFormat, outQuality);
      };
      img.onerror = reject;
      img.src = file.originalUrl;
    });
  };

  const handleExport = useCallback(async (format: FileFormat, batch: boolean, quality: number = 0.9) => {
    if (isExportingRef.current) return;
    isExportingRef.current = true;
    setIsExporting(true);
    try {
      const ref = filesRef.current;
      const af = ref.find(f => f.id === activeFileIdRef.current);
      const filesToProcess = batch ? ref : (af ? [af] : []);
      if (filesToProcess.length === 0) return;

      if (format === 'application/pdf') {
        let defaultPdfName = filesToProcess.length > 1 ? 'Omni_Collection' : filesToProcess[0].outputName;
        let pdfName = defaultPdfName;
        if (!pdfName.toLowerCase().endsWith('.pdf')) {
          pdfName += '.pdf';
        }

        let pdf: jsPDF | null = null;
        
        for (let i = 0; i < filesToProcess.length; i++) {
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
          const ext = format === 'original'
            ? (f.file.name.split('.').pop() || f.file.type.split('/')[1] || 'bin')
            : (format.split('/')[1] || 'bin');
          
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
      isExportingRef.current = false;
    }
  }, []);

  const handleApplyEditsToAll = useCallback((editsToApply: Partial<ImageEdits>) => {
    setFiles(prev => prev.map(f => {
      const edits = { ...f.edits, ...editsToApply };
      // Preserve crop as it is usually image-specific
      edits.crop = f.edits.crop;
      const history = f.history.slice(0, f.historyIndex + 1);
      history.push(edits);
      return { ...f, edits, history, historyIndex: history.length - 1 };
    }));
  }, []);

  const handleResetAll = useCallback(() => {
    setFiles(prev => prev.map(f => {
      const edits = { ...defaultEdits };
      const history = f.history.slice(0, f.historyIndex + 1);
      history.push(edits);
      return { ...f, edits, history, historyIndex: history.length - 1 };
    }));
  }, []);

  const handleRemoveBackground = useCallback(async () => {
    const af = filesRef.current.find(f => f.id === activeFileIdRef.current);
    if (!af || isProcessingRef.current || af.hasBackgroundRemoved) return;
    isProcessingRef.current = true;
    setIsProcessingMagic(true);
    setMagicError(null);
    try {
      const processed = await processImage(af, 'image/png');

      const blob = await removeBackground(processed.blob);

      const url = URL.createObjectURL(blob);
      const newFile = new File([blob], `${af.outputName}-nobg.png`, { type: 'image/png' });

      // Revoke the old original URL before replacing it — App.tsx revoker won't
      // catch this because the file ID stays the same after background removal.
      URL.revokeObjectURL(af.originalUrl);
      if (af.previewUrl && af.previewUrl !== af.originalUrl) {
        URL.revokeObjectURL(af.previewUrl);
      }
      
      setFiles(prev => prev.map(f => {
        if (f.id === af.id) {
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
  }, []);

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
            
            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
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
              
              <div className="flex-1 relative min-h-0 flex flex-col justify-center lg:justify-start">
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
                {/* Single StudioCanvas instance — avoids double baking and double blob URLs.
                    Mobile gets top padding to clear the floating control bar. */}
                <StudioCanvas 
                   file={activeFile} 
                   isCropActive={isCropActive}
                   cropAspect={cropAspect}
                   onCropChange={(c) => updateCropLive(c)}
                   onCropComplete={(c) => updateCropLive(c)}
                   className={isMobile ? 'pt-14' : ''}
                   isProcessingMagic={isProcessingMagic}
                />
              </div>

              {/* Mobile Tool Screen */}
              <div className="lg:hidden flex flex-col w-full relative">
                <AnimatePresence initial={false}>
                  {activeCategory !== 'none' && (
                    <MobileToolScreen
                      activeFile={activeFile}
                      files={files}
                      activeCategory={activeCategory}
                      onClose={() => setActiveCategory('none')}
                      onEditChange={handleEditChange}
                      isCropActive={isCropActive}
                      setIsCropActive={setIsCropActive}
                      cropAspect={cropAspect}
                      setCropAspect={setCropAspect}
                      onUndo={handleUndo}
                      onRedo={handleRedo}
                      hasUndo={activeFile.historyIndex > 0}
                      hasRedo={activeFile.historyIndex < activeFile.history.length - 1}
                      onApplyEditsToAll={handleApplyEditsToAll}
                      onCancelCrop={handleCancelCrop}
                      onConfirmCrop={handleConfirmCrop}
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
                      onResetAll={handleResetAll}
                      onCropLiveUpdate={(c) => updateCropLive(c)}
                      onCancelTool={handleCancelTool}
                    />
                  )}
                </AnimatePresence>

                <MobileToolSelector 
                   activeCategory={activeCategory} 
                   setActiveCategory={setActiveCategory}
                   className={`z-50 w-full transition-transform duration-300 ${activeCategory !== 'none' ? 'translate-y-full' : 'translate-y-0'}`}
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
               selectedFormat={selectedFormat}
               onFormatChange={setSelectedFormat}
               onReorder={setFiles}
               exportQuality={exportQuality}
               setExportQuality={setExportQuality}
               onApplyEditsToAll={() => handleApplyEditsToAll(activeFile!.edits)}
               onResetAll={handleResetAll}
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
