// ============================================================
// useTasks — Hybrid Sync (LocalStorage + Supabase)
// Features: Board Key / Sync ID + Instant 0ms Optimistic UI Updates
// ============================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Task, Priority, TaskStatus } from '../types/task';
import { STATUS_ORDER, NEXT_PRIORITY_CYCLE } from '../types/task';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_BOARD_KEY = 'default-board';

/** Helper to get initial boardKey from URL (?board=...) or localStorage or default */
function getInitialBoardKey(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('board')?.trim();
    if (fromUrl) return fromUrl;
    const fromStorage = window.localStorage.getItem('campussprint_active_board')?.trim();
    if (fromStorage) return fromStorage;
  } catch {
    // SSR / test fallback
  }
  return DEFAULT_BOARD_KEY;
}

/** Seed dummy tasks for first run if local & cloud are empty */
const SEED_TASKS: Task[] = [
  {
    id: 'seed-1',
    title: 'Wireframe low-fi auth flow in Figma',
    description: 'Establish initial mobile wireframes for student onboard and login views.',
    priority: 'HIGH',
    status: 'TODO',
    category: 'UI/UX',
    dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
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

function getStorageKey(boardKey: string): string {
  return `campussprint_tasks_${boardKey}`;
}

function loadLocalTasks(boardKey: string): Task[] {
  try {
    const raw = window.localStorage.getItem(getStorageKey(boardKey));
    if (!raw) return boardKey === DEFAULT_BOARD_KEY ? SEED_TASKS : [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Task[];
  } catch (err) {
    console.warn('[useTasks] Error reading local cache:', err);
    return boardKey === DEFAULT_BOARD_KEY ? SEED_TASKS : [];
  }
}

function saveLocalTasks(boardKey: string, tasks: Task[]): void {
  try {
    window.localStorage.setItem(getStorageKey(boardKey), JSON.stringify(tasks));
  } catch (err) {
    console.error('[useTasks] Error writing local cache:', err);
  }
}

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export type PriorityFilter = Priority | 'ALL';
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

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
  boardKey: string;
  syncStatus: SyncStatus;
  storageError: string | null;
  progress: ProgressStats;
  countByStatus: Record<TaskStatus, number>;
  setBoardKey: (newKey: string) => void;
  addTask: (payload: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  moveTaskStatus: (id: string, direction: 'forward' | 'backward') => void;
  updateTaskPriority: (id: string) => void;
  deleteTask: (id: string) => void;
  setPriorityFilter: (filter: PriorityFilter) => void;
  resetTasks: () => void;
}

export function useTasks(): UseTasksReturn {
  const [boardKey, setBoardKeyState] = useState<string>(() => getInitialBoardKey());
  const [tasks, setTasksState] = useState<Task[]>(() => loadLocalTasks(boardKey));
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isSupabaseConfigured ? 'syncing' : 'offline');
  const [storageError] = useState<string | null>(null);

  const boardKeyRef = useRef(boardKey);
  boardKeyRef.current = boardKey;

  // Sync boardKey to URL and localStorage
  const setBoardKey = useCallback((newKey: string) => {
    const sanitized = newKey.trim() || DEFAULT_BOARD_KEY;
    setBoardKeyState(sanitized);
    try {
      window.localStorage.setItem('campussprint_active_board', sanitized);
      const url = new URL(window.location.href);
      if (sanitized === DEFAULT_BOARD_KEY) {
        url.searchParams.delete('board');
      } else {
        url.searchParams.set('board', sanitized);
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  }, []);

  // Fetch tasks from Supabase when boardKey changes
  useEffect(() => {
    // 1. Instantly load from local storage cache (0ms delay)
    const cached = loadLocalTasks(boardKey);
    setTasksState(cached);

    if (!supabase || !isSupabaseConfigured) {
      setSyncStatus('offline');
      return;
    }

    let isMounted = true;
    setSyncStatus('syncing');

    async function fetchCloudTasks() {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('board_key', boardKey);

        if (error) {
          console.warn('[useTasks] Supabase query error (falling back to local cache):', error.message);
          if (isMounted) setSyncStatus('offline');
          return;
        }

        if (isMounted && data) {
          if (data.length > 0) {
            const mapped: Task[] = data.map((row: any) => ({
              id: String(row.id),
              title: row.title || 'Untitled',
              description: row.description || undefined,
              priority: (row.priority as Priority) || 'MEDIUM',
              status: (row.status as TaskStatus) || 'TODO',
              dueDate: row.due_date || row.dueDate || undefined,
              category: row.category || undefined,
              boardKey: row.board_key || boardKey,
              createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
            }));

            setTasksState(mapped);
            saveLocalTasks(boardKey, mapped);
          } else if (cached.length > 0 && boardKey === DEFAULT_BOARD_KEY) {
            // Seed cloud with initial data in the background if empty
            for (const item of cached) {
              await supabase.from('tasks').insert([
                {
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  priority: item.priority,
                  status: item.status,
                  due_date: item.dueDate,
                  category: item.category,
                  board_key: boardKey,
                },
              ]);
            }
          }
          setSyncStatus('synced');
        }
      } catch (err: any) {
        console.warn('[useTasks] Supabase connection failed, using local storage:', err.message);
        if (isMounted) setSyncStatus('offline');
      }
    }

    fetchCloudTasks();

    return () => {
      isMounted = false;
    };
  }, [boardKey]);

  // Sync to localStorage whenever tasks state updates
  useEffect(() => {
    saveLocalTasks(boardKey, tasks);
  }, [boardKey, tasks]);

  // ── OPTIMISTIC ACTIONS ──────────────────────────────────────────

  // Add Task
  const addTask = useCallback(
    (payload: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
      const currentBoard = boardKeyRef.current;
      const newTask: Task = {
        ...payload,
        id: generateId(),
        status: 'TODO',
        boardKey: currentBoard,
        createdAt: Date.now(),
      };

      // 1. Optimistic Local Update (0ms)
      setTasksState((prev) => {
        const next = [newTask, ...prev];
        saveLocalTasks(currentBoard, next);
        return next;
      });

      // 2. Background Cloud Sync
      if (supabase && isSupabaseConfigured) {
        setSyncStatus('syncing');
        (async () => {
          try {
            const { error } = await supabase.from('tasks').insert([
              {
                id: newTask.id,
                title: newTask.title,
                description: newTask.description,
                priority: newTask.priority,
                status: newTask.status,
                due_date: newTask.dueDate,
                category: newTask.category,
                board_key: currentBoard,
              },
            ]);
            if (error) {
              console.warn('[useTasks] Cloud insert error (kept in localStorage):', error.message);
              setSyncStatus('offline');
            } else {
              setSyncStatus('synced');
            }
          } catch {
            setSyncStatus('offline');
          }
        })();
      }
    },
    []
  );

  // Move Task Status
  const moveTaskStatus = useCallback((id: string, direction: 'forward' | 'backward') => {
    const currentBoard = boardKeyRef.current;
    let targetStatus: TaskStatus | null = null;

    // 1. Optimistic Local Update (0ms)
    setTasksState((prev) => {
      const next = prev.map((task) => {
        if (task.id !== id) return task;
        const currentIdx = STATUS_ORDER.indexOf(task.status);
        if (currentIdx === -1) return task;

        const nextIdx =
          direction === 'forward'
            ? Math.min(currentIdx + 1, STATUS_ORDER.length - 1)
            : Math.max(currentIdx - 1, 0);

        if (nextIdx === currentIdx) return task;
        targetStatus = STATUS_ORDER[nextIdx];
        return { ...task, status: targetStatus };
      });
      saveLocalTasks(currentBoard, next);
      return next;
    });

    // 2. Background Cloud Sync
    if (targetStatus && supabase && isSupabaseConfigured) {
      setSyncStatus('syncing');
      (async () => {
        try {
          const { error } = await supabase
            .from('tasks')
            .update({ status: targetStatus })
            .eq('id', id)
            .eq('board_key', currentBoard);
          if (error) {
            console.warn('[useTasks] Cloud update error:', error.message);
            setSyncStatus('offline');
          } else {
            setSyncStatus('synced');
          }
        } catch {
          setSyncStatus('offline');
        }
      })();
    }
  }, []);

  // Update Task Priority
  const updateTaskPriority = useCallback((id: string) => {
    const currentBoard = boardKeyRef.current;
    let targetPriority: Priority | null = null;

    // 1. Optimistic Local Update (0ms)
    setTasksState((prev) => {
      const next = prev.map((task) => {
        if (task.id !== id) return task;
        targetPriority = NEXT_PRIORITY_CYCLE[task.priority] || 'LOW';
        return { ...task, priority: targetPriority };
      });
      saveLocalTasks(currentBoard, next);
      return next;
    });

    // 2. Background Cloud Sync
    if (targetPriority && supabase && isSupabaseConfigured) {
      setSyncStatus('syncing');
      (async () => {
        try {
          const { error } = await supabase
            .from('tasks')
            .update({ priority: targetPriority })
            .eq('id', id)
            .eq('board_key', currentBoard);
          if (error) {
            console.warn('[useTasks] Cloud priority update error:', error.message);
            setSyncStatus('offline');
          } else {
            setSyncStatus('synced');
          }
        } catch {
          setSyncStatus('offline');
        }
      })();
    }
  }, []);

  // Delete Task
  const deleteTask = useCallback((id: string) => {
    const currentBoard = boardKeyRef.current;

    // 1. Optimistic Local Update (0ms)
    setTasksState((prev) => {
      const next = prev.filter((task) => task.id !== id);
      saveLocalTasks(currentBoard, next);
      return next;
    });

    // 2. Background Cloud Sync
    if (supabase && isSupabaseConfigured) {
      setSyncStatus('syncing');
      (async () => {
        try {
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)
            .eq('board_key', currentBoard);
          if (error) {
            console.warn('[useTasks] Cloud delete error:', error.message);
            setSyncStatus('offline');
          } else {
            setSyncStatus('synced');
          }
        } catch {
          setSyncStatus('offline');
        }
      })();
    }
  }, []);

  // Reset Tasks
  const resetTasks = useCallback(() => {
    const currentBoard = boardKeyRef.current;
    setTasksState(SEED_TASKS);
    saveLocalTasks(currentBoard, SEED_TASKS);

    if (supabase && isSupabaseConfigured) {
      setSyncStatus('syncing');
      (async () => {
        try {
          await supabase.from('tasks').delete().eq('board_key', currentBoard);
          for (const item of SEED_TASKS) {
            await supabase.from('tasks').insert([
              {
                id: item.id,
                title: item.title,
                description: item.description,
                priority: item.priority,
                status: item.status,
                due_date: item.dueDate,
                category: item.category,
                board_key: currentBoard,
              },
            ]);
          }
          setSyncStatus('synced');
        } catch {
          setSyncStatus('offline');
        }
      })();
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
    boardKey,
    syncStatus,
    storageError,
    progress,
    countByStatus,
    setBoardKey,
    addTask,
    moveTaskStatus,
    updateTaskPriority,
    deleteTask,
    setPriorityFilter,
    resetTasks,
  };
}
