import React, { useRef, useState } from 'react';
import { WorkspaceFile, ImageEdits, FILTERS, FileFormat } from '@/src/types';
import { Crop, Undo, Redo, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, X, Plus, Lock, Unlock, Wand2, Sparkles, SlidersHorizontal, Maximize2, ChevronUp } from 'lucide-react';
import { ToolCategory } from './MobileToolSelector';

interface EditorToolbarProps {
  file: WorkspaceFile;
  files?: WorkspaceFile[];
  onEditChange: (edits: Partial<ImageEdits>) => void;
  isCropActive: boolean;
  setIsCropActive: (active: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  hasUndo: boolean;
  hasRedo: boolean;
  onApplyEditsToAll: (edits: Partial<ImageEdits>) => void;
  onResetAll?: () => void;
  cropAspect: number | undefined;
  setCropAspect: (aspect: number | undefined) => void;
  onCancelCrop: () => void;
  onConfirmCrop: () => void;
  mode?: 'desktop' | 'mobile';
  activeCategory?: ToolCategory;
  onCloseMobile?: () => void;
  setActiveFileId?: (id: string) => void;
  removeFile?: (id: string) => void;
  onAddFiles?: (files: File[]) => void;
  onExport?: (format: FileFormat, batch: boolean, quality: number) => Promise<void>;
  isExporting?: boolean;
  selectedFormat?: FileFormat;
  onFormatChange?: (format: FileFormat) => void;
  exportQuality?: number;
  setExportQuality?: (quality: number) => void;
  onRemoveBackground?: () => void;
  isProcessingMagic?: boolean;
  magicError?: string | null;
  onDismissMagicError?: () => void;
  onQualityOpen?: () => void;
  className?: string;
}

type DesktopTab = 'filters' | 'transform' | 'resize' | 'magic';

const TABS: { id: DesktopTab; icon: React.ReactNode; label: string }[] = [
  { id: 'transform', icon: <SlidersHorizontal className="h-4 w-4" />, label: 'Transform'  },
  { id: 'filters',   icon: <Sparkles className="h-4 w-4" />,          label: 'Filters'    },
  { id: 'resize',    icon: <Maximize2 className="h-4 w-4" />,         label: 'Resize'     },
  { id: 'magic',     icon: <Wand2 className="h-4 w-4" />,             label: 'Magic'      },
];

export const EditorToolbar = React.memo(function EditorToolbar({
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
  onResetAll,
  cropAspect,
  setCropAspect,
  onCancelCrop,
  onConfirmCrop,
  mode = 'desktop',
  activeCategory = 'none',
  onCloseMobile,
  setActiveFileId,
  removeFile,
  onAddFiles,
  onExport,
  isExporting = false,
  selectedFormat = 'image/jpeg',
  onFormatChange,
  exportQuality = 90,
  setExportQuality,
  onRemoveBackground,
  isProcessingMagic = false,
  magicError,
  onDismissMagicError,
  onQualityOpen,
  className = ''
}: EditorToolbarProps) {
  // All hooks must be at the top — before any conditional returns
  const [activeTab, setActiveTab] = useState<DesktopTab>('filters');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const edits = file.edits;

  // ─── Mobile toolbar ───────────────────────────────────────────────────────
  if (mode === 'mobile' && activeCategory !== 'none') {
    return (
      <div className={`w-full ${className}`}>

        {/* FILTERS — horizontal scroll with swatch + label */}
        {activeCategory === 'filters' && (
          <div className="overflow-x-auto hide-scrollbar px-4 py-3">
            <div className="flex items-center gap-2 min-w-max">
              {FILTERS.map(filter => {
                const active = edits.filter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => onEditChange({ filter: filter.id })}
                    className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl border-2 min-w-[72px] transition-all active:scale-95 ${
                      active ? 'border-accent bg-accent/10' : 'border-border bg-surface'
                    }`}
                  >
                    <span
                      className="w-9 h-9 rounded-xl border border-border/50"
                      style={{ background: 'linear-gradient(135deg,#777 0%,#ccc 50%,#444 100%)', filter: filter.css === 'none' ? 'none' : filter.css }}
                    />
                    <span className={`text-[9px] font-bold uppercase tracking-wide leading-tight text-center ${active ? 'text-accent' : 'text-muted'}`}>
                      {filter.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TRANSFORM */}
        {activeCategory === 'transform' && (
          <div className="px-4 py-3 space-y-3">
            {isCropActive ? (
              <>
                <p className="text-[9px] uppercase tracking-widest font-bold text-muted">Aspect Ratio</p>
                <div className="grid grid-cols-4 gap-2">
                  {CROP_RATIOS.map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => setCropAspect(opt.val)}
                      className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all active:scale-95 ${
                        cropAspect === opt.val ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface text-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {TRANSFORM_ACTIONS(edits, onEditChange, () => setIsCropActive(true), onCloseMobile).map(a => (
                  <button
                    key={a.label}
                    onClick={a.onClick}
                    className="flex flex-col items-center justify-center gap-2 py-3.5 rounded-2xl border border-border bg-surface text-muted active:scale-95 active:bg-surface-hover transition-all"
                  >
                    <span className="text-fg/80">{a.icon}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wide">{a.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESIZE */}
        {activeCategory === 'resize' && (
          <div className="px-4 py-3">
            <ResizePanel file={file} edits={edits} onEditChange={onEditChange} mobile />
          </div>
        )}

        {/* BATCH */}
        {activeCategory === 'batch' && (
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-fg/80">Project Files</span>
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/30">
                {files.length} {files.length === 1 ? 'image' : 'images'}
              </span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1 pt-3 px-1" style={{ overflowY: 'visible' }}>
              {files.map(f => (
                <div key={f.id} className="relative shrink-0">
                  <button
                    onClick={() => setActiveFileId?.(f.id)}
                    className={`w-16 h-16 rounded-xl border-2 overflow-hidden transition-all active:scale-95 ${
                      f.id === file.id ? 'border-accent shadow-lg shadow-accent/20' : 'border-border opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={f.originalUrl} alt={f.file.name} className="w-full h-full object-cover" />
                  </button>
                  {files.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile?.(f.id); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 z-10 active:scale-90 shadow-lg shadow-accent/50 border-2 border-bg"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 shrink-0 rounded-xl border-2 border-dashed border-border bg-surface flex flex-col items-center justify-center gap-1 text-muted active:scale-95 transition-all"
              >
                <Plus className="h-5 w-5" />
                <span className="text-[9px] font-bold">Add</span>
              </button>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => { if (e.target.files) onAddFiles?.(Array.from(e.target.files)); }} />
            {files.length > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={() => onApplyEditsToAll(edits)}
                  className="flex-1 py-2.5 rounded-xl border border-border bg-surface text-[10px] font-black uppercase tracking-wide text-muted active:bg-surface-hover transition-colors"
                >
                  Apply to All
                </button>
                <button
                  onClick={() => onResetAll?.()}
                  className="flex-1 py-2.5 rounded-xl border border-red-500/30 bg-red-500/5 text-[10px] font-black uppercase tracking-wide text-red-400 active:bg-red-500/10 transition-colors"
                >
                  Reset All
                </button>
              </div>
            )}
          </div>
        )}

        {/* MAGIC */}
        {activeCategory === 'magic' && (
          <div className="px-4 py-3">
            <MagicPanel file={file} onRemoveBackground={onRemoveBackground} isProcessingMagic={isProcessingMagic} magicError={magicError} mobile />
          </div>
        )}

        {/* EXPORT */}
        {activeCategory === 'export' && (
          <div className="px-4 py-3 space-y-3">
            <div className="flex gap-2">
              {FORMAT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onFormatChange?.(value)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all active:scale-95 ${
                    selectedFormat === value ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface text-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {(selectedFormat === 'image/jpeg' || selectedFormat === 'image/webp' || selectedFormat === 'application/pdf') && (
              <button
                onClick={() => onQualityOpen?.()}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-surface active:bg-surface-hover transition-colors"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Quality</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-fg/80">
                    {QUALITY_OPTIONS.find(q => q.value === exportQuality)?.label ?? `${exportQuality}%`}
                  </span>
                  <ChevronUp className="h-3.5 w-3.5 text-muted" />
                </div>
              </button>
            )}
          </div>
        )}

      </div>
    );
  }

  // ─── Desktop toolbar ───────────────────────────────────────────────────────
  return (
    <div className={`w-72 border-r border-border bg-surface flex flex-col h-full shrink-0 ${className}`}>
      {/* Header: logo + undo/redo */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-base font-black tracking-tighter uppercase font-brand text-fg">Tools</span>
        <div className="flex items-center gap-0.5">
          <button onClick={onUndo} disabled={!hasUndo} title="Undo" className="p-1.5 rounded-md text-muted hover:text-fg hover:bg-surface-hover disabled:opacity-25 transition-colors">
            <Undo className="h-3.5 w-3.5" />
          </button>
          <button onClick={onRedo} disabled={!hasRedo} title="Redo" className="p-1.5 rounded-md text-muted hover:text-fg hover:bg-surface-hover disabled:opacity-25 transition-colors">
            <Redo className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-4 border-b border-border shrink-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[9px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-accent text-accent bg-accent/5'
                : 'border-transparent text-muted hover:text-fg hover:bg-surface-hover'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── FILTERS ── */}
        {activeTab === 'filters' && (
          <div className="p-3 space-y-1.5">
            {FILTERS.map(filter => (
              <button
                key={filter.id}
                onClick={() => onEditChange({ filter: filter.id })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  edits.filter === filter.id
                    ? 'bg-accent/10 text-accent border border-accent/30'
                    : 'text-fg hover:bg-surface-hover border border-transparent'
                }`}
              >
                <FilterSwatch filterId={filter.id} css={filter.css} />
                <span className="text-xs font-semibold">{filter.label}</span>
                {edits.filter === filter.id && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── TRANSFORM ── */}
        {activeTab === 'transform' && (
          <div className="p-3 space-y-4">
            {isCropActive ? (
              <>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted">Aspect Ratio</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {CROP_RATIOS.map(opt => (
                    <button
                      key={opt.label}
                      onClick={() => setCropAspect(opt.val)}
                      className={`py-2 rounded-lg border text-[10px] font-bold transition-colors ${
                        cropAspect === opt.val
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border text-muted hover:text-fg hover:border-fg/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={onCancelCrop} className="flex-1 py-2 rounded-lg border border-border text-xs font-semibold text-muted hover:text-fg transition-colors">
                    Cancel
                  </button>
                  <button onClick={onConfirmCrop} className="flex-1 py-2 rounded-lg bg-accent text-accent-fg text-xs font-semibold hover:opacity-90 transition-opacity">
                    Apply Crop
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted">Rotate & Flip</p>
                <div className="grid grid-cols-2 gap-2">
                  {TRANSFORM_ACTIONS(edits, onEditChange, () => setIsCropActive(true), undefined).map(a => (
                    <button
                      key={a.label}
                      onClick={a.onClick}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border text-muted hover:text-fg hover:bg-surface-hover hover:border-fg/30 transition-colors text-xs font-semibold"
                    >
                      {a.icon}
                      {a.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── RESIZE ── */}
        {activeTab === 'resize' && (
          <div className="p-3">
            <ResizePanel file={file} edits={edits} onEditChange={onEditChange} />
          </div>
        )}

        {/* ── MAGIC ── */}
        {activeTab === 'magic' && (
          <div className="p-3">
            <MagicPanel file={file} onRemoveBackground={onRemoveBackground} isProcessingMagic={isProcessingMagic} magicError={magicError} />
          </div>
        )}

      </div>
    </div>
  );
});

// ─── Shared constants ──────────────────────────────────────────────────────

const CROP_RATIOS = [
  { label: 'Free', val: undefined },
  { label: '1:1',  val: 1 },
  { label: '4:3',  val: 4/3 },
  { label: '3:2',  val: 3/2 },
  { label: '16:9', val: 16/9 },
  { label: '21:9', val: 21/9 },
  { label: '2:3',  val: 2/3 },
  { label: '9:16', val: 9/16 },
];

const FORMAT_OPTIONS: { value: FileFormat; label: string }[] = [
  { value: 'original',        label: 'Original' },
  { value: 'image/jpeg',      label: 'JPEG' },
  { value: 'image/png',       label: 'PNG'  },
  { value: 'image/webp',      label: 'WebP' },
  { value: 'application/pdf', label: 'PDF' },
];

export const QUALITY_OPTIONS = [
  { value: 60,  label: 'Low (Web)'        },
  { value: 80,  label: 'Medium (Social)'  },
  { value: 90,  label: 'High (Print)'     },
  { value: 100, label: 'Maximum (Lossless)' },
];

function TRANSFORM_ACTIONS(
  edits: ImageEdits,
  onEditChange: (e: Partial<ImageEdits>) => void,
  onCrop: () => void,
  onCloseMobile?: () => void
) {
  return [
    { label: 'Crop',      icon: <Crop className="h-3.5 w-3.5" />,            onClick: onCrop },
    { label: 'Rotate CW', icon: <RotateCw className="h-3.5 w-3.5" />,        onClick: () => onEditChange({ rotate: (edits.rotate + 90) % 360 }) },
    { label: 'Rotate CCW',icon: <RotateCcw className="h-3.5 w-3.5" />,       onClick: () => onEditChange({ rotate: (edits.rotate - 90 + 360) % 360 }) },
    { label: 'Flip H',    icon: <FlipHorizontal className="h-3.5 w-3.5" />,  onClick: () => onEditChange({ flipX: !edits.flipX }) },
    { label: 'Flip V',    icon: <FlipVertical className="h-3.5 w-3.5" />,    onClick: () => onEditChange({ flipY: !edits.flipY }) },
  ];
}

// ─── Sub-components ────────────────────────────────────────────────────────

function FilterSwatch({ filterId, css }: { filterId: string; css: string }) {
  // A small colored square that previews the filter using a gradient
  const isNone = filterId === 'none' || css === 'none';
  return (
    <span
      className="w-6 h-6 rounded shrink-0 border border-border/50"
      style={{
        background: 'linear-gradient(135deg, #888 0%, #ccc 50%, #555 100%)',
        filter: isNone ? 'none' : css,
      }}
    />
  );
}

function ResizePanel({ file, edits, onEditChange, mobile }: {
  file: WorkspaceFile;
  edits: ImageEdits;
  onEditChange: (e: Partial<ImageEdits>) => void;
  mobile?: boolean;
}) {
  const w = edits.resize?.width  ?? file.originalWidth;
  const h = edits.resize?.height ?? file.originalHeight;
  const locked = edits.resize?.lockAspect ?? false;

  const setW = (width: number) => {
    const height = locked ? Math.round(width * (file.originalHeight / file.originalWidth)) : h;
    onEditChange({ resize: { width, height, lockAspect: locked } });
  };
  const setH = (height: number) => {
    const width = locked ? Math.round(height * (file.originalWidth / file.originalHeight)) : w;
    onEditChange({ resize: { width, height, lockAspect: locked } });
  };
  const toggleLock = () => onEditChange({ resize: { width: w, height: h, lockAspect: !locked } });

  const inputCls = mobile
    ? 'w-full px-3 py-2 bg-surface border border-border rounded-lg text-fg text-sm focus:border-accent focus:outline-none'
    : 'w-full px-2 py-1.5 bg-surface-2 border border-border rounded-lg text-sm text-fg focus:border-accent focus:outline-none';
  const labelCls = mobile ? 'block text-xs font-medium text-fg/80 mb-2' : 'block text-xs text-muted mb-1';

  return (
    <div className="space-y-3">
      <div className="text-[10px] text-muted">
        Original: {file.originalWidth} × {file.originalHeight}px
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Width</label>
          <input type="number" value={w} onChange={(e) => setW(parseInt(e.target.value) || file.originalWidth)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Height</label>
          <input type="number" value={h} onChange={(e) => setH(parseInt(e.target.value) || file.originalHeight)} className={inputCls} />
        </div>
      </div>
      <button
        onClick={toggleLock}
        className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-semibold transition-colors ${
          locked
            ? mobile ? 'border-accent bg-accent/10 text-accent' : 'border-accent bg-accent/10 text-accent'
            : mobile ? 'border-border bg-surface text-fg/80' : 'border-border bg-surface-2 text-muted hover:text-fg'
        }`}
      >
        {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
        Lock Aspect Ratio
      </button>
    </div>
  );
}

function MagicPanel({ file, onRemoveBackground, isProcessingMagic, magicError, mobile }: {
  file: WorkspaceFile;
  onRemoveBackground?: () => void;
  isProcessingMagic: boolean;
  magicError?: string | null;
  mobile?: boolean;
}) {
  const done  = file.hasBackgroundRemoved;
  const error = !!magicError;

  const btnCls = mobile
    ? `w-full flex items-center justify-center gap-3 py-4 rounded-xl border-2 transition-all duration-300 active:scale-95 disabled:opacity-50 ${error ? 'border-red-500 bg-red-500/20 text-red-400' : done ? 'border-green-500 bg-green-500/20 text-green-400' : 'border-border bg-surface text-fg/80 hover:border-fg/40'}`
    : `w-full flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-50 ${error ? 'border-red-500/50 bg-red-500/10 text-red-400' : done ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-border bg-surface-hover text-fg hover:bg-surface-2'}`;

  return (
    <div className="space-y-3">
      {!mobile && <p className="text-[10px] uppercase tracking-widest font-bold text-muted">AI Tools</p>}
      <button onClick={onRemoveBackground} disabled={isProcessingMagic || done} className={btnCls}>
        <Wand2 className={`h-4 w-4 ${isProcessingMagic ? 'animate-pulse' : ''}`} />
        {isProcessingMagic ? 'Processing…' : error ? 'Failed — Retry' : done ? 'Background Removed ✓' : 'Remove Background'}
      </button>
      {magicError && <p className="text-xs text-red-400 leading-relaxed">{magicError}</p>}
      {!done && !error && (
        <p className="text-[11px] text-muted leading-relaxed">
          Uses AI to remove the background from your image. Works best on photos with clear subjects.
        </p>
      )}
    </div>
  );
}
