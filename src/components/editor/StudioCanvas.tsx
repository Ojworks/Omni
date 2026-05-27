import { useRef, useEffect, useState } from 'react';
import { type Crop } from 'react-image-crop';
import { WorkspaceFile, FILTERS } from '@/src/types';
import { motion } from 'motion/react';
import { ProcessingOverlay } from './ProcessingOverlay';
import { useIsMobile } from '@/src/lib/hooks';
import { CropOverlay } from './CropOverlay';

interface StudioCanvasProps {
  file: WorkspaceFile;
  isCropActive: boolean;
  cropAspect?: number;
  onCropChange: (crop: Crop) => void;
  onCropComplete: (crop: Crop) => void;
  className?: string;
  isProcessingMagic?: boolean;
}

export function StudioCanvas({ 
  file, 
  isCropActive, 
  cropAspect, 
  onCropChange, 
  onCropComplete, 
  className = '', 
  isProcessingMagic = false 
}: StudioCanvasProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cropDimensions, setCropDimensions] = useState({ width: 0, height: 0 });

  const { rotate, flipX, flipY, filter, crop } = file.edits;
  const filterDef = FILTERS.find(f => f.id === filter);
  const filterCss = filterDef?.css !== 'none' ? filterDef?.css : '';

  const hasTransform = rotate !== 0 || flipX || flipY;

  useEffect(() => {
    setImageLoaded(false);
  }, [file.id]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Render rotated/flipped image to canvas
  useEffect(() => {
    if (!imageLoaded || !imgRef.current || !displayCanvasRef.current) return;
    if (rotate === 0 && !flipX && !flipY) return;

    const img = imgRef.current;
    const canvas = displayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const angle = (rotate * Math.PI) / 180;
    const isRotated = rotate % 180 !== 0;
    
    const outputWidth = isRotated ? img.naturalHeight : img.naturalWidth;
    const outputHeight = isRotated ? img.naturalWidth : img.naturalHeight;
    
    // Use larger dimensions for better quality
    const maxWidth = isMobile ? window.innerWidth * 0.9 : 1600;
    const maxHeight = isMobile ? window.innerHeight * 0.5 : window.innerHeight * 0.8;
    
    const scale = Math.min(1, maxWidth / outputWidth, maxHeight / outputHeight);
    
    canvas.width = Math.round(outputWidth * scale);
    canvas.height = Math.round(outputHeight * scale);

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(angle);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
  }, [imageLoaded, rotate, flipX, flipY, isMobile, file.id]);

  // Crop preview canvas
  useEffect(() => {
    if (!isCropActive || !imgRef.current || !previewCanvasRef.current || !crop || !imageLoaded) return;
    
    const img = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const px = (crop.x / 100) * img.naturalWidth;
    const py = (crop.y / 100) * img.naturalHeight;
    const pw = (crop.width / 100) * img.naturalWidth;
    const ph = (crop.height / 100) * img.naturalHeight;

    const w = Math.round(pw);
    const h = Math.round(ph);
    
    setCropDimensions({ width: w, height: h });

    if (w <= 0 || h <= 0) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, px, py, pw, ph, 0, 0, w, h);
  }, [crop, isCropActive, imageLoaded]);

  const activeCrop: Crop = crop ?? { unit: '%', x: 0, y: 0, width: 100, height: 100 };

  return (
    <div 
      ref={containerRef}
      className={`flex items-center justify-center p-3 md:p-12 relative lg:flex-1 ${className}`}
      style={{
        overflow: isCropActive ? 'visible' : 'hidden',
        overscrollBehavior: isCropActive ? 'none' : undefined,
      }}
    >
      <img 
        ref={imgRef} 
        src={file.originalUrl} 
        onLoad={handleImageLoad}
        onError={handleImageLoad}
        style={{ display: 'none' }} 
        alt="" 
      />

      {isCropActive && (
        <motion.div
          drag
          dragConstraints={containerRef}
          dragMomentum={false}
          className="absolute top-6 right-6 z-50 hidden md:flex flex-col w-60 h-60 rounded-lg shadow-2xl border border-border bg-surface/60 backdrop-blur-md cursor-move"
          style={{ opacity: crop?.width && crop?.height ? 1 : 0 }}
        >
          <div className="bg-surface-hover/80 border-b border-border px-3 py-2 flex justify-between items-center shrink-0 rounded-t-lg">
            <span className="text-[10px] font-bold tracking-widest uppercase text-fg/90">Preview</span>
            {cropDimensions.width > 0 && cropDimensions.height > 0 && (
              <span className="text-[9px] font-mono text-muted">
                {cropDimensions.width} × {cropDimensions.height} px
              </span>
            )}
          </div>
          <div className="flex-1 p-3 flex items-center justify-center overflow-hidden rounded-b-lg">
            <canvas
              ref={previewCanvasRef}
              className="rounded-sm shadow-md max-w-full max-h-full"
              style={{ filter: filterCss }}
            />
          </div>
        </motion.div>
      )}

      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          {hasTransform ? (
            <canvas
              ref={displayCanvasRef}
              className={`${isCropActive ? 'shadow-2xl rounded-sm' : 'rounded-lg shadow-2xl'} bg-checkerboard max-w-full max-h-full`}
              style={{
                filter: filterCss,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          ) : (
            <img
              src={file.originalUrl}
              alt="Preview"
              draggable={false}
              className={`${isCropActive ? 'shadow-2xl rounded-sm' : 'rounded-lg shadow-2xl'} bg-checkerboard max-w-full max-h-full`}
              style={{
                filter: filterCss,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          )}
          {isCropActive && (
            <CropOverlay
              crop={activeCrop}
              aspect={cropAspect}
              onChange={onCropChange}
              onComplete={onCropComplete}
              isMobile={isMobile}
            />
          )}
          <ProcessingOverlay isVisible={isProcessingMagic} />
        </div>
      </div>
    </div>
  );
}
