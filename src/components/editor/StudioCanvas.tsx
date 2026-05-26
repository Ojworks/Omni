import React, { useRef, useEffect, useState } from 'react';
import { type Crop } from 'react-image-crop';
import { WorkspaceFile, FILTERS } from '@/src/types';
import { motion } from 'motion/react';
import { ProcessingOverlay } from './ProcessingOverlay';
import { useIsMobile } from '@/src/lib/hooks';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type HandleType = 'move' | 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r';

interface DragState {
  handle: HandleType;
  startX: number;
  startY: number;
  startCrop: { x: number; y: number; width: number; height: number };
  overlayW: number;
  overlayH: number;
}

interface CustomCropOverlayProps {
  crop: Crop;
  aspect?: number;
  onChange: (crop: Crop) => void;
  onComplete: (crop: Crop) => void;
  isMobile?: boolean;
}

// ─────────────────────────────────────────────
// Custom Crop Overlay — Lightroom / PS style
// ─────────────────────────────────────────────
function CustomCropOverlay({ crop, aspect, onChange, onComplete, isMobile = false }: CustomCropOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const lastCropRef = useRef<Crop>(crop);
  const [isDragging, setIsDragging] = useState(false);

  lastCropRef.current = crop;

  const cx = crop.x ?? 0;
  const cy = crop.y ?? 0;
  const cw = crop.width ?? 100;
  const ch = crop.height ?? 100;

  // Apply aspect ratio immediately when it changes
  useEffect(() => {
    if (!aspect || !overlayRef.current) return;
    const { width: ow, height: oh } = overlayRef.current.getBoundingClientRect();
    if (!ow || !oh) return;
    const pxW = (cw / 100) * ow;
    const pxH = (ch / 100) * oh;
    const targetPxH = pxW / aspect;
    const newH = (targetPxH / oh) * 100;
    const newY = Math.max(0, Math.min(100 - newH, cy + (ch - newH) / 2));
    const next: Crop = { unit: '%', x: cx, y: newY, width: cw, height: Math.min(100 - newY, newH) };
    onChange(next);
    onComplete(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect]);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const computeNewCrop = (
    handle: HandleType,
    start: DragState['startCrop'],
    dx: number, dy: number,
    ow: number, oh: number,
    asp?: number
  ): { x: number; y: number; width: number; height: number } => {
    let { x, y, width, height } = start;
    const minW = (isMobile ? 40 : 20) / ow * 100;
    const minH = (isMobile ? 40 : 20) / oh * 100;

    switch (handle) {
      case 'move':
        x = clamp(start.x + dx, 0, 100 - width);
        y = clamp(start.y + dy, 0, 100 - height);
        break;
      case 'tl': {
        const nx = clamp(start.x + dx, 0, start.x + start.width - minW);
        const ny = clamp(start.y + dy, 0, start.y + start.height - minH);
        width = start.width - (nx - start.x);
        height = start.height - (ny - start.y);
        x = nx; y = ny; break;
      }
      case 'tr': {
        const ny = clamp(start.y + dy, 0, start.y + start.height - minH);
        height = start.height - (ny - start.y);
        width = clamp(start.width + dx, minW, 100 - start.x);
        y = ny; break;
      }
      case 'bl': {
        const nx = clamp(start.x + dx, 0, start.x + start.width - minW);
        width = start.width - (nx - start.x);
        height = clamp(start.height + dy, minH, 100 - start.y);
        x = nx; break;
      }
      case 'br':
        width = clamp(start.width + dx, minW, 100 - start.x);
        height = clamp(start.height + dy, minH, 100 - start.y);
        break;
      case 't': {
        const ny = clamp(start.y + dy, 0, start.y + start.height - minH);
        height = start.height - (ny - start.y); y = ny; break;
      }
      case 'b':
        height = clamp(start.height + dy, minH, 100 - start.y); break;
      case 'l': {
        const nx = clamp(start.x + dx, 0, start.x + start.width - minW);
        width = start.width - (nx - start.x); x = nx; break;
      }
      case 'r':
        width = clamp(start.width + dx, minW, 100 - start.x); break;
    }

    if (asp && handle !== 'move') {
      if (handle === 't' || handle === 'b') {
        const newW = clamp((height * oh / 100) * asp / ow * 100, minW, 100);
        x = clamp(x + (width - newW) / 2, 0, 100 - newW);
        width = newW;
      } else if (handle === 'l' || handle === 'r') {
        const newH = clamp((width * ow / 100) / asp / oh * 100, minH, 100);
        y = clamp(y + (height - newH) / 2, 0, 100 - newH);
        height = newH;
      } else {
        const newH = (width * ow / 100) / asp / oh * 100;
        height = clamp(newH, minH, 100);
        if (handle === 'tl' || handle === 'tr') y = start.y + start.height - height;
        if (handle === 'tl' || handle === 'bl') x = start.x + start.width - width;
      }
      x = clamp(x, 0, 100 - width);
      y = clamp(y, 0, 100 - height);
      width = clamp(width, minW, 100 - x);
      height = clamp(height, minH, 100 - y);
    }

    return { x, y, width, height };
  };

  // ── Pointer event wiring ────────────────────────────────────────
  const startDrag = (handle: HandleType) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    dragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { x: cx, y: cy, width: cw, height: ch },
      overlayW: rect.width,
      overlayH: rect.height,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const { handle, startX, startY, startCrop, overlayW, overlayH } = dragRef.current;
      const dx = ((e.clientX - startX) / overlayW) * 100;
      const dy = ((e.clientY - startY) / overlayH) * 100;
      const next = computeNewCrop(handle, startCrop, dx, dy, overlayW, overlayH, aspect);
      const newCrop: Crop = { unit: '%', ...next };
      lastCropRef.current = newCrop;
      onChange(newCrop);
    };

    const onUp = (e: PointerEvent) => {
      if (!dragRef.current) return;
      onMove(e);
      onComplete(lastCropRef.current);
      dragRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  // computeNewCrop is stable (no deps), aspect/onChange/onComplete are stable refs from parent
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect, onChange, onComplete]);

  // ── Render ──────────────────────────────────────────────────────
  // Scrim panels (4 rects covering outside-crop area)
  const scrimStyle = 'absolute bg-black/55 pointer-events-none transition-none';

  // Corner handle renderer — Lightroom-style L shape
  const Corner = ({ pos, cursor, handle }: { pos: 'tl'|'tr'|'bl'|'br'; cursor: string; handle: HandleType }) => {
    const isLeft = pos.endsWith('l');
    const isTop  = pos.startsWith('t');
    const hitSize = isMobile ? 56 : 32;
    const offset  = isMobile ? -10 : -4;
    const armLen  = isMobile ? 24 : 18;
    const armThick = isMobile ? 4 : 3;
    return (
      <div
        onPointerDown={startDrag(handle)}
        className="absolute z-20"
        style={{
          cursor,
          width: hitSize,
          height: hitSize,
          [isLeft ? 'left' : 'right']: offset,
          [isTop  ? 'top'  : 'bottom']: offset,
          touchAction: 'none',
          display: 'flex',
          alignItems: isTop ? 'flex-start' : 'flex-end',
          justifyContent: isLeft ? 'flex-start' : 'flex-end',
        }}
      >
        {/* horizontal arm */}
        <div className="absolute bg-white rounded-sm" style={{
          width: armLen, height: armThick,
          [isLeft ? 'left' : 'right']: isMobile ? 6 : 0,
          [isTop  ? 'top'  : 'bottom']: isMobile ? 6 : 0,
        }} />
        {/* vertical arm */}
        <div className="absolute bg-white rounded-sm" style={{
          width: armThick, height: armLen,
          [isLeft ? 'left' : 'right']: isMobile ? 6 : 0,
          [isTop  ? 'top'  : 'bottom']: isMobile ? 6 : 0,
        }} />
      </div>
    );
  };

  // Edge handle renderer — pill shape
  const Edge = ({ side, handle }: { side: 't'|'b'|'l'|'r'; handle: HandleType }) => {
    const isHoriz = side === 't' || side === 'b';
    const hitThick = isMobile ? 48 : 16;
    const hitLong  = isMobile ? 64 : 44;
    const barLong  = isMobile ? 36 : 28;
    const barThick = isMobile ? 4 : 3;
    const offset   = -(hitThick / 2);
    return (
      <div
        onPointerDown={startDrag(handle)}
        className="absolute z-20 flex items-center justify-center"
        style={{
          cursor: isHoriz ? 'ns-resize' : 'ew-resize',
          touchAction: 'none',
          ...(side === 't' ? { top: offset, left: '50%', transform: 'translateX(-50%)', width: hitLong, height: hitThick } :
              side === 'b' ? { bottom: offset, left: '50%', transform: 'translateX(-50%)', width: hitLong, height: hitThick } :
              side === 'l' ? { left: offset, top: '50%', transform: 'translateY(-50%)', width: hitThick, height: hitLong } :
                             { right: offset, top: '50%', transform: 'translateY(-50%)', width: hitThick, height: hitLong }),
        }}
      >
        <div className="bg-white rounded-full" style={
          isHoriz ? { width: barLong, height: barThick } : { width: barThick, height: barLong }
        } />
      </div>
    );
  };

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0"
      style={{ cursor: isDragging ? 'grabbing' : 'default', touchAction: 'none' }}
    >
      {/* ── Scrim panels ── */}
      {/* Top */}
      <div className={scrimStyle} style={{ top: 0, left: 0, right: 0, height: `${cy}%` }} />
      {/* Bottom */}
      <div className={scrimStyle} style={{ bottom: 0, left: 0, right: 0, height: `${100 - cy - ch}%` }} />
      {/* Left */}
      <div className={scrimStyle} style={{ top: `${cy}%`, left: 0, width: `${cx}%`, height: `${ch}%` }} />
      {/* Right */}
      <div className={scrimStyle} style={{ top: `${cy}%`, right: 0, width: `${100 - cx - cw}%`, height: `${ch}%` }} />

      {/* ── Crop box ── */}
      <div
        className="absolute"
        style={{
          left: `${cx}%`, top: `${cy}%`,
          width: `${cw}%`, height: `${ch}%`,
          cursor: 'move',
          touchAction: 'none',
        }}
        onPointerDown={startDrag('move')}
      >
        {/* Outer border */}
        <div className="absolute inset-0 border border-white/80 pointer-events-none" />

        {/* Rule-of-thirds grid — fades in while dragging */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: isDragging ? 1 : 0, transition: 'opacity 150ms ease' }}
        >
          {/* Vertical lines */}
          <div className="absolute top-0 bottom-0 border-l border-white/35" style={{ left: '33.33%' }} />
          <div className="absolute top-0 bottom-0 border-l border-white/35" style={{ left: '66.66%' }} />
          {/* Horizontal lines */}
          <div className="absolute left-0 right-0 border-t border-white/35" style={{ top: '33.33%' }} />
          <div className="absolute left-0 right-0 border-t border-white/35" style={{ top: '66.66%' }} />
        </div>

        {/* Center crosshair dot (Lightroom style) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
             style={{ width: 10, height: 10 }}>
          <div className="absolute top-1/2 left-0 right-0 border-t border-white/60" />
          <div className="absolute left-1/2 top-0 bottom-0 border-l border-white/60" />
        </div>

        {/* ── Corner handles ── */}
        <Corner pos="tl" cursor="nw-resize" handle="tl" />
        <Corner pos="tr" cursor="ne-resize" handle="tr" />
        <Corner pos="bl" cursor="sw-resize" handle="bl" />
        <Corner pos="br" cursor="se-resize" handle="br" />

        {/* ── Edge handles ── */}
        <Edge side="t" handle="t" />
        <Edge side="b" handle="b" />
        <Edge side="l" handle="l" />
        <Edge side="r" handle="r" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// StudioCanvas
// ─────────────────────────────────────────────
interface StudioCanvasProps {
  file: WorkspaceFile;
  isCropActive: boolean;
  cropAspect?: number;
  onCropChange: (crop: Crop) => void;
  onCropComplete: (crop: Crop) => void;
  className?: string;
  isProcessingMagic?: boolean;
}

export function StudioCanvas({ file, isCropActive, cropAspect, onCropChange, onCropComplete, className = '', isProcessingMagic = false }: StudioCanvasProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const [cropDimensions, setCropDimensions] = useState({ width: 0, height: 0 });
  const [innerHeight, setInnerHeight] = useState<number | undefined>(undefined);
  const [innerWidth, setInnerWidth] = useState<number | undefined>(undefined);
  const [dimensionsReady, setDimensionsReady] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const filterDef = FILTERS.find(f => f.id === file.edits.filter);
  const filters = filterDef && filterDef.css !== 'none' ? filterDef.css : '';

  // Measure the inner container
  useEffect(() => {
    if (!innerRef.current) return;
    const rect = innerRef.current.getBoundingClientRect();
    if (rect.width > 0) setInnerWidth(rect.width);
    if (rect.height > 0) setInnerHeight(rect.height);

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { height, width } = entry.contentRect;
        if (width > 0 && height > 0) {
          setInnerHeight(height);
          setInnerWidth(width);
          setTimeout(() => setDimensionsReady(true), 300);
        }
      }
    });
    ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, []);

  // Reset states when file changes
  useEffect(() => {
    setNaturalSize(null);
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true);
      setNaturalSize({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
    } else {
      setImageLoaded(false);
    }
  }, [file.id]);

  // Dynamically draw the cropped area onto the mini preview canvas
  useEffect(() => {
    if (!isCropActive || !imgRef.current || !previewCanvasRef.current || !file.edits.crop || !imageLoaded) return;
    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = file.edits.crop;

    const pixelCrop = {
      x: (crop.x / 100) * image.naturalWidth,
      y: (crop.y / 100) * image.naturalHeight,
      width: (crop.width / 100) * image.naturalWidth,
      height: (crop.height / 100) * image.naturalHeight,
    };

    const cW = Math.round(pixelCrop.width);
    const cH = Math.round(pixelCrop.height);
    setCropDimensions({ width: cW, height: cH });

    if (!cW || !cH) { canvas.width = 0; canvas.height = 0; return; }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = cW;
    canvas.height = cH;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, cW, cH);
  }, [file.edits.crop, isCropActive, file.originalUrl, imageLoaded]);

  const constrainedImgStyle = (): React.CSSProperties => ({
    display: 'block',
    maxWidth: innerWidth ? `${innerWidth}px` : '100%',
    maxHeight: innerHeight ? `${innerHeight}px` : '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    userSelect: 'none',
    pointerEvents: 'none', // overlay handles all events
    WebkitUserSelect: 'none',
  });

  // ── Cropped-only preview (when not in crop mode) ─────────────
  const getCroppedPreview = () => {
    const crop = file.edits.crop;
    // Treat as cropped only when the region is meaningfully smaller than the full image.
    // Use 99.9 threshold to guard against floating-point near-100 values.
    const isCropped = crop && (crop.width < 99.9 || crop.height < 99.9) && crop.width > 0 && crop.height > 0;
    if (!isCropped || !innerWidth || !innerHeight) return null;

    // Prefer state, fall back to the live img element in case onLoad hasn't fired yet
    // (this happens when the render branch switches from crop-mode to preview-mode).
    const naturalW = naturalSize?.w || imgRef.current?.naturalWidth || 0;
    const naturalH = naturalSize?.h || imgRef.current?.naturalHeight || 0;
    if (!naturalW || !naturalH) return null;

    const isVertical = file.edits.rotate % 180 !== 0;
    const visualW = isVertical ? naturalH : naturalW;
    const visualH = isVertical ? naturalW : naturalH;

    const cropX = (crop.x / 100) * visualW;
    const cropY = (crop.y / 100) * visualH;
    const cropW = (crop.width / 100) * visualW;
    const cropH = (crop.height / 100) * visualH;

    if (cropW <= 0 || cropH <= 0) return null;

    const scale = Math.min(innerWidth / cropW, innerHeight / cropH);

    const containerW = Math.round(cropW * scale);
    const containerH = Math.round(cropH * scale);
    const imgW = Math.round(visualW * scale);
    const imgH = Math.round(visualH * scale);
    const imgLeft = Math.round(-cropX * scale);
    const imgTop  = Math.round(-cropY * scale);

    return { containerW, containerH, imgW, imgH, imgLeft, imgTop };
  };

  const croppedPreview = getCroppedPreview();

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageLoaded(true);
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  // Current crop (default to full image if none)
  const activeCrop: Crop = file.edits.crop ?? { unit: '%', x: 0, y: 0, width: 100, height: 100 };

  return (
    <div ref={containerRef} className={`flex-1 overflow-hidden flex items-center justify-center p-3 md:p-12 relative bg-bg ${className}`}>
      {/* No SVG filters needed anymore */}

      {/* Live Mini Preview (Desktop only, shown during crop) */}
      {isCropActive && (
        <motion.div
          drag
          dragConstraints={containerRef}
          dragMomentum={false}
          className="absolute top-6 right-6 z-50 rounded-lg shadow-2xl border border-border bg-surface/60 backdrop-blur-md hidden md:flex flex-col transition-opacity duration-200 cursor-move"
          style={{
            width: '240px',
            height: '240px',
            opacity: file.edits.crop?.width && file.edits.crop?.height ? 1 : 0
          }}
        >
          <div className="bg-surface-hover/80 border-b border-border text-fg/90 text-[10px] font-bold tracking-widest uppercase px-3 py-2 flex justify-between items-center shrink-0 rounded-t-lg">
            <span>Preview</span>
            {cropDimensions.width > 0 && cropDimensions.height > 0 && (
              <span className="text-muted font-mono tracking-normal text-[9px]">{cropDimensions.width} &times; {cropDimensions.height} px</span>
            )}
          </div>
          <div className="flex-1 p-3 flex items-center justify-center overflow-hidden rounded-b-lg">
            <canvas
              ref={previewCanvasRef}
              style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block', filter: filters }}
              className="rounded-sm shadow-md block pointer-events-none"
            />
          </div>
        </motion.div>
      )}

      <div className="w-full h-full flex items-center justify-center relative">
        <div
          ref={innerRef}
          className="relative w-full h-full flex items-center justify-center transition-opacity duration-200"
          style={{ opacity: dimensionsReady && imageLoaded ? 1 : 0 }}
        >
          {isCropActive ? (
            /* ── Crop mode: image + overlay wrapper ── */
            <div className="relative" style={{ display: 'inline-flex', lineHeight: 0 }}>
              <motion.img
                ref={imgRef}
                src={file.originalUrl}
                onLoad={onImgLoad}
                animate={{
                  rotate: file.edits.rotate,
                  scaleX: file.edits.flipX ? -1 : 1,
                  scaleY: file.edits.flipY ? -1 : 1,
                }}
                transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                style={{
                  filter: filters,
                  ...constrainedImgStyle()
                }}
                alt="Cropping"
                className="shadow-2xl rounded-sm bg-checkerboard"
                draggable={false}
              />
              <CustomCropOverlay
                crop={activeCrop}
                aspect={cropAspect}
                onChange={onCropChange}
                onComplete={onCropComplete}
                isMobile={isMobile}
              />
              <ProcessingOverlay isVisible={isProcessingMagic} />
            </div>
          ) : croppedPreview ? (
            /* ── Cropped preview ── */
            <div style={{
              width: `${croppedPreview.containerW}px`,
              height: `${croppedPreview.containerH}px`,
              overflow: 'hidden',
              position: 'relative',
              flexShrink: 0,
            }}>
              <motion.img
                ref={imgRef}
                src={file.originalUrl}
                onLoad={onImgLoad}
                animate={{
                  rotate: file.edits.rotate,
                  scaleX: file.edits.flipX ? -1 : 1,
                  scaleY: file.edits.flipY ? -1 : 1,
                }}
                transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                style={{
                  filter: filters,
                  position: 'absolute',
                  width: `${croppedPreview.imgW}px`,
                  height: `${croppedPreview.imgH}px`,
                  left: `${croppedPreview.imgLeft}px`,
                  top: `${croppedPreview.imgTop}px`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                }}
                alt="Preview"
                className="rounded-lg shadow-2xl bg-checkerboard"
              />
              <ProcessingOverlay isVisible={isProcessingMagic} />
            </div>
          ) : (
            /* ── No crop — simple contained image ── */
            <div className="w-full h-full flex items-center justify-center overflow-hidden">
              <div className="relative flex items-center justify-center" style={{ display: 'inline-flex', maxWidth: '100%', maxHeight: '100%' }}>
                <motion.img
                  ref={imgRef}
                  src={file.originalUrl}
                  onLoad={onImgLoad}
                  animate={{
                    rotate: file.edits.rotate,
                    scaleX: file.edits.flipX ? -1 : 1,
                    scaleY: file.edits.flipY ? -1 : 1,
                  }}
                  transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                  style={{
                    filter: filters,
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                  alt="Preview"
                  className="rounded-lg shadow-2xl bg-checkerboard"
                />
                <ProcessingOverlay isVisible={isProcessingMagic} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
