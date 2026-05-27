import { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Check, Download, X } from "lucide-react";
import { useState } from "react";
import { StudioCanvas } from './StudioCanvas';
import { EditorToolbar, QUALITY_OPTIONS } from './EditorToolbar';
import { WorkspaceFile, ImageEdits, FileFormat } from '@/src/types';
import { ToolCategory } from './MobileToolSelector';
import { Crop } from 'react-image-crop';

interface MobileToolScreenProps {
  activeFile: WorkspaceFile;
  files: WorkspaceFile[];
  activeCategory: ToolCategory;
  onClose: () => void;
  onEditChange: (edits: Partial<ImageEdits>) => void;
  isCropActive: boolean;
  setIsCropActive: (active: boolean) => void;
  cropAspect: number | undefined;
  setCropAspect: (aspect: number | undefined) => void;
  onUndo: () => void;
  onRedo: () => void;
  hasUndo: boolean;
  hasRedo: boolean;
  onApplyEditsToAll: (edits: Partial<ImageEdits>) => void;
  onResetAll: () => void;
  onCancelCrop: () => void;
  onConfirmCrop: () => void;
  setActiveFileId: (id: string) => void;
  removeFile: (id: string) => void;
  onAddFiles: (files: File[]) => void;
  onExport: (format: FileFormat, batch: boolean, quality: number) => Promise<void>;
  isExporting: boolean;
  selectedFormat: FileFormat;
  onFormatChange: (format: FileFormat) => void;
  exportQuality: number;
  setExportQuality: (quality: number) => void;
  onRemoveBackground: () => void;
  isProcessingMagic: boolean;
  magicError: string | null;
  onDismissMagicError: () => void;
  onCropLiveUpdate: (crop: Crop) => void;
  onCancelTool: () => void;
}

export const MobileToolScreen = memo(function MobileToolScreen({
  activeFile,
  files,
  activeCategory,
  onClose,
  onEditChange,
  isCropActive,
  setIsCropActive,
  cropAspect,
  setCropAspect,
  onUndo,
  onRedo,
  hasUndo,
  hasRedo,
  onApplyEditsToAll,
  onResetAll,
  onCancelCrop,
  onConfirmCrop,
  setActiveFileId,
  removeFile,
  onAddFiles,
  onExport,
  isExporting,
  selectedFormat,
  onFormatChange,
  exportQuality,
  setExportQuality,
  onRemoveBackground,
  isProcessingMagic,
  magicError,
  onDismissMagicError,
  onCropLiveUpdate,
  onCancelTool
}: MobileToolScreenProps) {
  const [qualityOpen, setQualityOpen] = useState(false);

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'transform': return isCropActive ? 'Crop' : 'Transform';
      case 'filters': return 'Filters';
      case 'resize': return 'Resize';
      case 'batch': return 'Files';
      case 'magic': return 'Magic';
      case 'export': return 'Export';
      default: return 'Edit';
    }
  };

  const handleCancel = () => {
    if (isProcessingMagic) return;
    if (isCropActive) {
      onCancelCrop();
      onClose();
    } else {
      onCancelTool();
    }
  };

  const handleDone = async () => {
    if (isProcessingMagic) return;
    if (isCropActive) {
      onConfirmCrop();
      onClose();
      return;
    }
    if (activeCategory === 'export') {
      await onExport(selectedFormat, false, exportQuality / 100);
    }
    onClose();
  };

  return (
    <>
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-bg flex flex-col"
      style={{ overscrollBehavior: 'none' }}
    >
      {/* Header */}
      <div className="grid grid-cols-3 items-center px-4 py-3 bg-surface border-b border-border shrink-0">
        <button
          onClick={handleCancel}
          disabled={isProcessingMagic}
          className="justify-self-start flex items-center gap-1.5 px-3 py-2 rounded-xl text-muted hover:text-fg hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-black uppercase tracking-wide">Cancel</span>
        </button>

        <h1 className="text-sm font-black uppercase tracking-widest text-fg text-center truncate">
          {getCategoryTitle()}
        </h1>

        {activeCategory === 'magic' && !activeFile.hasBackgroundRemoved && !isProcessingMagic ? (
          <div />
        ) : (
          <button
            onClick={handleDone}
            disabled={isExporting || isProcessingMagic}
            className="justify-self-end flex items-center gap-1.5 px-4 py-2 bg-accent hover:opacity-90 disabled:opacity-50 text-accent-fg rounded-xl transition-colors active:scale-95 text-xs font-black uppercase tracking-wide"
          >
            {isExporting || isProcessingMagic
              ? <div className="h-3.5 w-3.5 border-2 border-accent-fg/30 border-t-accent-fg rounded-full animate-spin" />
              : activeCategory === 'export' ? <Download className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />
            }
            {isExporting ? 'Saving…' : isProcessingMagic ? 'Processing…' : activeCategory === 'export' ? 'Export' : activeCategory === 'batch' ? 'Select' : 'Done'}
          </button>
        )}
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-bg flex items-center justify-center" style={{ touchAction: 'none' }}>
        <StudioCanvas 
          file={activeFile} 
          isCropActive={isCropActive}
          cropAspect={cropAspect}
          onCropChange={onCropLiveUpdate}
          onCropComplete={onCropLiveUpdate}
          isProcessingMagic={isProcessingMagic}
          className="max-h-full max-w-full"
        />
      </div>

      {/* Tool Controls */}
      <div className="bg-surface border-t border-border pb-safe shrink-0 overflow-y-auto max-h-[45vh]">
        <EditorToolbar 
          file={activeFile}
          files={files}
          onEditChange={onEditChange}
          isCropActive={isCropActive}
          setIsCropActive={setIsCropActive}
          onUndo={onUndo}
          onRedo={onRedo}
          hasUndo={hasUndo}
          hasRedo={hasRedo}
          onApplyEditsToAll={onApplyEditsToAll}
          onResetAll={onResetAll}
          cropAspect={cropAspect}
          setCropAspect={setCropAspect}
          onCancelCrop={onCancelCrop}
          onConfirmCrop={onConfirmCrop}
          mode="mobile"
          activeCategory={activeCategory}
          onCloseMobile={onClose}
          setActiveFileId={setActiveFileId}
          removeFile={removeFile}
          onAddFiles={onAddFiles}
          onExport={onExport}
          isExporting={isExporting}
          selectedFormat={selectedFormat}
          onFormatChange={onFormatChange}
          exportQuality={exportQuality}
          setExportQuality={setExportQuality}
          onRemoveBackground={onRemoveBackground}
          isProcessingMagic={isProcessingMagic}
          magicError={magicError}
          onDismissMagicError={onDismissMagicError}
          onQualityOpen={() => setQualityOpen(true)}
        />
      </div>
    </motion.div>

    {/* Quality drop-up — sibling to the overlay, guaranteed above z-50 */}
    <AnimatePresence>
      {qualityOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-bg/60"
            onClick={() => setQualityOpen(false)}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-surface border-t border-border rounded-t-2xl pb-safe"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-xs font-black uppercase tracking-widest text-muted">Quality</span>
              <button onClick={() => setQualityOpen(false)} className="p-1 text-muted hover:text-fg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            {QUALITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setExportQuality(opt.value); setQualityOpen(false); }}
                className={`w-full flex items-center justify-between px-5 py-4 active:bg-surface-hover transition-colors ${exportQuality === opt.value ? 'text-accent' : 'text-fg/80'}`}
              >
                <span className="text-sm font-semibold">{opt.label}</span>
                {exportQuality === opt.value && <span className="w-2 h-2 rounded-full bg-accent" />}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
});