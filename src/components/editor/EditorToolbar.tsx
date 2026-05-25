import { useState, useRef } from 'react';
import { WorkspaceFile, ImageEdits, FILTERS, defaultEdits, FileFormat } from '@/src/types';
import { Crop, Undo, Redo, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, X, Plus, Download, Maximize, Lock, Unlock, ChevronDown, ChevronUp, Wand2, Type } from 'lucide-react';
import { ToolCategory } from './MobileToolSelector';
import { ConfirmationModal } from './ConfirmationModal';

interface EditorToolbarProps {
  file: WorkspaceFile;
  files?: WorkspaceFile[];
  onEditChange: (edits: Partial<ImageEdits>, pushHistory?: boolean) => void;
  isCropActive: boolean;
  setIsCropActive: (active: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  hasUndo: boolean;
  hasRedo: boolean;
  onApplyEditsToAll: (edits: Partial<ImageEdits>) => void;
  cropAspect?: number;
  setCropAspect: (aspect: number | undefined) => void;
  className?: string;
  activeCategory?: ToolCategory;
  mode?: 'desktop' | 'mobile';
  onCloseMobile?: () => void;
  setActiveFileId?: (id: string) => void;
  removeFile?: (id: string) => void;
  onAddFiles?: (files: File[]) => void;
  onExport?: (format: FileFormat, batch: boolean) => void;
  isExporting?: boolean;
  onCancelCrop?: () => void;
  onConfirmCrop?: () => void;
  selectedFormat?: FileFormat;
  onFormatChange?: (format: FileFormat) => void;
  exportQuality?: number;
  setExportQuality?: (quality: number) => void;
  onRemoveBackground?: () => void;
  isProcessingMagic?: boolean;
  magicError?: string | null;
  onDismissMagicError?: () => void;
}

export function EditorToolbar({ 
  file, 
  files = [],
  onEditChange, 
  isCropActive, 
  setIsCropActive, 
  onUndo, 
  onRedo, 
  hasUndo, 
  hasRedo, 
  onApplyEditsToAll, 
  cropAspect, 
  setCropAspect, 
  className = '',
  activeCategory = 'none',
  mode = 'desktop',
  onCloseMobile,
  setActiveFileId,
  removeFile,
  onAddFiles,
  onExport,
  isExporting,
  onCancelCrop,
  onConfirmCrop,
  selectedFormat: selectedFormatProp,
  onFormatChange,
  exportQuality = 90,
  setExportQuality,
  onRemoveBackground,
  isProcessingMagic,
  magicError,
  onDismissMagicError
}: EditorToolbarProps) {
  const edits = file.edits;
  const [internalSelectedFormat, setInternalSelectedFormat] = useState<FileFormat>('image/jpeg');
  const activeFormat = selectedFormatProp || internalSelectedFormat;
  const [showResetModal, setShowResetModal] = useState(false);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  // Compute actual dimensions factoring in rotation and crop
  const isVertical = edits.rotate % 180 !== 0;
  const baseWidth = isVertical ? (file.originalHeight || 1000) : (file.originalWidth || 1000);
  const baseHeight = isVertical ? (file.originalWidth || 1000) : (file.originalHeight || 1000);
  
  const currentCropWidth = edits.crop?.width ? (edits.crop.width / 100) * baseWidth : baseWidth;
  const currentCropHeight = edits.crop?.height ? (edits.crop.height / 100) * baseHeight : baseHeight;
  
  const defaultWidth = Math.round(currentCropWidth);
  const defaultHeight = Math.round(currentCropHeight);

  const hasNonCropEdits = edits.rotate !== defaultEdits.rotate || 
                          edits.flipX !== defaultEdits.flipX || 
                          edits.flipY !== defaultEdits.flipY || 
                          edits.filter !== defaultEdits.filter ||
                          edits.resize !== undefined;

  const handleResetAllEdits = () => {
     setShowResetModal(true);
  };

  const handleActivateCrop = () => {
    // Just activate crop mode. The EditorWorkspace effect will initialize
    // the crop value directly on edits (without touching history) if needed.
    setIsCropActive(true);
  };

  const handleRatioClick = (val: number | undefined) => {
    setCropAspect(val);
    if (val === undefined) return;
    
    const imageAspect = baseWidth / baseHeight;
    let cropWidth = 80;
    let cropHeight = 80;

    if (imageAspect > val) {
      cropHeight = 80;
      cropWidth = (80 / imageAspect) * val;
    } else {
      cropWidth = 80;
      cropHeight = (80 * imageAspect) / val;
    }

    onEditChange({ 
      crop: { unit: '%', x: (100 - cropWidth) / 2, y: (100 - cropHeight) / 2, width: cropWidth, height: cropHeight } 
    }, false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (mode === 'mobile' && activeCategory !== 'none') {
    // Only categories with many/wide items that genuinely need horizontal scroll
    const isScrollCategory = ['filters'].includes(activeCategory);

    return (
      <div className={`w-full bg-surface/80 backdrop-blur-2xl border-t border-border relative z-40 ${className}`}>
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-full bg-accent/5 blur-[80px] pointer-events-none" />

        {/* ── SCROLLABLE CATEGORIES (transform / adjust / filters) ── */}
        {isScrollCategory && (
          <div className="overflow-x-auto hide-scrollbar px-4 py-3">
            <div className="flex items-center gap-4 min-w-max h-[72px] relative z-10">


              {/* Filters */}
              {activeCategory === 'filters' && (
                <div className="flex items-center gap-3 px-2">
                  {FILTERS.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => onEditChange({ filter: filter.id })}
                      className={`flex flex-col items-center justify-center min-w-[72px] h-[64px] rounded-xl border-2 px-2 transition-all duration-300 ${edits.filter === filter.id ? 'border-accent bg-accent/10 text-accent shadow-md' : 'border-border bg-surface/50 text-muted hover:border-fg hover:text-fg'}`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider text-center leading-tight">{filter.label}</span>
                    </button>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── FULL-WIDTH CATEGORIES (batch / resize / export) ── */}
        {!isScrollCategory && (
          <div className="px-4 py-3 relative z-10">

            {/* Transform — 5 items always fit, no scroll needed */}
            {activeCategory === 'transform' && (
              <div>
                {isCropActive ? (
                  /* Crop ratio — 5 equal buttons in a grid */
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Free', val: undefined },
                      { label: '1:1',  val: 1 },
                      { label: '4:3',  val: 4/3 },
                      { label: '3:2',  val: 3/2 },
                      { label: '2:3',  val: 2/3 },
                      { label: '16:9', val: 16/9 },
                      { label: '21:9', val: 21/9 },
                      { label: 'Port', val: 9/16 }
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => handleRatioClick(opt.val)}
                        className={`flex items-center justify-center h-12 rounded-xl border-2 transition-all duration-300 ${cropAspect === opt.val ? 'border-accent bg-accent/10 text-accent shadow-lg' : 'border-border bg-surface/50 text-muted'}`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Non-crop actions — equal-width flex row */
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleActivateCrop}
                      className="group flex-1 flex flex-col items-center justify-center gap-1.5 h-14 rounded-xl border border-border bg-surface/50 text-muted hover:border-fg hover:text-fg transition-all duration-300"
                    >
                      <Crop className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Crop</span>
                    </button>
                    <div className="w-px h-8 bg-border/50 flex-shrink-0" />
                    <button
                      onClick={() => onEditChange({ rotate: (edits.rotate + 90) % 360, crop: undefined })}
                      className="group flex-1 flex flex-col items-center justify-center gap-1.5 h-14 rounded-xl border border-border bg-surface/50 text-muted transition-all duration-300 hover:border-fg hover:text-fg"
                    >
                      <RotateCw className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-center">Right</span>
                    </button>
                    <button
                      onClick={() => onEditChange({ rotate: (edits.rotate - 90 + 360) % 360, crop: undefined })}
                      className="group flex-1 flex flex-col items-center justify-center gap-1.5 h-14 rounded-xl border border-border bg-surface/50 text-muted transition-all duration-300 hover:border-fg hover:text-fg"
                    >
                      <RotateCw className="h-4 w-4 -scale-x-100 group-hover:-rotate-90 transition-transform duration-300" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-center">Left</span>
                    </button>
                    <button
                      onClick={() => onEditChange({ flipY: !edits.flipY, crop: undefined })}
                      className="group flex-1 flex flex-col items-center justify-center gap-1.5 h-14 rounded-xl border border-border bg-surface/50 text-muted transition-all duration-300 hover:border-fg hover:text-fg"
                    >
                      <FlipVertical className="h-4 w-4 group-hover:scale-y-[-1] transition-transform duration-300" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-center">Vert</span>
                    </button>
                    <button
                      onClick={() => onEditChange({ flipX: !edits.flipX, crop: undefined })}
                      className="group flex-1 flex flex-col items-center justify-center gap-1.5 h-14 rounded-xl border border-border bg-surface/50 text-muted transition-all duration-300 hover:border-fg hover:text-fg"
                    >
                      <FlipHorizontal className="h-4 w-4 group-hover:scale-x-[-1] transition-transform duration-300" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-center">Horiz</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Files (Batch) */}
            {activeCategory === 'batch' && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Project Files</span>
                  <span className="text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">{files.length} {files.length === 1 ? 'Image' : 'Images'}</span>
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pt-3 pb-2 hide-scrollbar">
                  {files.map(f => (
                    <div key={f.id} className="relative flex-shrink-0 overflow-visible">
                      <button
                        onClick={() => setActiveFileId?.(f.id)}
                        className={`w-[60px] h-[60px] rounded-xl border-2 overflow-hidden transition-all duration-300 ${f.id === file.id ? 'border-accent shadow-lg scale-105' : 'border-transparent opacity-50 hover:opacity-80'}`}
                      >
                        <img src={f.originalUrl} alt={`Thumbnail of ${f.file.name}`} className="w-full h-full object-cover" />
                      </button>
                      {files.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile?.(f.id); }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg active:scale-90 z-10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center min-w-[60px] h-[60px] rounded-xl border-2 border-dashed border-border bg-surface/50 text-muted hover:border-accent hover:text-accent transition-all duration-300 flex-shrink-0"
                  >
                    <Plus className="h-5 w-5" />
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      ref={fileInputRef}
                      onChange={(e) => { if (e.target.files) onAddFiles?.(Array.from(e.target.files)); }}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Resize */}
            {activeCategory === 'resize' && (
              <div className="flex items-center gap-3">
                {/* Width */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted">Width</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={edits.resize?.width ?? defaultWidth}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val <= 0) return;
                        const lockAspect = edits.resize?.lockAspect ?? true;
                        let newHeight = edits.resize?.height ?? defaultHeight;
                        if (lockAspect) newHeight = Math.max(1, Math.round(val * (defaultHeight / defaultWidth)));
                        onEditChange({ resize: { width: val, height: newHeight, lockAspect } });
                      }}
                      className="w-full bg-surface/50 border-2 border-border text-fg text-sm px-3 py-2.5 rounded-xl focus:border-accent outline-none font-mono pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted pointer-events-none">PX</span>
                  </div>
                </div>

                {/* Lock Aspect Ratio */}
                <button
                  onClick={() => {
                    const lockAspect = !(edits.resize?.lockAspect ?? true);
                    onEditChange({ resize: { width: edits.resize?.width ?? defaultWidth, height: edits.resize?.height ?? defaultHeight, lockAspect } });
                  }}
                  className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl border-2 flex-shrink-0 transition-all duration-300 mt-4 ${edits.resize?.lockAspect ?? true ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface/50 text-muted'}`}
                >
                  {edits.resize?.lockAspect ?? true ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  <span className="text-[8px] font-black uppercase">Lock</span>
                </button>

                {/* Height */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted">Height</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={edits.resize?.height ?? defaultHeight}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val <= 0) return;
                        const lockAspect = edits.resize?.lockAspect ?? true;
                        let newWidth = edits.resize?.width ?? defaultWidth;
                        if (lockAspect) newWidth = Math.max(1, Math.round(val * (defaultWidth / defaultHeight)));
                        onEditChange({ resize: { width: newWidth, height: val, lockAspect } });
                      }}
                      className="w-full bg-surface/50 border-2 border-border text-fg text-sm px-3 py-2.5 rounded-xl focus:border-accent outline-none font-mono pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted pointer-events-none">PX</span>
                  </div>
                </div>
              </div>
            )}

            {/* Export */}
            {activeCategory === 'export' && (
              <div className="flex flex-col gap-3">
                {/* Format grid */}
                <div className="grid grid-cols-4 gap-2 w-full">
                  {[
                    { label: 'JPG',  val: 'image/jpeg' },
                    { label: 'PNG',  val: 'image/png' },
                    { label: 'WEBP', val: 'image/webp' },
                    { label: 'PDF',  val: 'application/pdf' }
                  ].map(fmt => (
                    <button
                      key={fmt.label}
                      onClick={() => onFormatChange ? onFormatChange(fmt.val as FileFormat) : setInternalSelectedFormat(fmt.val as FileFormat)}
                      className={`flex items-center justify-center h-14 rounded-xl border-2 transition-all duration-300 ${activeFormat === fmt.val ? 'border-accent bg-accent/10 text-accent shadow-md' : 'border-border bg-surface/50 text-muted'}`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest">{fmt.label}</span>
                    </button>
                  ))}
                </div>
                
                {/* Quality Drop-up */}
                {(activeFormat === 'image/jpeg' || activeFormat === 'image/webp' || activeFormat === 'application/pdf') && (
                  <div className="flex flex-col gap-1 w-full pt-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted">Quality</label>
                    <div className="relative">
                      {isQualityMenuOpen && (
                        <>
                          {/* Invisible backdrop to close the menu when clicking outside */}
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsQualityMenuOpen(false)}
                          />
                          <div className="absolute bottom-full mb-2 left-0 w-full bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden flex flex-col p-1 animate-in slide-in-from-bottom-2 fade-in duration-200">
                            {[
                              { label: 'Maximum (Lossless)', val: 100 },
                              { label: 'High (Print)', val: 90 },
                              { label: 'Medium (Social)', val: 80 },
                              { label: 'Low (Web)', val: 60 }
                            ].map(opt => (
                              <button
                                key={opt.val}
                                onClick={() => {
                                  setExportQuality?.(opt.val);
                                  setIsQualityMenuOpen(false);
                                }}
                                className={`text-left px-3 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${exportQuality === opt.val ? 'bg-accent/10 text-accent' : 'text-fg hover:bg-surface-hover'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      
                      <button
                        onClick={() => setIsQualityMenuOpen(!isQualityMenuOpen)}
                        className="w-full bg-surface/50 border-2 border-border text-fg text-xs px-3 py-3 rounded-xl focus:border-accent outline-none font-bold uppercase tracking-wider text-left relative flex items-center justify-between transition-colors hover:border-fg"
                      >
                        <span>
                          {exportQuality === 100 ? 'Maximum (Lossless)' : 
                           exportQuality === 90 ? 'High (Print)' : 
                           exportQuality === 80 ? 'Medium (Social)' : 'Low (Web)'}
                        </span>
                        <ChevronUp className={`h-4 w-4 text-muted transition-transform duration-300 ${isQualityMenuOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Magic Tools */}
            {activeCategory === 'magic' && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={onRemoveBackground}
                  disabled={isProcessingMagic || file.hasBackgroundRemoved}
                  className={`flex w-full items-center justify-center gap-2 h-14 rounded-xl border-2 transition-all duration-300 disabled:pointer-events-none ${
                    magicError
                      ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:border-red-500'
                      : 'border-border bg-surface/50 text-fg hover:border-fg disabled:opacity-50'
                  }`}
                >
                  <Wand2 className={`h-4 w-4 ${isProcessingMagic ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isProcessingMagic ? 'Processing...' : magicError ? 'Failed — Tap to Retry' : file.hasBackgroundRemoved ? 'Background Removed' : 'Remove Background'}
                  </span>
                </button>
                {magicError && (
                  <p className="text-[9px] text-red-400 text-center font-medium leading-relaxed px-2">
                    {magicError}
                  </p>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    );
  }


  return (
    <div className={`w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border bg-surface flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b border-border p-4 sticky top-0 bg-surface/90 backdrop-blur z-10`}>
        <h3 className="text-xl font-black tracking-tighter uppercase font-brand">OMNI</h3>
        <div className="flex items-center gap-1">
          <button 
             onClick={onUndo} 
             disabled={!hasUndo}
             className="p-1.5 text-muted hover:text-fg disabled:opacity-30 transition-colors rounded-md"
             title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button 
             onClick={onRedo}
             disabled={!hasRedo}
             className="p-1.5 text-muted hover:text-fg disabled:opacity-30 transition-colors rounded-md"
             title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Transform / Crop Section */}
        <div className="space-y-4">
          {isCropActive && (
            <div className="space-y-4 p-4 bg-surface-hover/30 border border-border rounded-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted block">Crop Ratio</h4>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Free', val: undefined },
                    { label: '1:1', val: 1 },
                    { label: '4:3', val: 4/3 },
                    { label: '3:2', val: 3/2 },
                    { label: '2:3', val: 2/3 },
                    { label: '16:9', val: 16/9 },
                    { label: '21:9', val: 21/9 },
                    { label: '9:16', val: 9/16 }
                  ].map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => handleRatioClick(opt.val)}
                      className={`text-[10px] font-bold uppercase py-2 border rounded transition-colors ${cropAspect === opt.val ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface hover:border-fg text-fg'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
                 <button
                   onClick={() => onEditChange({ crop: undefined })}
                   className="text-[10px] font-bold uppercase py-2 border border-border bg-surface hover:border-fg text-fg rounded transition-colors"
                 >
                   Reset
                 </button>
                 <button
                   onClick={onCancelCrop}
                   className="text-[10px] font-bold uppercase py-2 border border-border bg-surface hover:border-fg text-fg rounded transition-colors"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={() => onConfirmCrop?.()}
                   className="col-span-2 text-[10px] font-black uppercase py-2.5 border border-transparent bg-fg text-bg hover:opacity-90 rounded transition-colors mt-1"
                 >
                   Apply Crop
                 </button>
              </div>
            </div>
          )}

          <div className="space-y-3 transition-all duration-300">
            <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted block">Transform</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                 onClick={() => isCropActive ? setIsCropActive(false) : handleActivateCrop()}
                 className={`col-span-2 flex items-center justify-center gap-3 rounded-lg border py-3 transition-colors ${isCropActive ? 'bg-accent border-accent text-accent-fg' : 'border-border bg-surface text-fg hover:border-fg'}`}
              >
                 <Crop className="h-4 w-4" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Crop Tool</span>
              </button>
              <button
                 onClick={() => onEditChange({ rotate: (edits.rotate - 90 + 360) % 360, crop: undefined })}
                 className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-surface py-3.5 text-fg transition-colors hover:border-fg"
              >
                 <RotateCw className="h-4 w-4 -scale-x-100" />
                 <span className="text-[9px] font-bold uppercase tracking-wider">Left 90°</span>
              </button>
              <button
                 onClick={() => onEditChange({ rotate: (edits.rotate + 90) % 360, crop: undefined })}
                 className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-surface py-3.5 text-fg transition-colors hover:border-fg"
              >
                 <RotateCw className="h-4 w-4" />
                 <span className="text-[9px] font-bold uppercase tracking-wider">Right 90°</span>
              </button>
              <button
                 onClick={() => onEditChange({ flipX: !edits.flipX, crop: undefined })}
                 className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-surface py-3.5 text-fg transition-colors hover:border-fg"
              >
                 <FlipHorizontal className="h-4 w-4" />
                 <span className="text-[9px] font-bold uppercase tracking-wider">Horizon</span>
              </button>
              <button
                 onClick={() => onEditChange({ flipY: !edits.flipY, crop: undefined })}
                 className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-surface py-3.5 text-fg transition-colors hover:border-fg"
              >
                 <FlipVertical className="h-4 w-4" />
                 <span className="text-[9px] font-bold uppercase tracking-wider">Vertical</span>
              </button>
            </div>

            <div className="space-y-2 p-4 bg-surface-hover/30 border border-border rounded-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted block">Resize</h4>
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={edits.resize?.lockAspect ?? true} 
                      onChange={(e) => {
                        const lockAspect = e.target.checked;
                        onEditChange({ 
                          resize: { 
                            width: edits.resize?.width ?? defaultWidth, 
                            height: edits.resize?.height ?? defaultHeight, 
                            lockAspect 
                          } 
                        });
                      }}
                      className="accent-accent"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-fg">Lock Ratio</span>
                 </label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">Width</label>
                    <input 
                      type="number"
                      value={edits.resize?.width ?? defaultWidth}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val <= 0) return;
                        const lockAspect = edits.resize?.lockAspect ?? true;
                        let newHeight = edits.resize?.height ?? defaultHeight;
                        if (lockAspect) newHeight = Math.max(1, Math.round(val * (defaultHeight / defaultWidth)));
                        onEditChange({ resize: { width: val, height: newHeight, lockAspect } });
                      }}
                      className="w-full bg-surface border border-border text-fg text-sm p-2 rounded focus:border-accent outline-none"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">Height</label>
                    <input 
                      type="number"
                      value={edits.resize?.height ?? defaultHeight}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val) || val <= 0) return;
                        const lockAspect = edits.resize?.lockAspect ?? true;
                        let newWidth = edits.resize?.width ?? defaultWidth;
                        if (lockAspect) newWidth = Math.max(1, Math.round(val * (defaultWidth / defaultHeight)));
                        onEditChange({ resize: { width: newWidth, height: val, lockAspect } });
                      }}
                      className="w-full bg-surface border border-border text-fg text-sm p-2 rounded focus:border-accent outline-none"
                    />
                 </div>
              </div>
            </div>
          </div>
        </div>


        {/* Magic Section */}
        <div className="space-y-3 transition-all duration-300">
          <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted block">Magic Tools</h4>
          <div className="flex flex-col gap-2">
            <button
               onClick={magicError ? () => { onDismissMagicError?.(); onRemoveBackground?.(); } : onRemoveBackground}
               disabled={isProcessingMagic || file.hasBackgroundRemoved}
               className={`flex items-center justify-center gap-2 w-full rounded-lg border py-3 transition-colors disabled:pointer-events-none ${
                 magicError
                   ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:border-red-500'
                   : 'border-border bg-surface text-fg hover:border-fg disabled:opacity-50'
               }`}
            >
               <Wand2 className={`h-4 w-4 ${isProcessingMagic ? 'animate-pulse' : ''}`} />
               <span className="text-[10px] font-black uppercase tracking-widest">
                 {isProcessingMagic ? 'Processing...' : magicError ? 'Failed — Click to Retry' : file.hasBackgroundRemoved ? 'Background Removed' : 'Remove Background'}
               </span>
            </button>
            {magicError && (
              <p className="text-[9px] text-red-400 text-center font-medium leading-relaxed px-1">
                {magicError}
              </p>
            )}
          </div>
        </div>


        {/* Filters Section */}
        <div className="space-y-3 transition-all duration-300">
          <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted block">Filters</h4>
          <div className="grid grid-cols-2 gap-2">
             {FILTERS.map(filter => (
                <button
                   key={filter.id}
                   onClick={() => onEditChange({ filter: filter.id })}
                   className={`rounded-lg border px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider transition-colors ${edits.filter === filter.id ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface hover:border-fg text-muted hover:text-fg'}`}
                >
                   {filter.label}
                </button>
             ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      {hasNonCropEdits && (
        <div className="p-4 border-t border-border bg-surface sticky bottom-0 z-10 space-y-2 transition-all duration-300">
          <button
             onClick={() => onApplyEditsToAll(edits)}
             className="w-full rounded-lg border border-border bg-surface px-3 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-fg transition-colors hover:border-fg"
          >
             Apply All Edits to Batch
          </button>
          <button
             onClick={handleResetAllEdits}
             className="w-full rounded-lg border border-transparent bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-3 text-[10px] font-black uppercase tracking-[0.15em] transition-colors"
          >
             Reset All Edits
          </button>
        </div>
      )}

      <ConfirmationModal 
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={() => onEditChange({ ...defaultEdits, crop: undefined, resize: undefined })}
        title="Reset All Edits?"
        message="This will revert all transforms, adjustments, and filters for this image. This action cannot be undone."
        confirmText="Reset Image"
        cancelText="Keep Edits"
        type="danger"
      />
    </div>
  );
}
