import { WorkspaceFile, FileFormat } from '@/src/types';
import { UploadDropzone } from './UploadDropzone';
import { useState, useEffect } from 'react';
import { Reorder, AnimatePresence } from 'motion/react';
import { Download, X, Copy, Trash2, GripVertical, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/src/lib/hooks';

interface BatchSidebarProps {
  files: WorkspaceFile[];
  activeFileId: string;
  setActiveFileId: (id: string) => void;
  removeFile: (id: string) => void;
  onAddFiles: (files: File[]) => void;
  updateOutputName: (id: string, name: string) => void;
  onExport: (format: FileFormat, batch: boolean, quality: number) => void;
  isExporting: boolean;
  className?: string;
  onCloseMobile?: () => void;
  activeCategory?: string;
  onReorder?: (files: WorkspaceFile[]) => void;
  exportQuality?: number;
  setExportQuality?: (quality: number) => void;
  onApplyEditsToAll?: () => void;
  onResetAll?: () => void;
}

export function BatchSidebar({ 
  files, 
  activeFileId, 
  setActiveFileId, 
  removeFile, 
  onAddFiles, 
  updateOutputName, 
  onExport, 
  isExporting, 
  className = '',
  onCloseMobile,
  activeCategory,
  onReorder,
  exportQuality = 90,
  setExportQuality,
  onApplyEditsToAll,
  onResetAll,
}: BatchSidebarProps) {
  const [format, setFormat] = useState<FileFormat>('image/jpeg');
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (files.length === 0) {
      setEstimatedSize(0);
      return;
    }

    if (format === 'original' || format === 'image/png') {
      const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);
      setEstimatedSize(totalSize);
      return;
    }

    setIsEstimating(true);
    const timer = setTimeout(() => {
      const fileToTest = files[0];
      const outFormat = format === 'application/pdf' ? 'image/jpeg' : format;
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsEstimating(false);
          return;
        }
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const ratio = blob.size / fileToTest.file.size;
            const totalOriginalSize = files.reduce((acc, f) => acc + f.file.size, 0);
            setEstimatedSize(totalOriginalSize * ratio);
          }
          setIsEstimating(false);
        }, outFormat, exportQuality / 100);
      };
      img.onerror = () => setIsEstimating(false);
      img.src = fileToTest.originalUrl;
    }, 50);

    return () => clearTimeout(timer);
  }, [files, format, exportQuality]);

  const showExport = activeCategory === 'export';
  const showFiles = activeCategory === 'batch';

  return (
    <div className={`w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-surface flex flex-col overflow-hidden ${className}`}>
      <div className="p-4 border-b border-border sticky top-0 bg-surface/90 backdrop-blur z-10 flex items-center justify-between">
        <h3 className="text-xl font-black tracking-tighter uppercase font-brand">
          {isMobile ? (activeCategory === 'batch' ? 'Manage Files' : 'Export Settings') : 'OMNI'}
        </h3>
        {onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-muted hover:text-fg transition-colors rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Output Format */}
        <div className={`space-y-3 ${showExport ? 'block' : 'hidden lg:block'}`}>
          <label className="text-[10px] uppercase tracking-[0.15em] font-black text-muted block mb-2">Output Format</label>
          <select 
             value={format} 
             onChange={(e) => setFormat(e.target.value as FileFormat)}
             className="w-full rounded border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-wider text-fg outline-none focus:border-accent hover:border-fg cursor-pointer appearance-none"
          >
             <option value="original">Original Format</option>
             <option value="image/jpeg">JPG</option>
             <option value="image/png">PNG</option>
             <option value="image/webp">WEBP</option>
             <option value="application/pdf">{files.length > 1 ? 'PDF (Combined)' : 'PDF'}</option>
          </select>
          {format === 'application/pdf' && files.length > 1 && (
             <p className="text-xs text-muted leading-relaxed">All {files.length} images will be combined into a single PDF document in the order listed below.</p>
          )}

          {/* Quality Dropdown */}
          {(format === 'image/jpeg' || format === 'image/webp' || format === 'application/pdf') && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-[0.15em] font-black text-muted block">Quality</label>
                {estimatedSize !== null && (
                  <span className={`text-[10px] font-bold text-muted transition-opacity duration-200 ${isEstimating ? 'opacity-50' : 'opacity-100'}`}>
                    {`~${estimatedSize > 1024 * 1024 ? (estimatedSize / 1024 / 1024).toFixed(2) + ' MB' : (estimatedSize / 1024).toFixed(0) + ' KB'}`}
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={exportQuality}
                  onChange={(e) => setExportQuality?.(Number(e.target.value))}
                  className="w-full rounded border border-border bg-surface px-3 py-2 pr-8 text-xs font-bold uppercase tracking-wider text-fg outline-none focus:border-accent hover:border-fg cursor-pointer appearance-none"
                >
                  <option value={60}>Low (Web)</option>
                  <option value={80}>Medium (Social)</option>
                  <option value={90}>High (Print)</option>
                  <option value={100}>Maximum (Lossless)</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Files List */}
        <div className={`space-y-3 ${showFiles ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between mb-2">
             <h4 className="text-[10px] uppercase tracking-[0.15em] font-black text-muted block">Batch Processing</h4>
             <span className="text-[10px] font-bold bg-surface-hover text-muted px-2 py-0.5 rounded border border-border">{files.length}</span>
          </div>
            
          <Reorder.Group 
            axis="y" 
            values={files} 
            onReorder={onReorder || (() => {})} 
            className="flex flex-col gap-2"
          >
            <AnimatePresence initial={false}>
             {files.map(file => (
                <Reorder.Item 
                   key={file.id} 
                   value={file}
                   initial={{ opacity: 0, height: 0, scale: 0.95 }}
                   animate={{ opacity: 1, height: 'auto', scale: 1 }}
                   exit={{ opacity: 0, height: 0, scale: 0.95 }}
                   transition={{ duration: 0.2 }}
                   style={{ overflow: 'hidden' }}
                   className={`group relative flex flex-col rounded-lg border transition-colors cursor-default ${activeFileId === file.id ? 'border-accent bg-accent/5' : 'border-border bg-surface hover:border-fg'}`}
                >
                   <div className="flex flex-col gap-2 p-3">
                     <div className="flex items-center gap-3">
                       <div className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted/30 hover:text-muted transition-colors">
                          <GripVertical className="h-4 w-4" />
                       </div>
                       <div 
                          className="flex-1 min-w-0 flex items-center gap-3"
                          onClick={() => {
                            setActiveFileId(file.id);
                            if (isMobile) onCloseMobile?.();
                          }}
                       >
                         <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-bg ring-1 ring-border">
                           <img src={file.originalUrl} alt={`Preview of ${file.file.name}`} className="h-full w-full object-cover grayscale brightness-110" />
                         </div>                       <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-fg truncate">{file.file.name}</div>
                            <div className="text-[10px] tracking-widest text-muted uppercase mt-0.5">
                               {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        <input 
                           type="text" 
                           value={file.outputName}
                           onChange={(e) => updateOutputName(file.id, e.target.value)}
                           className="flex-1 min-w-0 rounded border border-transparent bg-transparent px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted placeholder-muted/50 transition-colors hover:border-border focus:border-accent focus:bg-surface focus:text-fg focus:outline-none"
                           placeholder="Output name"
                        />
                        <button 
                           onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                           className="p-1.5 text-muted hover:text-red-500 transition-all rounded-md shrink-0"
                           aria-label="Remove file"
                        >
                           <Trash2 className="h-4 w-4" />
                        </button>
                     </div>
                   </div>
                </Reorder.Item>
             ))}
            </AnimatePresence>
          </Reorder.Group>
             
             <div className="pt-2">
               <UploadDropzone onFilesAccepted={onAddFiles} isCompact />
             </div>

             {files.length > 1 && (
               <div className="flex gap-2 pt-1">
                 <button
                   onClick={onApplyEditsToAll}
                   className="flex-1 py-2 rounded-lg border border-border text-[10px] font-black uppercase tracking-wider text-muted hover:text-fg hover:border-fg/40 transition-colors"
                 >
                   Apply Edits to All
                 </button>
                 <button
                   onClick={onResetAll}
                   className="flex-1 py-2 rounded-lg border border-border text-[10px] font-black uppercase tracking-wider text-muted hover:text-red-500 hover:border-red-500/40 transition-colors"
                 >
                   Reset All
                 </button>
               </div>
             )}
          </div>
      </div>


      {/* Action Buttons Footer */}
      <div className={`p-6 border-t border-border bg-surface/90 backdrop-blur shrink-0 z-10 flex flex-col items-center gap-3 ${showExport || !isMobile ? 'flex' : 'hidden'}`}>
         <button 
           disabled={isExporting}
           onClick={() => onExport(format, false, exportQuality / 100)}
           className="flex w-full max-w-[240px] items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-accent-fg transition-all hover:opacity-90 shadow-lg active:scale-95 disabled:opacity-50"
         >
           {isExporting ? (
             <div className="h-4 w-4 border-2 border-accent-fg/30 border-t-accent-fg rounded-full animate-spin" />
           ) : (
             <Download className="h-4 w-4" />
           )}
           Save Active Image
         </button>
         {files.length > 1 && (
           <button 
             disabled={isExporting}
             onClick={() => onExport(format, true, exportQuality / 100)}
             className="flex w-full max-w-[240px] items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-fg transition-all hover:border-fg disabled:opacity-50"
           >
             <Copy className="h-4 w-4 text-muted" /> Export All ({files.length})
           </button>
         )}
      </div>
    </div>
  );
}
