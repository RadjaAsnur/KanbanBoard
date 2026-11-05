// Header.tsx — App header with progress counter + priority quick filter
// Visual fidelity: Stitch Screen 04 ("CampusSprint Sprint 04", Synced status, progress)

import { CheckCircle2, RotateCcw, Terminal } from 'lucide-react';
import type { PriorityFilter, ProgressStats } from '../hooks/useTasks';

interface HeaderProps {
  progress: ProgressStats;
  priorityFilter: PriorityFilter;
  onFilterChange: (f: PriorityFilter) => void;
  onReset?: () => void;
}

const FILTER_OPTIONS: { label: string; value: PriorityFilter; dotColor: string }[] = [
  { label: 'All', value: 'ALL', dotColor: 'bg-slate-400' },
  { label: 'High', value: 'HIGH', dotColor: 'bg-red-500' },
  { label: 'Medium', value: 'MEDIUM', dotColor: 'bg-amber-500' },
  { label: 'Low', value: 'LOW', dotColor: 'bg-emerald-500' },
];

export function Header({ progress, priorityFilter, onFilterChange, onReset }: HeaderProps) {
  const { doneCount, totalCount, percentage } = progress;

  return (
    <header className="sticky top-0 z-30 bg-[#f7f9fb]/95 backdrop-blur-md border-b border-[#e0e3e5] pt-safe shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
      {/* Top Navbar */}
      <div className="h-14 px-4 flex items-center justify-between gap-3">
        {/* Brand Logo & Sprint Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 bg-[#0f172a] rounded-lg flex items-center justify-center shrink-0 shadow-sm"
            aria-hidden="true"
          >
            <Terminal size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] font-bold text-[#191c1e] tracking-tight truncate">
              CampusSprint
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-[#eceef0] text-[11px] font-semibold text-[#505f76] shrink-0 font-mono">
              Sprint 04
            </span>
          </div>
        </div>

        {/* Sync Status & Reset Control */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f2f4f6] border border-[#e0e3e5]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-[#505f76]">Synced</span>
          </div>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="p-1.5 rounded-lg text-[#505f76] hover:bg-[#eceef0] hover:text-[#191c1e] transition-colors active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Reset sample data"
              aria-label="Reset sample data"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Progress & Context Bar */}
      <div className="px-4 pb-2.5 pt-1">
        <div className="flex items-center justify-between text-[12px] mb-1.5">
          <div className="flex items-center gap-1.5 font-medium text-[#191c1e]">
            <span>Sprint Progress</span>
            <span className="text-[#505f76] font-normal">({percentage}%)</span>
          </div>
          <div className="flex items-center gap-1 text-[#505f76] font-semibold">
            <CheckCircle2 size={13} className={percentage === 100 ? 'text-emerald-600' : 'text-[#505f76]'} />
            <span>{doneCount}</span>
            <span className="text-slate-400 font-normal">/{totalCount} Done</span>
          </div>
        </div>

        {/* Accessible Progress Bar */}
        <div
          className="h-1.5 w-full rounded-full bg-[#e0e3e5] overflow-hidden"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Overall sprint progress: ${doneCount} of ${totalCount} tasks completed`}
        >
          <div
            className="h-full rounded-full bg-[#0f172a] transition-all duration-300 ease-out"
            style={{ width: `${Math.max(percentage, totalCount > 0 ? 3 : 0)}%` }}
          />
        </div>
      </div>

      {/* Priority Quick Filter Pills */}
      <div
        className="px-4 pb-3 flex items-center gap-2 overflow-x-auto scrollbar-hide"
        role="group"
        aria-label="Filter tasks by priority"
      >
        <span className="text-[11px] font-semibold text-[#505f76] uppercase tracking-wider mr-1">
          Filter:
        </span>
        {FILTER_OPTIONS.map(({ label, value, dotColor }) => {
          const isActive = priorityFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onFilterChange(value)}
              aria-pressed={isActive}
              className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium
                whitespace-nowrap transition-all duration-150 active:scale-95
                min-h-[32px] min-w-[52px] justify-center
                ${
                  isActive
                    ? 'bg-[#0f172a] text-white shadow-sm ring-1 ring-[#0f172a]'
                    : 'bg-[#eceef0] text-[#505f76] hover:bg-[#e0e3e5] hover:text-[#191c1e]'
                }
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
