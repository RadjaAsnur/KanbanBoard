// TaskCard.tsx — Mobile-optimized task card with dynamic category visual badge
// Features: Universal Delete button + Interactive Priority Toggle + Clean Category Pill
// Adheres to WCAG AA color contrast (High, Medium, Low badges) and 44x44px min tap targets

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Check, Trash2, Undo2, Tag } from 'lucide-react';
import type { Task } from '../types/task';
import { PRIORITY_LABELS, PRIORITY_STYLES, NEXT_PRIORITY_CYCLE } from '../types/task';

interface TaskCardProps {
  task: Task;
  onMove: (id: string, direction: 'forward' | 'backward') => void;
  onTogglePriority: (id: string) => void;
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

export function TaskCard({ task, onMove, onTogglePriority, onDeleteRequest }: TaskCardProps) {
  const [transitioning, setTransitioning] = useState<'forward' | 'backward' | null>(null);
  const isDone = task.status === 'DONE';
  const priorityStyle = PRIORITY_STYLES[task.priority];
  const nextPriority = NEXT_PRIORITY_CYCLE[task.priority];
  const dueLabel = formatDueDate(task.dueDate);

  const handleMove = (direction: 'forward' | 'backward') => {
    setTransitioning(direction);
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
      aria-label={`Task: ${task.title}, category ${task.category}, priority ${PRIORITY_LABELS[task.priority]}`}
    >
      {/* Top Meta: Interactive Priority Toggle + Dynamic Category Badge + Due Date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {/* Interactive Priority Toggle Badge */}
          <button
            type="button"
            onClick={() => onTogglePriority(task.id)}
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase
              min-h-[28px] justify-center transition-all duration-150 active:scale-95 cursor-pointer
              ${priorityStyle.badge} hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400
            `}
            title={`Current: ${PRIORITY_LABELS[task.priority]}. Tap to switch to ${PRIORITY_LABELS[nextPriority]}`}
            aria-label={`Priority: ${PRIORITY_LABELS[task.priority]}. Tap to change priority to ${PRIORITY_LABELS[nextPriority]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityStyle.dot}`} />
            <span>{PRIORITY_LABELS[task.priority]}</span>
          </button>

          {/* Dynamic Category Badge with clean styling */}
          {task.category && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#f2f4f6] text-[#38485d] border border-[#e0e3e5] truncate max-w-[140px]"
              title={`Category: ${task.category}`}
            >
              <Tag size={10} className="text-[#505f76] shrink-0" />
              <span className="truncate">{task.category}</span>
            </span>
          )}
        </div>

        {dueLabel && (
          <div className="flex items-center gap-1 text-[#505f76] text-[11px] shrink-0 font-medium">
            <Calendar size={12} aria-hidden="true" />
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

      {/* Action Buttons: Status Navigation + Universal Delete Button (min 44x44px touch targets) */}
      <div className="pt-1 border-t border-[#f2f4f6]">
        {task.status === 'TODO' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMove('forward')}
              className="flex-1 h-11 min-h-[44px] px-4 rounded-lg bg-[#f2f4f6] hover:bg-[#eceef0] text-[#191c1e] text-[13px] font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition-all group"
              aria-label={`Start task: ${task.title}`}
            >
              <span>Start Sprint</span>
              <ArrowRight size={15} strokeWidth={2.2} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteRequest(task)}
              className="h-11 min-h-[44px] w-12 min-w-[44px] rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center active:scale-98 transition-all shrink-0"
              title="Delete task"
              aria-label={`Delete task: ${task.title}`}
            >
              <Trash2 size={16} strokeWidth={2} />
            </button>
          </div>
        )}

        {task.status === 'IN_PROGRESS' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMove('backward')}
              className="flex-1 h-11 min-h-[44px] px-2.5 rounded-lg bg-[#f2f4f6] hover:bg-[#eceef0] text-[#505f76] text-[13px] font-medium flex items-center justify-center gap-1 active:scale-98 transition-all group"
              aria-label={`Move back to To do: ${task.title}`}
            >
              <ArrowLeft size={15} strokeWidth={2} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Revert</span>
            </button>
            <button
              type="button"
              onClick={() => handleMove('forward')}
              className="flex-1 h-11 min-h-[44px] px-2.5 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-white text-[13px] font-semibold flex items-center justify-center gap-1 active:scale-98 transition-all shadow-sm"
              aria-label={`Mark as Done: ${task.title}`}
            >
              <span>Done</span>
              <Check size={15} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => onDeleteRequest(task)}
              className="h-11 min-h-[44px] w-12 min-w-[44px] rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center active:scale-98 transition-all shrink-0"
              title="Delete task"
              aria-label={`Delete task: ${task.title}`}
            >
              <Trash2 size={16} strokeWidth={2} />
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
              className="h-11 min-h-[44px] w-12 min-w-[44px] rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center active:scale-98 transition-all shrink-0"
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
