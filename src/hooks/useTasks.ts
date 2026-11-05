// ============================================================
// useTasks — State management & window.localStorage sync
// Key: 'campussprint_tasks' | English localization
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, Priority, TaskStatus } from '../types/task';
import { STATUS_ORDER } from '../types/task';

const STORAGE_KEY = 'campussprint_tasks';

/** Initial dummy tasks matching Stitch CampusSprint dataset in English */
const SEED_TASKS: Task[] = [
  {
    id: 'seed-1',
    title: 'Wireframe low-fi auth flow in Figma',
    description: 'Establish initial mobile wireframes for student onboard and login views.',
    priority: 'HIGH',
    status: 'TODO',
    category: 'UI/UX',
    dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), // Tomorrow
    createdAt: Date.now() - 3600_000,
  },
  {
    id: 'seed-2',
    title: 'Implement JWT refresh token interceptor',
    description: 'Handle token expiration gracefully with automatic background renewal.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    category: 'Backend',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    createdAt: Date.now() - 7200_000,
  },
  {
    id: 'seed-3',
    title: 'Setup mobile viewport container & Tailwind system',
    description: 'Ensure max-w-md centering on desktop screens and 44px tap targets.',
    priority: 'MEDIUM',
    status: 'DONE',
    category: 'Frontend',
    dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    createdAt: Date.now() - 86400_000,
  },
];

function loadFromStorage(): Task[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_TASKS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_TASKS;
    return parsed as Task[];
  } catch (err) {
    console.warn('[useTasks] Error reading localStorage, using seed tasks:', err);
    return SEED_TASKS;
  }
}

function saveToStorage(tasks: Task[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('[useTasks] Error saving to localStorage:', err);
  }
}

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export type PriorityFilter = Priority | 'ALL';

export interface ProgressStats {
  doneCount: number;
  totalCount: number;
  label: string;
  percentage: number;
}

export interface UseTasksReturn {
  tasks: Task[];
  filteredTasks: Task[];
  priorityFilter: PriorityFilter;
  storageError: string | null;
  progress: ProgressStats;
  countByStatus: Record<TaskStatus, number>;
  addTask: (payload: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  moveTaskStatus: (id: string, direction: 'forward' | 'backward') => void;
  deleteTask: (id: string) => void;
  setPriorityFilter: (filter: PriorityFilter) => void;
  resetTasks: () => void;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasksState] = useState<Task[]>(() => loadFromStorage());
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    try {
      saveToStorage(tasks);
      setStorageError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Storage write failed';
      setStorageError(msg);
    }
  }, [tasks]);

  const addTask = useCallback((payload: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const newTask: Task = {
      ...payload,
      id: generateId(),
      status: 'TODO',
      createdAt: Date.now(),
    };
    setTasksState((prev) => [newTask, ...prev]);
  }, []);

  const moveTaskStatus = useCallback((id: string, direction: 'forward' | 'backward') => {
    setTasksState((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const currentIdx = STATUS_ORDER.indexOf(task.status);
        if (currentIdx === -1) return task;

        const nextIdx =
          direction === 'forward'
            ? Math.min(currentIdx + 1, STATUS_ORDER.length - 1)
            : Math.max(currentIdx - 1, 0);

        if (nextIdx === currentIdx) return task;
        return { ...task, status: STATUS_ORDER[nextIdx] };
      })
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasksState((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const resetTasks = useCallback(() => {
    setTasksState(SEED_TASKS);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TASKS));
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const filteredTasks = useMemo<Task[]>(() => {
    const base =
      priorityFilter === 'ALL'
        ? tasks
        : tasks.filter((t) => t.priority === priorityFilter);

    const PRIORITY_RANK: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return [...base].sort((a, b) => {
      const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (rankDiff !== 0) return rankDiff;
      return b.createdAt - a.createdAt;
    });
  }, [tasks, priorityFilter]);

  const progress = useMemo<ProgressStats>(() => {
    const doneCount = tasks.filter((t) => t.status === 'DONE').length;
    const totalCount = tasks.length;
    const percentage = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
    return {
      doneCount,
      totalCount,
      label: `${doneCount}/${totalCount} Done`,
      percentage,
    };
  }, [tasks]);

  const countByStatus = useMemo<Record<TaskStatus, number>>(() => {
    const counts: Record<TaskStatus, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };
    for (const task of filteredTasks) {
      counts[task.status] += 1;
    }
    return counts;
  }, [filteredTasks]);

  return {
    tasks,
    filteredTasks,
    priorityFilter,
    storageError,
    progress,
    countByStatus,
    addTask,
    moveTaskStatus,
    deleteTask,
    setPriorityFilter,
    resetTasks,
  };
}
