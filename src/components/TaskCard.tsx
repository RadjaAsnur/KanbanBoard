// TaskCard.tsx — Mobile-optimized task card with micro-interaction state changes
// Adheres to WCAG AA color contrast (High, Medium, Low badges)
// Min touch target 44x44px for action buttons, clear visual feedback

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Check, Trash2, Undo2 } from 'lucide-react';
import type { Task } from '../types/task';
import { PRIORITY_LABELS, PRIORITY_STYLES } from '../types/task';

interface TaskCardProps {
  task: Task;
  onMove: (id: string, direction: 'forward' | 'backward') => void;
  onDeleteRequest: (task: Task) => void;
}

function formatDueDate(dueDate?: string): string {
  if (!dueDate) return '';
  try {
    const target = new Date(dueDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays <= 7) return `In ${diffDays}d`;
    return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dueDate;
  }
}

export function TaskCard({ task, onMove, onDeleteRequest }: TaskCardProps) {
  const [transitioning, setTransitioning] = useState<'forward' | 'backward' | null>(null);
  const isDone = task.status === 'DONE';
  const priorityStyle = PRIORITY_STYLES[task.priority];
  const dueLabel = formatDueDate(task.dueDate);

  const handleMove = (direction: 'forward' | 'backward') => {
    setTransitioning(direction);
    // Smooth transition feedback before updating state
    setTimeout(() => {
      onMove(task.id, direction);
      setTransitioning(null);
    }, 180);
  };

  return (
    <article
      className={`
        bg-white rounded-xl p-3.5 border border-[#e0e3e5] border-l-4 ${priorityStyle.border}
        shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col gap-3
        transition-all duration-200 ease-out
        ${
          transitioning === 'forward'
            ? 'translate-x-4 opacity-0 scale-95'
            : transitioning === 'backward'
            ? '-translate-x-4 opacity-0 scale-95'
            : 'translate-x-0 opacity-100 scale-100'
        }
        ${isDone ? 'opacity-80 bg-[#fcfdfe]' : ''}
        hover:shadow-md
      `}
      aria-label={`Task: ${task.title}, priority ${PRIORITY_LABELS[task.priority]}`}
    >
      {/* Top Meta: Priority Badge + Category / Module + Due Date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`
              px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase
              ${priorityStyle.badge}
            `}
          >
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.category && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#eceef0] text-[#505f76] truncate font-mono">
              {task.category}
            </span>
          )}
        </div>

        {dueLabel && (
          <div className="flex items-center gap-1 text-[#505f76] text-[12px] shrink-0 font-medium">
            <Calendar size={13} aria-hidden="true" />
            <span>{dueLabel}</span>
          </div>
        )}
      </div>

      {/* Task Content */}
      <div className="space-y-1">
        <h3
          className={`
            text-[14px] font-semibold text-[#191c1e] leading-snug line-clamp-2
            ${isDone ? 'line-through text-[#505f76]' : ''}
          `}
        >
          {task.title}
        </h3>
        {task.description && !isDone && (
          <p className="text-[12px] text-[#505f76] line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Action Buttons: 44x44px minimum tap targets with clear micro-interactions */}
      <div className="pt-1 border-t border-[#f2f4f6]">
        {task.status === 'TODO' && (
          <button
            type="button"
            onClick={() => handleMove('forward')}
            className="w-full h-11 min-h-[44px] px-4 rounded-lg bg-[#f2f4f6] hover:bg-[#eceef0] text-[#191c1e] text-[13px] font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition-all group"
            aria-label={`Start task: ${task.title}`}
          >
            <span>Start Sprint</span>
            <ArrowRight size={15} strokeWidth={2.2} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {task.status === 'IN_PROGRESS' && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleMove('backward')}
              className="h-11 min-h-[44px] px-3 rounded-lg bg-[#f2f4f6] hover:bg-[#eceef0] text-[#505f76] text-[13px] font-medium flex items-center justify-center gap-1.5 active:scale-98 transition-all group"
              aria-label={`Move back to To do: ${task.title}`}
            >
              <ArrowLeft size={15} strokeWidth={2} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Revert</span>
            </button>
            <button
              type="button"
              onClick={() => handleMove('forward')}
              className="h-11 min-h-[44px] px-3 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-sm"
              aria-label={`Mark as Done: ${task.title}`}
            >
              <span>Done</span>
              <Check size={15} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {task.status === 'DONE' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMove('backward')}
              className="flex-1 h-11 min-h-[44px] px-3 rounded-lg bg-[#f2f4f6] hover:bg-[#eceef0] text-[#505f76] text-[13px] font-medium flex items-center justify-center gap-1.5 active:scale-98 transition-all group"
              aria-label={`Reopen task: ${task.title}`}
            >
              <Undo2 size={15} strokeWidth={2} className="group-hover:-rotate-45 transition-transform" />
              <span>Reopen</span>
            </button>
            <button
              type="button"
              onClick={() => onDeleteRequest(task)}
              className="h-11 min-h-[44px] w-12 min-w-[44px] rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center active:scale-98 transition-all"
              title="Delete task"
              aria-label={`Delete task: ${task.title}`}
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
