import React, { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface FileUploadProps {
  currentImageUrl?: string | null;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  currentImageUrl,
  selectedFile,
  onFileSelect,
  error,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = selectedFile
    ? URL.createObjectURL(selectedFile)
    : currentImageUrl || null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const validateAndSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Maximum file size is 5MB');
      return;
    }
    onFileSelect(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
        Coffee Bag / Beans Photo (multipart/form-data)
      </label>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative cursor-pointer border-2 border-dashed rounded-xl p-4 transition-all flex items-center gap-4 ${
          isDragging
            ? 'border-amber-500 bg-amber-500/10'
            : error
            ? 'border-rose-500/80 bg-rose-950/20'
            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndSelect(e.target.files[0]);
            }
          }}
        />

        {previewUrl ? (
          <div className="flex items-center gap-4 w-full">
            <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-zinc-700">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">
                {selectedFile ? selectedFile.name : 'Current image'}
              </p>
              {selectedFile && (
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </p>
              )}
              <p className="text-[11px] text-amber-400/90 mt-1">
                Click or drag to replace image
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 transition-colors"
              title="Remove selected image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 w-full py-2">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 shrink-0">
              <UploadCloud className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-200">
                Drag and drop image here, or click to browse
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                PNG, JPG, WebP up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
};
