// ============================================================
// Task type definitions — Dynamic categories & priority types
// ============================================================

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  category: string; // Dynamic custom category string
  boardKey?: string;
  createdAt: number;
}

// ── Default Category Suggestions ─────────────────────────────
export const DEFAULT_CATEGORIES: string[] = [
  'Academic',
  'Coding',
  'Organization',
  'Personal',
];

// ── Derived helpers ──────────────────────────────────────────

/** Ordered list of statuses for tap-to-advance logic */
export const STATUS_ORDER: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

/** Ordered cycle for priority toggle: LOW -> MEDIUM -> HIGH -> LOW */
export const NEXT_PRIORITY_CYCLE: Record<Priority, Priority> = {
  LOW: 'MEDIUM',
  MEDIUM: 'HIGH',
  HIGH: 'LOW',
};

/** Human-readable labels for each status column (English) */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};

/** Human-readable labels for priority badges */
export const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

/**
 * Tailwind classes for WCAG AA-compliant priority badges (contrast > 4.5:1)
 */
export const PRIORITY_STYLES: Record<
  Priority,
  { badge: string; border: string; dot: string }
> = {
  HIGH: {
    badge: 'bg-[#FEE2E2] text-[#991B1B] border border-red-200/80',
    border: 'border-l-[#EF4444]',
    dot: 'bg-[#EF4444]',
  },
  MEDIUM: {
    badge: 'bg-[#FEF3C7] text-[#92400E] border border-amber-200/80',
    border: 'border-l-[#F59E0B]',
    dot: 'bg-[#F59E0B]',
  },
  LOW: {
    badge: 'bg-[#D1FAE5] text-[#065F46] border border-emerald-200/80',
    border: 'border-l-[#10B981]',
    dot: 'bg-[#10B981]',
  },
};
