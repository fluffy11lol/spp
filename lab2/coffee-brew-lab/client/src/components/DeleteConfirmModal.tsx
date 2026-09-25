import React, { useEffect } from 'react';
import { Trash2, X } from 'lucide-react';
import type { Recipe } from '../types/recipe';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  recipe: Recipe | null;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  recipe,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !recipe) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(recipe.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden overscroll-contain"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overscroll-contain"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
          <Trash2 className="w-5 h-5" />
        </div>

        <h3 className="text-base font-bold text-zinc-100 mb-1">Delete Recipe?</h3>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          Are you sure you want to delete <span className="text-zinc-200 font-medium">"{recipe.title}"</span>? This will also permanently remove any uploaded photo from MinIO S3 storage.
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
};
