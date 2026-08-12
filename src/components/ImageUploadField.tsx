"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

type Props = {
  name: string;
  accept?: string;
  multiple?: boolean;
  capture?: "environment" | "user";
  required?: boolean;
  existingImages?: string[];
  existingFieldName?: string;
  removeLabel: string;
  className?: string;
};

export default function ImageUploadField({
  name,
  accept = "image/*",
  multiple = true,
  capture,
  required,
  existingImages = [],
  existingFieldName,
  removeLabel,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [kept, setKept] = useState(existingImages);
  const [files, setFiles] = useState<File[]>([]);
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  function syncInput(nextFiles: File[]) {
    const dataTransfer = new DataTransfer();
    nextFiles.forEach((file) => dataTransfer.items.add(file));
    if (inputRef.current) inputRef.current.files = dataTransfer.files;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const next = multiple ? [...files, ...picked] : picked;
    setFiles(next);
    syncInput(next);
  }

  function removeNewFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    syncInput(next);
  }

  function removeExistingImage(src: string) {
    setKept((prev) => prev.filter((url) => url !== src));
  }

  const hasAny = kept.length > 0 || files.length > 0;

  return (
    <div>
      {existingFieldName && (
        <input type="hidden" name={existingFieldName} value={JSON.stringify(kept)} />
      )}
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept={accept}
        capture={capture}
        multiple={multiple}
        required={required && !hasAny}
        onChange={handleChange}
        className={className}
      />
      {hasAny && (
        <div className="mt-3 flex flex-wrap gap-2">
          {kept.map((src) => (
            <div key={src} className="group relative h-16 w-24 overflow-hidden rounded-md bg-placeholder">
              <Image src={src} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeExistingImage(src)}
                aria-label={removeLabel}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
          {previews.map((src, i) => (
            <div key={src} className="group relative h-16 w-24 overflow-hidden rounded-md bg-placeholder">
              <Image src={src} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => removeNewFile(i)}
                aria-label={removeLabel}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
