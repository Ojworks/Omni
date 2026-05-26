import React, { useRef, useEffect, useState } from 'react';
import { type Crop } from 'react-image-crop';

type HandleType = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

interface CropOverlayProps {
  crop: Crop;
  aspect?: number;
  onChange: (crop: Crop) => void;
  onComplete: (crop: Crop) => void;
  isMobile?: boolean;
}

export function CropOverlay({ crop, aspect, onChange, onComplete, isMobile = false }: CropOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStateRef = useRef<{
    handle: HandleType;
    startX: number;
    startY: number;
    startCrop: { x: number; y: number; w: number; h: number };
    containerW: number;
    containerH: number;
  } | null>(null);

  const x = crop.x ?? 0;
  const y = crop.y ?? 0;
  const w = crop.width ?? 100;
  const h = crop.height ?? 100;

  // Apply aspect ratio when it changes
  useEffect(() => {
    if (!aspect || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const pxW = (w / 100) * rect.width;
    const pxH = pxW / aspect;
    const newH = (pxH / rect.height) * 100;
    const clampedH = Math.min(100, Math.max(5, newH));
    const newY = Math.max(0, Math.min(100 - clampedH, y + (h - clampedH) / 2));
    onChange({ unit: '%', x, y: newY, width: w, height: clampedH });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect]);

  const startDrag = (handle: HandleType) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!overlayRef.current) return;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const rect = overlayRef.current.getBoundingClientRect();
    dragStateRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { x, y, w, h },
      containerW: rect.width,
      containerH: rect.height,
    };
    setDragging(true);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state) return;

      const dx = ((e.clientX - state.startX) / state.containerW) * 100;
      const dy = ((e.clientY - state.startY) / state.containerH) * 100;

      let { x: nx, y: ny, w: nw, h: nh } = state.startCrop;
      const minSize = isMobile ? 10 : 5;

      switch (state.handle) {
        case 'move':
          nx = Math.max(0, Math.min(100 - nw, state.startCrop.x + dx));
          ny = Math.max(0, Math.min(100 - nh, state.startCrop.y + dy));
          break;
        case 'nw':
          nx = Math.max(0, Math.min(state.startCrop.x + state.startCrop.w - minSize, state.startCrop.x + dx));
          ny = Math.max(0, Math.min(state.startCrop.y + state.startCrop.h - minSize, state.startCrop.y + dy));
          nw = state.startCrop.w - (nx - state.startCrop.x);
          nh = state.startCrop.h - (ny - state.startCrop.y);
          break;
        case 'ne':
          ny = Math.max(0, Math.min(state.startCrop.y + state.startCrop.h - minSize, state.startCrop.y + dy));
          nw = Math.max(minSize, Math.min(100 - state.startCrop.x, state.startCrop.w + dx));
          nh = state.startCrop.h - (ny - state.startCrop.y);
          break;
        case 'sw':
          nx = Math.max(0, Math.min(state.startCrop.x + state.startCrop.w - minSize, state.startCrop.x + dx));
          nw = state.startCrop.w - (nx - state.startCrop.x);
          nh = Math.max(minSize, Math.min(100 - state.startCrop.y, state.startCrop.h + dy));
          break;
        case 'se':
          nw = Math.max(minSize, Math.min(100 - state.startCrop.x, state.startCrop.w + dx));
          nh = Math.max(minSize, Math.min(100 - state.startCrop.y, state.startCrop.h + dy));
          break;
        case 'n':
          ny = Math.max(0, Math.min(state.startCrop.y + state.startCrop.h - minSize, state.startCrop.y + dy));
          nh = state.startCrop.h - (ny - state.startCrop.y);
          break;
        case 's':
          nh = Math.max(minSize, Math.min(100 - state.startCrop.y, state.startCrop.h + dy));
          break;
        case 'w':
          nx = Math.max(0, Math.min(state.startCrop.x + state.startCrop.w - minSize, state.startCrop.x + dx));
          nw = state.startCrop.w - (nx - state.startCrop.x);
          break;
        case 'e':
          nw = Math.max(minSize, Math.min(100 - state.startCrop.x, state.startCrop.w + dx));
          break;
      }

      // Apply aspect ratio constraint
      if (aspect && state.handle !== 'move') {
        const pxW = (nw / 100) * state.containerW;
        const pxH = (nh / 100) * state.containerH;
        
        if (state.handle === 'n' || state.handle === 's') {
          const targetPxW = pxH * aspect;
          nw = (targetPxW / state.containerW) * 100;
          nx = Math.max(0, Math.min(100 - nw, nx + (state.startCrop.w - nw) / 2));
        } else if (state.handle === 'e' || state.handle === 'w') {
          const targetPxH = pxW / aspect;
          nh = (targetPxH / state.containerH) * 100;
          ny = Math.max(0, Math.min(100 - nh, ny + (state.startCrop.h - nh) / 2));
        } else {
          // Corner handles
          const targetPxH = pxW / aspect;
          nh = (targetPxH / state.containerH) * 100;
          if (state.handle === 'nw' || state.handle === 'ne') {
            ny = state.startCrop.y + state.startCrop.h - nh;
          }
          if (state.handle === 'nw' || state.handle === 'sw') {
            nx = state.startCrop.x + state.startCrop.w - nw;
          }
        }

        // Final clamp
        nx = Math.max(0, Math.min(100 - nw, nx));
        ny = Math.max(0, Math.min(100 - nh, ny));
        nw = Math.max(minSize, Math.min(100 - nx, nw));
        nh = Math.max(minSize, Math.min(100 - ny, nh));
      }

      onChange({ unit: '%', x: nx, y: ny, width: nw, height: nh });
    };

    const onUp = () => {
      if (!dragStateRef.current) return;
      onComplete({ unit: '%', x, y, width: w, height: h });
      dragStateRef.current = null;
      setDragging(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [x, y, w, h, aspect, onChange, onComplete, isMobile]);

  const handleSize = isMobile ? 18 : 16;
  const cornerSize = isMobile ? 22 : 20;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0"
      style={{ 
        touchAction: 'none', 
        cursor: dragging ? 'grabbing' : 'default',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* Darkened areas outside crop */}
      <div className="absolute bg-black/60 pointer-events-none" style={{ top: 0, left: 0, right: 0, height: `${y}%` }} />
      <div className="absolute bg-black/60 pointer-events-none" style={{ bottom: 0, left: 0, right: 0, height: `${100 - y - h}%` }} />
      <div className="absolute bg-black/60 pointer-events-none" style={{ top: `${y}%`, left: 0, width: `${x}%`, height: `${h}%` }} />
      <div className="absolute bg-black/60 pointer-events-none" style={{ top: `${y}%`, right: 0, width: `${100 - x - w}%`, height: `${h}%` }} />

      {/* Crop box */}
      <div
        className="absolute"
        style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
      >
        {/* Border */}
        <div className="absolute inset-0 border-2 border-white pointer-events-none" />

        {/* Grid (visible when dragging) */}
        {dragging && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute border-l border-white/40" style={{ left: '33.33%', top: 0, bottom: 0 }} />
            <div className="absolute border-l border-white/40" style={{ left: '66.66%', top: 0, bottom: 0 }} />
            <div className="absolute border-t border-white/40" style={{ top: '33.33%', left: 0, right: 0 }} />
            <div className="absolute border-t border-white/40" style={{ top: '66.66%', left: 0, right: 0 }} />
          </div>
        )}

        {/* Move handle (entire box) */}
        <div
          className="absolute inset-0"
          style={{ 
            touchAction: 'none', 
            zIndex: 1,
            cursor: dragging ? 'grabbing' : 'move',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
          onPointerDown={startDrag('move')}
        />

        {/* Corner handles */}
        {(['nw', 'ne', 'sw', 'se'] as const).map(pos => (
          <div
            key={pos}
            onPointerDown={startDrag(pos)}
            className="absolute bg-white rounded-full"
            style={{
              width: cornerSize,
              height: cornerSize,
              [pos.includes('n') ? 'top' : 'bottom']: -cornerSize / 2,
              [pos.includes('w') ? 'left' : 'right']: -cornerSize / 2,
              cursor: `${pos}-resize`,
              touchAction: 'none',
              border: '2px solid rgba(0,0,0,0.5)',
              zIndex: 10,
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
            }}
          />
        ))}

        {/* Edge handles */}
        {(['n', 's', 'e', 'w'] as const).map(side => {
          const isVert = side === 'n' || side === 's';
          return (
            <div
              key={side}
              onPointerDown={startDrag(side)}
              className="absolute bg-white rounded-full"
              style={{
                [side === 'n' ? 'top' : side === 's' ? 'bottom' : side === 'w' ? 'left' : 'right']: -handleSize / 2,
                [isVert ? 'left' : 'top']: '50%',
                [isVert ? 'width' : 'height']: handleSize * 1.5,
                [isVert ? 'height' : 'width']: handleSize,
                transform: isVert ? 'translateX(-50%)' : 'translateY(-50%)',
                cursor: `${side}-resize`,
                touchAction: 'none',
                border: '2px solid rgba(0,0,0,0.5)',
                zIndex: 10,
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
