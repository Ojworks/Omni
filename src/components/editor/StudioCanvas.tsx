import React, { useRef, useEffect, useState, useCallback } from 'react';
import { type Crop } from 'react-image-crop';
import { WorkspaceFile } from '@/src/types';
import { motion } from 'motion/react';
import { ProcessingOverlay } from './ProcessingOverlay';

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
}

// ─────────────────────────────────────────────
// Custom Crop Overlay — Lightroom / PS style
// ─────────────────────────────────────────────
function CustomCropOverlay({ crop, aspect, onChange, onComplete }: CustomCropOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const lastCropRef = useRef<Crop>(crop);
  const [isDragging, setIsDragging] = useState(false);

  // Keep lastCropRef current for the pointerup callback
  lastCropRef.current = crop;

  const cx = crop.x ?? 0;
  const cy = crop.y ?? 0;
  const cw = crop.width ?? 100;
  const ch = crop.height ?? 100;

  // ── Core drag computation (pure function) ──────────────────────
  const computeNewCrop = useCallback((
    handle: HandleType,
    start: DragState['startCrop'],
    dx: number,   // deltas already in % of overlay
    dy: number,
    overlayW: number,
    overlayH: number,
    asp?: number
  ): { x: number; y: number; width: number; height: number } => {
    let { x, y, width, height } = start;
    const minW = (20 / overlayW) * 100;
    const minH = (20 / overlayH) * 100;

    switch (handle) {
      case 'move':
        x = Math.max(0, Math.min(100 - width, start.x + dx));
        y = Math.max(0, Math.min(100 - height, start.y + dy));
        break;
      case 'tl': {
        const nx = Math.max(0, Math.min(start.x + start.width - minW, start.x + dx));
        const ny = Math.max(0, Math.min(start.y + start.height - minH, start.y + dy));
        width = start.width - (nx - start.x);
        height = start.height - (ny - start.y);
        x = nx; y = ny;
        break;
      }
      case 'tr': {
        const ny = Math.max(0, Math.min(start.y + start.height - minH, start.y + dy));
        height = start.height - (ny - start.y);
        width = Math.max(minW, Math.min(100 - start.x, start.width + dx));
        y = ny;
        break;
      }
      case 'bl': {
        const nx = Math.max(0, Math.min(start.x + start.width - minW, start.x + dx));
        width = start.width - (nx - start.x);
        height = Math.max(minH, Math.min(100 - start.y, start.height + dy));
        x = nx;
        break;
      }
      case 'br':
        width = Math.max(minW, Math.min(100 - start.x, start.width + dx));
        height = Math.max(minH, Math.min(100 - start.y, start.height + dy));
        break;
      case 't': {
        const ny = Math.max(0, Math.min(start.y + start.height - minH, start.y + dy));
        height = start.height - (ny - start.y);
        y = ny;
        break;
      }
      case 'b':
        height = Math.max(minH, Math.min(100 - start.y, start.height + dy));
        break;
      case 'l': {
        const nx = Math.max(0, Math.min(start.x + start.width - minW, start.x + dx));
        width = start.width - (nx - start.x);
        x = nx;
        break;
      }
      case 'r':
        width = Math.max(minW, Math.min(100 - start.x, start.width + dx));
        break;
    }

    // ── Aspect ratio enforcement ─────────────────────────────────
    if (asp && handle !== 'move') {
      const pxW = width * overlayW;
      const pxH = height * overlayH;
      if (['t', 'b'].includes(handle)) {
        const newPxW = pxH * asp;
        const newW = newPxW / overlayW;
        const diff = newW - width;
        x = Math.max(0, x - diff / 2);
        width = newW;
      } else if (['l', 'r'].includes(handle)) {
        const newPxH = pxW / asp;
        const newH = newPxH / overlayH;
        const diff = newH - height;
        y = Math.max(0, y - diff / 2);
        height = newH;
      } else {
        // corner — drive from whichever axis changed more
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (absDx >= absDy) {
          const newPxH = (width * overlayW) / asp;
          height = newPxH / overlayH;
        } else {
          const newPxW = (height * overlayH) * asp;
          width = newPxW / overlayW;
        }
        if (['tl', 'tr'].includes(handle)) y = start.y + start.height - height;
        if (['tl', 'bl'].includes(handle)) x = start.x + start.width - width;
      }
      // Final clamp
      x = Math.max(0, Math.min(100 - width, x));
      y = Math.max(0, Math.min(100 - height, y));
      width = Math.min(100 - x, Math.max(minW, width));
      height = Math.min(100 - y, Math.max(minH, height));
    }

    return { x, y, width, height };
  }, []);

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

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [onChange, onComplete, aspect, computeNewCrop]);

  // ── Render ──────────────────────────────────────────────────────
  // Scrim panels (4 rects covering outside-crop area)
  const scrimStyle = 'absolute bg-black/55 pointer-events-none transition-none';

  // Corner handle renderer — Lightroom-style L shape
  const Corner = ({ pos, cursor, handle }: { pos: 'tl'|'tr'|'bl'|'br'; cursor: string; handle: HandleType }) => {
    const isLeft = pos.endsWith('l');
    const isTop  = pos.startsWith('t');
    return (
      <div
        onPointerDown={startDrag(handle)}
        className="absolute w-8 h-8 z-20"
        style={{
          cursor,
          [isLeft ? 'left' : 'right']: '-4px',
          [isTop  ? 'top'  : 'bottom']: '-4px',
          touchAction: 'none',
        }}
      >
        {/* horizontal arm */}
        <div className="absolute bg-white rounded-sm" style={{
          width: 18, height: 3,
          [isLeft ? 'left' : 'right']: 0,
          [isTop  ? 'top'  : 'bottom']: 0,
        }} />
        {/* vertical arm */}
        <div className="absolute bg-white rounded-sm" style={{
          width: 3, height: 18,
          [isLeft ? 'left' : 'right']: 0,
          [isTop  ? 'top'  : 'bottom']: 0,
        }} />
      </div>
    );
  };

  // Edge handle renderer — pill shape
  const Edge = ({ side, handle }: { side: 't'|'b'|'l'|'r'; handle: HandleType }) => {
    const isHoriz = side === 't' || side === 'b';
    return (
      <div
        onPointerDown={startDrag(handle)}
        className="absolute z-20 flex items-center justify-center"
        style={{
          cursor: isHoriz ? 'ns-resize' : 'ew-resize',
          touchAction: 'none',
          ...(side === 't' ? { top: -8, left: '50%', transform: 'translateX(-50%)', width: 44, height: 16 } :
              side === 'b' ? { bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 44, height: 16 } :
              side === 'l' ? { left: -8, top: '50%', transform: 'translateY(-50%)', width: 16, height: 44 } :
                             { right: -8, top: '50%', transform: 'translateY(-50%)', width: 16, height: 44 }),
        }}
      >
        <div className="bg-white rounded-full" style={
          isHoriz ? { width: 28, height: 3 } : { width: 3, height: 28 }
        } />
      </div>
    );
  };

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0"
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
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

  const [cropDimensions, setCropDimensions] = useState({ width: 0, height: 0 });
  const [innerHeight, setInnerHeight] = useState<number | undefined>(undefined);
  const [innerWidth, setInnerWidth] = useState<number | undefined>(undefined);
  const [dimensionsReady, setDimensionsReady] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const filters = [
    file.edits.filter !== 'none' ? file.edits.filter : '',
  ].filter(Boolean).join(' ');

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
