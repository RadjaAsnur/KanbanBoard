// AddTaskModal.tsx & Floating Action Button (+ New Task)
// Visual fidelity: Stitch Screen 06 (New Task Modal, bottom sheet, category domain pills, priority selection)
// UX rules: PRD §2 — Task addition completed in < 3 taps, min 44x44px touch targets

import { useEffect, useRef, useState } from 'react';
import { Calendar, Check, Plus, X } from 'lucide-react';
import type { Task, Priority } from '../types/task';
import { PRIORITY_LABELS, PRIORITY_STYLES } from '../types/task';

type TaskPayload = Omit<Task, 'id' | 'createdAt' | 'status'>;

interface AddTaskModalProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onAdd: (payload: TaskPayload) => void;
}

const CATEGORIES = ['CS-301', 'UI/UX', 'Frontend', 'Backend', 'DevOps', 'General'];
const PRIORITIES: Priority[] = ['HIGH', 'MEDIUM', 'LOW'];

const DUE_OPTIONS = [
  { label: 'Today', value: new Date().toISOString().slice(0, 10) },
  { label: 'Tomorrow', value: new Date(Date.now() + 86400000).toISOString().slice(0, 10) },
  { label: 'In 3 Days', value: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10) },
  { label: 'Next Sprint', value: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) },
];

export function AddTaskModal({ isOpen, onOpen, onClose, onAdd }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('HIGH');
  const [category, setCategory] = useState('UI/UX');
  const [dueDate, setDueDate] = useState(DUE_OPTIONS[1].value);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => titleInputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setTitle('');
      setDescription('');
      setPriority('HIGH');
      setCategory('UI/UX');
      setDueDate(DUE_OPTIONS[1].value);
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    onAdd({
      title: cleanTitle,
      description: description.trim() || undefined,
      priority,
      category,
      dueDate,
    });
    handleClose();
  };

  return (
    <>
      {/* Floating Action Button (FAB) — Tap 1 to Open */}
      <button
        type="button"
        onClick={onOpen}
        className="
          fixed bottom-6 right-4 z-40
          flex items-center gap-2 px-5 h-14 min-h-[48px]
          bg-[#0f172a] text-white
          rounded-full shadow-xl shadow-slate-900/25
          text-[14px] font-semibold tracking-wide
          active:scale-95 transition-all duration-150 hover:bg-[#1e293b]
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0f172a]
        "
        aria-label="Add new sprint task"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Plus size={20} strokeWidth={2.5} />
        <span>New Task</span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Modal Sheet Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`
          fixed inset-x-0 bottom-0 z-50
          w-full max-w-md mx-auto
          bg-white rounded-t-2xl shadow-2xl
          flex flex-col max-h-[85vh] overflow-hidden
          transition-transform duration-250 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'}
        `}
      >
        {/* Drag Handle Bar */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-[#d8dadc]" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-[#e0e3e5] shrink-0">
          <div>
            <h2 id="modal-title" className="text-[17px] font-bold text-[#191c1e] tracking-tight">
              New Sprint Task
            </h2>
            <p className="text-[12px] text-[#505f76] mt-0.5">
              Sprint 04 · Engineering Backlog
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-[#505f76] hover:bg-[#eceef0] active:scale-95 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-4 space-y-4">
          {/* Task Title */}
          <div className="space-y-1.5">
            <label htmlFor="task-title" className="block text-[13px] font-bold text-[#191c1e]">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="task-title"
              type="text"
              required
              autoComplete="off"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement refresh token interceptor"
              className="
                w-full min-h-[46px] px-3.5 py-2.5 rounded-xl
                bg-[#f7f9fb] text-[#191c1e] text-[14px]
                border border-[#e0e3e5] placeholder:text-slate-400
                focus:outline-none focus:border-[#0f172a] focus:bg-white
                transition-all
              "
            />
          </div>

          {/* Category Chips */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-bold text-[#191c1e]">
              Module / Category
            </label>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select category">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`
                      px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all min-h-[36px]
                      ${
                        isSelected
                          ? 'bg-[#0f172a] text-white shadow-sm'
                          : 'bg-[#eceef0] text-[#505f76] hover:bg-[#e0e3e5]'
                      }
                    `}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Level (WCAG AA Compliant) */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-bold text-[#191c1e]">
              Priority Level
            </label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select priority">
              {PRIORITIES.map((p) => {
                const isSelected = priority === p;
                const style = PRIORITY_STYLES[p];
                return (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setPriority(p)}
                    className={`
                      flex items-center justify-center gap-1.5 h-11 min-h-[44px] rounded-xl
                      text-[12px] font-bold transition-all
                      ${
                        isSelected
                          ? `${style.badge} ring-2 ring-current shadow-sm`
                          : 'bg-[#eceef0] text-[#505f76] hover:bg-[#e0e3e5]'
                      }
                    `}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? style.dot : 'bg-slate-400'}`} />
                    <span>{PRIORITY_LABELS[p]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Horizon */}
          <div className="space-y-1.5">
            <label className="block text-[13px] font-bold text-[#191c1e] flex items-center gap-1">
              <Calendar size={14} className="text-[#505f76]" />
              <span>Due Horizon</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DUE_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setDueDate(opt.value)}
                  className={`
                    h-10 min-h-[40px] px-3 rounded-lg text-[12px] font-semibold transition-all
                    ${
                      dueDate === opt.value
                        ? 'bg-[#0f172a] text-white shadow-sm'
                        : 'bg-[#eceef0] text-[#505f76] hover:bg-[#e0e3e5]'
                    }
                  `}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description (Optional) */}
          <div className="space-y-1.5">
            <label htmlFor="task-desc" className="block text-[13px] font-bold text-[#191c1e]">
              Description <span className="text-[#505f76] font-normal">(Optional)</span>
            </label>
            <textarea
              id="task-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief notes or acceptance criteria..."
              className="
                w-full px-3.5 py-2 rounded-xl bg-[#f7f9fb] text-[#191c1e] text-[13px]
                border border-[#e0e3e5] placeholder:text-slate-400 focus:outline-none
                focus:border-[#0f172a] focus:bg-white transition-all resize-none
              "
            />
          </div>

          {/* Action Buttons: Cancel and Create Task (Total < 3 taps to complete) */}
          <div className="pt-2 pb-safe flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="
                flex-1 h-12 min-h-[46px] rounded-xl bg-[#f2f4f6] text-[#505f76]
                text-[14px] font-semibold hover:bg-[#eceef0] active:scale-98 transition-all
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="
                flex-1 h-12 min-h-[46px] rounded-xl bg-[#0f172a] text-white
                text-[14px] font-semibold flex items-center justify-center gap-2
                hover:bg-[#1e293b] active:scale-98 transition-all shadow-md
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <Check size={16} strokeWidth={2.5} />
              <span>Create Task</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
