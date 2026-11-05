// DeleteConfirmModal.tsx — Quick confirmation modal for destructive delete action
// Adheres to UI/UX Pro Max: Prevents accidental deletions, clear touch targets, accessible focus

import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { Task } from '../types/task';

interface DeleteConfirmModalProps {
  task: Task | null;
  onConfirm: (id: string) => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ task, onConfirm, onCancel }: DeleteConfirmModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (task) {
      cancelBtnRef.current?.focus();
    }
  }, [task]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (task) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, onCancel]);

  if (!task) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-desc"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} strokeWidth={2.2} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 id="delete-dialog-title" className="text-[16px] font-bold text-[#191c1e] leading-tight">
              Delete Task?
            </h3>
            <p id="delete-dialog-desc" className="text-[13px] text-[#505f76] mt-1 line-clamp-2 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#191c1e]">"{task.title}"</strong>?
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#505f76] hover:bg-[#eceef0] active:scale-95 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="h-11 min-h-[44px] px-4 rounded-xl bg-[#f2f4f6] text-[#191c1e] text-[13px] font-semibold hover:bg-[#eceef0] active:scale-98 transition-all flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(task.id)}
            className="h-11 min-h-[44px] px-4 rounded-xl bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Trash2 size={15} strokeWidth={2.2} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
