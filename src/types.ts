import { Crop } from 'react-image-crop';

export type FileFormat = 'original' | 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf';

export interface ImageEdits {
  rotate: number;      // 0, 90, 180, 270
  flipX: boolean;
  flipY: boolean;
  filter: string;      // 'none', 'grayscale', 'sepia', etc.
  crop?: Crop;
  resize?: { width: number; height: number; lockAspect: boolean };
}

export interface WorkspaceFile {
  id: string;
  file: File;
  originalUrl: string; // Object URL of the original file
  previewUrl: string | null;  // Object URL of the currently edited version (if caching needed) or drawn dynamically
  originalWidth: number;
  originalHeight: number;
  edits: ImageEdits;
  history: ImageEdits[]; // for undo
  historyIndex: number;  // current position in history
  outputName: string;
  hasBackgroundRemoved?: boolean;
}

export const defaultEdits: ImageEdits = {
  rotate: 0,
  flipX: false,
  flipY: false,
  filter: 'none',
};

export const FILTERS = [
  { id: 'none', label: 'Original', css: 'none' },
  { id: 'clean-scan', label: 'Clean Scan', css: 'contrast(130%) brightness(110%) saturate(0%)' },
  { id: 'mono-sharp', label: 'Mono Sharp', css: 'grayscale(100%) contrast(180%) brightness(105%)' },
  { id: 'blueprint', label: 'Blueprint', css: 'invert(100%) hue-rotate(190deg) brightness(80%) contrast(120%)' },
  { id: 'vibrant-doc', label: 'Vibrant Doc', css: 'saturate(180%) contrast(110%) brightness(105%)' },
  { id: 'warm-note', label: 'Warm Note', css: 'sepia(30%) brightness(105%) contrast(110%)' },
  { id: 'cool-note', label: 'Cool Note', css: 'hue-rotate(10deg) saturate(90%) brightness(105%)' },
  { id: 'high-contrast', label: 'High Contrast', css: 'contrast(160%) brightness(110%)' },
  { id: 'grayscale', label: 'Grayscale', css: 'grayscale(100%)' },
  { id: 'sepia', label: 'Vintage', css: 'sepia(80%)' },
  { id: 'retro', label: 'Retro Print', css: 'grayscale(100%) contrast(150%) brightness(120%) opacity(90%)' },
  { id: 'soft-fade', label: 'Soft Fade', css: 'blur(0.5px) brightness(110%) opacity(80%)' },
  { id: 'invert', label: 'Invert', css: 'invert(100%)' },
  { id: 'crimson', label: 'Crimson', css: 'hue-rotate(330deg) saturate(160%) contrast(110%) brightness(105%)' },
];
