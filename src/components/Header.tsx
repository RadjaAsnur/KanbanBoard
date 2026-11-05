// Header.tsx — Space-saving compact filter popover UI
// Features: Minimalist trigger buttons, floating popover modal, active indicators, and reset action

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Terminal,
  Copy,
  Check,
  LogOut,
  ChevronDown,
  Flame,
  AlertCircle,
  CheckCircle,
  LayoutGrid,
  Tag,
  SlidersHorizontal,
  X,
  RotateCcw,
} from 'lucide-react';
import type { PriorityFilter, ProgressStats, SyncStatus } from '../hooks/useTasks';

interface HeaderProps {
  progress: ProgressStats;
  priorityFilter: PriorityFilter;
  categoryFilter: string;
  availableCategories: string[];
  boardKey: string;
  syncStatus: SyncStatus;
  onPriorityFilterChange: (f: PriorityFilter) => void;
  onCategoryFilterChange: (cat: string) => void;
  onLeaveBoard: () => void;
}

const PRIORITY_ITEMS: {
  label: string;
  value: PriorityFilter;
  icon: typeof Flame;
  dotColor: string;
  badgeStyle: string;
}[] = [
  {
    label: 'All Priority',
    value: 'ALL',
    icon: LayoutGrid,
    dotColor: 'bg-slate-400',
    badgeStyle: 'bg-slate-900 text-white',
  },
  {
    label: 'High Priority',
    value: 'HIGH',
    icon: Flame,
    dotColor: 'bg-red-500',
    badgeStyle: 'bg-red-100 text-red-800 border border-red-300 font-bold',
  },
  {
    label: 'Medium Priority',
    value: 'MEDIUM',
    icon: AlertCircle,
    dotColor: 'bg-amber-500',
    badgeStyle: 'bg-amber-100 text-amber-800 border border-amber-300 font-bold',
  },
  {
    label: 'Low Priority',
    value: 'LOW',
    icon: CheckCircle,
    dotColor: 'bg-emerald-500',
    badgeStyle: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
  },
];

export function Header({
  progress,
  priorityFilter,
  categoryFilter,
  availableCategories,
  boardKey,
  syncStatus,
  onPriorityFilterChange,
  onCategoryFilterChange,
  onLeaveBoard,
}: HeaderProps) {
  const { doneCount, totalCount, percentage } = progress;
  const [copied, setCopied] = useState(false);
  const [activePopover, setActivePopover] = useState<'priority' | 'category' | null>(null);

  const isPriorityActive = priorityFilter !== 'ALL';
  const isCategoryActive = categoryFilter !== 'ALL';

  // Close popover on Escape key
  useEffect(() => {
    if (!activePopover) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePopover(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePopover]);

  // Copy shareable full board URL to clipboard
  const handleCopyLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('board', boardKey);
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#f7f9fb]/95 backdrop-blur-md border-b border-[#e0e3e5] pt-safe shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
      {/* Top Navbar */}
      <div className="h-14 px-4 flex items-center justify-between gap-2.5">
        {/* Brand Logo & Sprint Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 bg-[#0f172a] rounded-lg flex items-center justify-center shrink-0 shadow-sm"
            aria-hidden="true"
          >
            <Terminal size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-[15px] font-bold text-[#191c1e] tracking-tight truncate">
              CampusSprint
            </h1>
            <span className="px-1.5 py-0.5 rounded-md bg-[#eceef0] text-[10px] font-semibold text-[#505f76] shrink-0 font-mono">
              Sprint 04
            </span>
          </div>
        </div>

        {/* Sync Status Badge & Switch Board Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f2f4f6] border border-[#e0e3e5]"
            title={`Supabase status: ${syncStatus}`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                syncStatus === 'synced'
                  ? 'bg-emerald-500'
                  : syncStatus === 'syncing'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span className="text-[11px] font-medium text-[#505f76] capitalize">
              {syncStatus}
            </span>
          </div>

          <button
            type="button"
            onClick={onLeaveBoard}
            className="h-8 px-2.5 rounded-lg bg-white border border-[#e0e3e5] text-[#505f76] hover:text-[#191c1e] hover:bg-[#eceef0] text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all shadow-sm"
            title="Leave current board or switch code"
            aria-label="Switch or leave board"
          >
            <LogOut size={13} strokeWidth={2} />
            <span className="hidden xs:inline">Switch</span>
          </button>
        </div>
      </div>

      {/* Board Key Copy Badge + Progress Counter Tag */}
      <div className="px-4 pb-2 pt-0.5 flex items-center justify-between gap-2">
        {/* Copy Board ID Button */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleCopyLink}
            className={`
              group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-medium
              active:scale-95 transition-all
              ${
                copied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-[#e0e3e5] text-[#191c1e] hover:bg-[#f2f4f6]'
              }
            `}
            title="Tap to copy complete board share link to clipboard"
            aria-label={`Copy board ID ${boardKey}`}
          >
            {copied ? (
              <>
                <Check size={12} strokeWidth={2.5} className="text-emerald-600" />
                <span className="font-semibold text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <span className="text-[#76777d] uppercase text-[10px] font-bold font-sans">ID:</span>
                <span className="font-semibold truncate max-w-[130px]">{boardKey}</span>
                <Copy size={11} className="text-[#505f76] opacity-70 group-hover:opacity-100 shrink-0" />
              </>
            )}
          </button>
        </div>

        {/* Progress Counter Tag */}
        <div className="flex items-center gap-1 text-[#505f76] text-[11px] font-semibold shrink-0">
          <CheckCircle2 size={12} className={percentage === 100 ? 'text-emerald-600' : 'text-[#505f76]'} />
          <span>{doneCount}</span>
          <span className="text-slate-400 font-normal">/{totalCount} Done</span>
        </div>
      </div>

      {/* Accessible Progress Bar */}
      <div className="px-4 pb-2">
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

      {/* Space-Saving Compact Filter Trigger Row */}
      <div className="px-4 pb-2.5 flex items-center gap-2">
        {/* Priority Filter Trigger */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'priority' ? null : 'priority')}
            aria-expanded={activePopover === 'priority'}
            className={`
              w-full h-9 min-h-[36px] px-3 rounded-xl border text-[12px] font-semibold
              flex items-center justify-between gap-1.5 transition-all duration-150 active:scale-98
              ${
                isPriorityActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-[#38485d] border-[#e0e3e5] hover:bg-[#f8fafc]'
              }
            `}
          >
            <div className="flex items-center gap-1.5 truncate">
              {isPriorityActive ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              ) : (
                <SlidersHorizontal size={13} className="text-[#505f76] shrink-0" />
              )}
              <span className="truncate">
                {isPriorityActive ? `Priority: ${priorityFilter}` : 'Priority: All'}
              </span>
            </div>
            <ChevronDown
              size={13}
              className={`shrink-0 transition-transform duration-200 ${
                activePopover === 'priority' ? 'rotate-180' : ''
              } ${isPriorityActive ? 'text-white' : 'text-[#505f76]'}`}
            />
          </button>
        </div>

        {/* Category Filter Trigger */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setActivePopover(activePopover === 'category' ? null : 'category')}
            aria-expanded={activePopover === 'category'}
            className={`
              w-full h-9 min-h-[36px] px-3 rounded-xl border text-[12px] font-semibold
              flex items-center justify-between gap-1.5 transition-all duration-150 active:scale-98
              ${
                isCategoryActive
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-[#38485d] border-[#e0e3e5] hover:bg-[#f8fafc]'
              }
            `}
          >
            <div className="flex items-center gap-1.5 truncate">
              {isCategoryActive ? (
                <span className="w-2 h-2 rounded-full bg-white shrink-0" />
              ) : (
                <Tag size={13} className="text-[#505f76] shrink-0" />
              )}
              <span className="truncate">
                {isCategoryActive ? `Category: ${categoryFilter}` : 'Category: All'}
              </span>
            </div>
            <ChevronDown
              size={13}
              className={`shrink-0 transition-transform duration-200 ${
                activePopover === 'category' ? 'rotate-180' : ''
              } ${isCategoryActive ? 'text-white' : 'text-[#505f76]'}`}
            />
          </button>
        </div>
      </div>

      {/* Floating Popover Menus with Fullscreen Backdrop (Rendered via Portal to body) */}
      {activePopover &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 sm:pt-36 px-4">
            {/* Fullscreen Backdrop spanning the entire viewport */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
              onClick={() => setActivePopover(null)}
              aria-hidden="true"
            />

            {/* Popover Card */}
            <div
              role="dialog"
              aria-modal="true"
              aria-label={activePopover === 'priority' ? 'Filter by Priority' : 'Filter by Category'}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#e0e3e5] p-4 z-10 animate-in zoom-in-95 fade-in duration-150"
            >
              {/* Popover Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#f2f4f6]">
                <div className="flex items-center gap-1.5">
                  {activePopover === 'priority' ? (
                    <>
                      <SlidersHorizontal size={14} className="text-[#0f172a]" />
                      <span className="text-[13px] font-bold text-[#191c1e]">Filter by Priority</span>
                    </>
                  ) : (
                    <>
                      <Tag size={14} className="text-[#0f172a]" />
                      <span className="text-[13px] font-bold text-[#191c1e]">Filter by Category</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Reset button inside popover */}
                  {((activePopover === 'priority' && isPriorityActive) ||
                    (activePopover === 'category' && isCategoryActive)) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (activePopover === 'priority') onPriorityFilterChange('ALL');
                        if (activePopover === 'category') onCategoryFilterChange('ALL');
                        setActivePopover(null);
                      }}
                      className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-0.5 active:scale-95 py-0.5 px-1.5 rounded-md hover:bg-red-50"
                    >
                      <RotateCcw size={11} />
                      <span>Reset</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActivePopover(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#505f76] hover:bg-[#eceef0] active:scale-95"
                    aria-label="Close popover"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Popover Content Chips */}
              {activePopover === 'priority' && (
                <div className="grid grid-cols-2 gap-2 pt-1" role="radiogroup">
                  {PRIORITY_ITEMS.map(({ label, value, icon: Icon, badgeStyle }) => {
                    const isSelected = priorityFilter === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => {
                          onPriorityFilterChange(value);
                          setActivePopover(null);
                        }}
                        className={`
                          flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold
                          transition-all duration-150 active:scale-95 text-left border
                          ${
                            isSelected
                              ? `${badgeStyle} shadow-sm ring-2 ring-slate-900/10`
                              : 'bg-[#f7f9fb] text-[#38485d] border-[#e0e3e5] hover:bg-white hover:border-slate-300'
                          }
                        `}
                      >
                        <Icon size={14} className="shrink-0" />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {activePopover === 'category' && (
                <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto py-1">
                  {/* All Categories Pill */}
                  <button
                    type="button"
                    onClick={() => {
                      onCategoryFilterChange('ALL');
                      setActivePopover(null);
                    }}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold
                      transition-all active:scale-95 border
                      ${
                        categoryFilter === 'ALL'
                          ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-sm'
                          : 'bg-[#f7f9fb] text-[#38485d] border-[#e0e3e5] hover:bg-white'
                      }
                    `}
                  >
                    <LayoutGrid size={13} />
                    <span>All Categories</span>
                  </button>

                  {/* Available Categories */}
                  {availableCategories.map((cat) => {
                    const isSelected = categoryFilter.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          onCategoryFilterChange(cat);
                          setActivePopover(null);
                        }}
                        className={`
                          flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold
                          transition-all active:scale-95 border
                          ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-1 ring-indigo-400'
                              : 'bg-[#f7f9fb] text-[#38485d] border-[#e0e3e5] hover:bg-white'
                          }
                        `}
                      >
                        <Tag size={12} />
                        <span className="truncate max-w-[120px]">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
