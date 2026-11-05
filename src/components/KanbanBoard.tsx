// KanbanBoard.tsx — Mobile-first segmented tab bar board with enhanced Empty States
// Adheres to UI/UX Pro Max: Contextual illustration, guidance action, and smooth transitions

import { useState } from 'react';
import { Clock, Inbox, Plus, Sparkles } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../types/task';
import { STATUS_ORDER, STATUS_LABELS } from '../types/task';

interface KanbanBoardProps {
  tasks: Task[];
  countByStatus: Record<TaskStatus, number>;
  onMove: (id: string, direction: 'forward' | 'backward') => void;
  onDeleteRequest: (task: Task) => void;
  onOpenNewTask?: () => void;
}

const STATUS_ACCENTS: Record<TaskStatus, { dot: string; label: string }> = {
  TODO: {
    dot: 'bg-[#505f76]',
    label: 'To do',
  },
  IN_PROGRESS: {
    dot: 'bg-amber-500',
    label: 'In progress',
  },
  DONE: {
    dot: 'bg-emerald-500',
    label: 'Done',
  },
};

export function KanbanBoard({
  tasks,
  countByStatus,
  onMove,
  onDeleteRequest,
  onOpenNewTask,
}: KanbanBoardProps) {
  const [activeLane, setActiveLane] = useState<TaskStatus>('TODO');
  const activeTasks = tasks.filter((t) => t.status === activeLane);

  return (
    <div className="flex flex-col flex-1 pb-24">
      {/* Mobile Segmented Control Tab Switcher */}
      <div className="px-4 py-3 sticky top-[138px] z-20 bg-[#f7f9fb]/95 backdrop-blur-md">
        <div
          className="grid grid-cols-3 p-1 rounded-xl bg-[#e6e8ea] gap-1 shadow-inner"
          role="tablist"
          aria-label="Kanban board columns"
        >
          {STATUS_ORDER.map((status) => {
            const isActive = activeLane === status;
            const count = countByStatus[status];
            return (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`lane-panel-${status}`}
                onClick={() => setActiveLane(status)}
                className={`
                  flex items-center justify-center gap-1.5 h-10 rounded-lg text-[13px] font-semibold
                  transition-all duration-150 active:scale-98
                  ${
                    isActive
                      ? 'bg-white text-[#191c1e] shadow-sm'
                      : 'text-[#505f76] hover:text-[#191c1e]'
                  }
                `}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_ACCENTS[status].dot}`} />
                <span>{STATUS_LABELS[status]}</span>
                <span
                  className={`
                    px-2 py-0.5 rounded-full text-[11px] font-mono leading-none
                    ${isActive ? 'bg-[#f2f4f6] text-[#191c1e]' : 'bg-[#d8dadc] text-[#505f76]'}
                  `}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lane Content Panel */}
      <section
        id={`lane-panel-${activeLane}`}
        role="tabpanel"
        aria-label={`${STATUS_LABELS[activeLane]} column`}
        className="px-4 flex-1 flex flex-col animate-in fade-in-50 duration-200"
      >
        {/* Lane Subheader */}
        <div className="flex items-center justify-between pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_ACCENTS[activeLane].dot}`} />
            <h2 className="text-[15px] font-bold text-[#191c1e]">
              {STATUS_LABELS[activeLane]}
            </h2>
          </div>
          <span className="text-[12px] text-[#505f76] font-medium font-mono">
            {activeTasks.length} {activeTasks.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Polished Empty States per Status Column */}
        {activeTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl bg-white border border-[#e0e3e5] shadow-sm mt-1 animate-in zoom-in-95 duration-200">
            {activeLane === 'TODO' && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mb-3.5 shadow-inner">
                  <Inbox size={26} strokeWidth={1.75} />
                </div>
                <h3 className="text-[15px] font-bold text-[#191c1e] mb-1">
                  Backlog is Empty
                </h3>
                <p className="text-[13px] text-[#505f76] max-w-xs leading-relaxed mb-4">
                  All caught up! Create a new sprint task to start planning your academic milestones.
                </p>
                {onOpenNewTask && (
                  <button
                    type="button"
                    onClick={onOpenNewTask}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f172a] text-white text-[13px] font-semibold hover:bg-[#1e293b] active:scale-95 transition-all shadow-sm"
                  >
                    <Plus size={16} strokeWidth={2.2} />
                    <span>Create New Task</span>
                  </button>
                )}
              </>
            )}

            {activeLane === 'IN_PROGRESS' && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3.5 shadow-inner">
                  <Clock size={26} strokeWidth={1.75} />
                </div>
                <h3 className="text-[15px] font-bold text-[#191c1e] mb-1">
                  No Active Tasks
                </h3>
                <p className="text-[13px] text-[#505f76] max-w-xs leading-relaxed mb-3">
                  Ready to start working? Pick a task from the <strong className="text-[#191c1e]">"To do"</strong> tab and tap <strong className="text-[#191c1e]">"Start Sprint"</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveLane('TODO')}
                  className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-4 py-1"
                >
                  View To Do Column &rarr;
                </button>
              </>
            )}

            {activeLane === 'DONE' && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3.5 shadow-inner">
                  <Sparkles size={26} strokeWidth={1.75} />
                </div>
                <h3 className="text-[15px] font-bold text-[#191c1e] mb-1">
                  No Completed Tasks Yet
                </h3>
                <p className="text-[13px] text-[#505f76] max-w-xs leading-relaxed">
                  Finish active assignments and tasks to watch your sprint velocity grow!
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3" role="list">
            {activeTasks.map((task) => (
              <div key={task.id} role="listitem">
                <TaskCard
                  task={task}
                  onMove={onMove}
                  onDeleteRequest={onDeleteRequest}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
