"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 4;
const ACCEPT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ACCEPT_INPUT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

function extMime(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
}

function isAllowedFile(file: File): boolean {
  if (file.type && ACCEPT_TYPES.has(file.type)) return true;
  const m = extMime(file.name);
  return m !== null;
}

function computeMergedFiles(
  prev: File[],
  incoming: File[]
): { next: File[]; hint: string | null } {
  const base = [...prev];
  const next = [...base];
  let hint: string | null = null;
  for (const f of incoming) {
    if (!isAllowedFile(f)) {
      hint = "Only JPG, PNG, or WEBP images are allowed.";
      continue;
    }
    if (f.size > MAX_BYTES) {
      hint = "Each file must be 10MB or smaller.";
      continue;
    }
    if (next.length >= MAX_FILES) {
      hint = `You can upload up to ${MAX_FILES} photos.`;
      break;
    }
    next.push(f);
  }
  return { next, hint };
}

function ThumbnailPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => {
      URL.revokeObjectURL(u);
    };
  }, [file]);

  if (!url) {
    return (
      <div className="relative aspect-square border border-vynl-gray-200 bg-vynl-smoke animate-pulse" />
    );
  }

  return (
    <div className="relative aspect-square border border-vynl-gray-200 bg-vynl-smoke overflow-hidden group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="w-full h-full object-cover" />
      <button
        type="button"
        aria-label="Remove photo"
        onClick={onRemove}
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-vynl-black/80 text-vynl-white text-lg leading-none hover:bg-vynl-black transition-colors"
      >
        ×
      </button>
    </div>
  );
}

export interface InspoStepProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onBack: () => void;
  onContinue: () => void;
}

export function InspoStep({
  files,
  setFiles,
  onBack,
  onContinue,
}: InspoStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(files);
  filesRef.current = files;
  const [dragOver, setDragOver] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const list = files;
  const canContinue = files.length >= 1;

  const mergeNewFiles = useCallback(
    (incoming: File[]) => {
      const { next, hint: h } = computeMergedFiles(filesRef.current, incoming);
      setHint(h);
      setFiles(next);
    },
    [setFiles]
  );

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    if (picked.length) mergeNewFiles(picked);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) mergeNewFiles(dropped);
  }

  function removeAt(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleContinue() {
    if (!canContinue) return;
    onContinue();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl text-vynl-black mb-2">Share your inspo</h2>
        <p className="text-sm font-sans text-vynl-gray-500 font-light leading-relaxed">
          Upload 1–4 photos of nail styles you love — at least one is required before you can pay your
          deposit. This helps us prepare before your appointment.
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          "border-2 border-dashed px-6 py-12 flex flex-col items-center justify-center gap-4 text-center transition-colors cursor-pointer",
          dragOver ? "border-vynl-black bg-vynl-smoke" : "border-vynl-gray-200 bg-vynl-white"
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_INPUT}
          multiple
          className="sr-only"
          aria-label="Upload inspiration photos"
          onChange={onInputChange}
        />
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-vynl-gray-300">
          <path d="M12 16V8M8 12l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
        <div>
          <p className="text-sm font-sans text-vynl-black font-light">
            Drag and drop images here
          </p>
          <p className="text-xs font-sans text-vynl-gray-400 mt-1">JPG, PNG, or WEBP · up to 10MB each · max 4</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          className="px-5 py-2.5 text-2xs font-sans font-medium tracking-widest uppercase border border-vynl-black text-vynl-black hover:bg-vynl-black hover:text-vynl-white transition-colors"
        >
          Browse files
        </button>
      </div>

      {hint && (
        <p className="text-xs font-sans text-amber-800 bg-amber-50 px-4 py-2 border border-amber-100">{hint}</p>
      )}

      {list.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {list.map((file, index) => (
            <ThumbnailPreview
              key={`${file.name}-${file.size}-${index}`}
              file={file}
              onRemove={() => removeAt(index)}
            />
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-4 text-sm font-sans font-medium tracking-widest uppercase border border-vynl-gray-200 text-vynl-gray-600 hover:border-vynl-gray-400 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className={cn(
            "flex-1 py-4 text-sm font-sans font-medium tracking-widest uppercase transition-all",
            canContinue
              ? "bg-vynl-black text-vynl-white hover:bg-vynl-gray-900"
              : "bg-vynl-gray-100 text-vynl-gray-400 cursor-not-allowed"
          )}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
