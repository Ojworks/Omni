import React, { useRef, useEffect, useState } from 'react';
import { type Crop } from 'react-image-crop';
import { WorkspaceFile, FILTERS } from '@/src/types';
import { motion } from 'motion/react';
import { ProcessingOverlay } from './ProcessingOverlay';
import { useIsMobile } from '@/src/lib/hooks';
import { CropOverlay } from './CropOverlay';

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

  // When entering crop mode with a rotated image, we display it in its original
  // (unrotated) orientation so the crop overlay's percentage coordinates map
  // directly to the image. The rotation is re-applied after cropping is done
  // (via processImage which bakes rotation into the intermediate canvas).

  return (
    <div ref={containerRef} className={`flex-1 flex items-center justify-center p-3 md:p-12 relative bg-bg ${isCropActive ? 'overflow-visible' : 'overflow-hidden'} ${className}`}>
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
            /* ── Crop mode: image reverts to original orientation so the crop
                 overlay's percentage coordinates map directly to the image.
                 Rotation is re-applied after committing the crop. ── */
            <div className="relative" style={{ display: 'inline-flex', lineHeight: 0, touchAction: 'none', isolation: 'isolate' }}>
              <motion.img
                ref={imgRef}
                src={file.originalUrl}
                onLoad={onImgLoad}
                animate={{
                  scaleX: file.edits.flipX ? -1 : 1,
                  scaleY: file.edits.flipY ? -1 : 1,
                }}
                transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                style={{
                  filter: filters,
                  ...constrainedImgStyle(),
                  pointerEvents: 'none',
                }}
                alt="Cropping"
                className="shadow-2xl rounded-sm bg-checkerboard"
                draggable={false}
              />
              <CropOverlay
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
