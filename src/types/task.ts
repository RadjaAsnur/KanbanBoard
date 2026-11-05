// ============================================================
// Task type definitions — matches PRD §4 Technical Specifications
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
  createdAt: number;
}

// ── Derived helpers ──────────────────────────────────────────

/** Ordered list of statuses for tap-to-advance logic */
export const STATUS_ORDER: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

/** Human-readable labels for each status column */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

/** Human-readable labels for priority badges */
export const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

/** Tailwind class sets for WCAG AA-compliant priority badges */
export const PRIORITY_STYLES: Record<
  Priority,
  { badge: string; border: string }
> = {
  HIGH: {
    badge: 'bg-red-100 text-red-800 border border-red-300',
    border: 'border-l-red-500',
  },
  MEDIUM: {
    badge: 'bg-amber-100 text-amber-800 border border-amber-300',
    border: 'border-l-amber-400',
  },
  LOW: {
    badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    border: 'border-l-emerald-500',
  },
};

