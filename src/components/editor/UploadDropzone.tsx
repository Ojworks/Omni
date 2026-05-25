import React, { useCallback, useRef } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface UploadDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  className?: string;
  isCompact?: boolean;
}

export function UploadDropzone({ onFilesAccepted, className, isCompact = false }: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      const validFiles = filesArray.filter((file) => file.type.startsWith("image/") || file.type === "application/pdf");
      if (validFiles.length > 0) {
        onFilesAccepted(validFiles);
      }
    },
    [onFilesAccepted]
  );

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const filesArray = Array.from(e.target.files) as File[];
        const validFiles = filesArray.filter((file) => file.type.startsWith("image/") || file.type === "application/pdf");
        if (validFiles.length > 0) {
          onFilesAccepted(validFiles);
        }
      }
    },
    [onFilesAccepted]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={cn(
        "group relative flex w-full cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed transition-all duration-200",
        isDragging 
          ? "border-accent bg-accent/10" 
          : "border-border hover:border-fg bg-surface/50",
        isCompact ? "h-24 p-4" : "h-64 p-8",
        className
      )}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept="image/*,application/pdf"
        multiple
        className="hidden"
      />
      <div className="pointer-events-none flex flex-col items-center">
        <div className={cn("rounded border border-border bg-surface p-4 text-muted group-hover:text-accent group-hover:border-accent transition-colors", isCompact ? "mb-2 p-2" : "mb-6")}>
          <UploadCloud className={cn(isCompact ? "h-4 w-4" : "h-8 w-8")} />
        </div>
        <p className="mb-2 text-center text-xs font-black uppercase tracking-[0.1em]">
          {isCompact ? "Add images" : "Drop images here, or click to browse"}
        </p>
        {!isCompact && (
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted">Supports JPG, PNG, WEBP, PDF</p>
        )}
      </div>
    </div>
  );
}
