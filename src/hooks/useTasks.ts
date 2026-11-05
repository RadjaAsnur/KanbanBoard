// ============================================================
// useTasks — Hybrid Sync (LocalStorage + Supabase)
// Features: Board Key / Sync ID + Instant 0ms Optimistic UI Updates
// Detailed console logging for developer debugging (F12)
// ============================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Task, Priority, TaskStatus } from '../types/task';
import { STATUS_ORDER, NEXT_PRIORITY_CYCLE } from '../types/task';
import { supabase, isSupabaseConfigured, supabaseUrl } from '../lib/supabase';

const DEFAULT_BOARD_KEY = 'default-board';
const TABLE_NAME = 'tasks';

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

/** Formatter helper for Supabase DB payload conforming to exact table schema */
function toSupabasePayload(task: Task, boardKey: string) {
  return {
    id: task.id,
    board_key: boardKey,
    title: task.title,
    description: task.description || null,
    priority: task.priority,
    status: task.status,
    due_date: task.dueDate || null,
    created_at: task.createdAt, // bigint timestamp
  };
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
    console.log(`[useTasks] Switching active board to: "${sanitized}"`);
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
      console.warn('[useTasks] Supabase is not configured. Running in Local-Only mode.');
      setSyncStatus('offline');
      return;
    }

    let isMounted = true;
    setSyncStatus('syncing');

    async function fetchCloudTasks() {
      if (!supabase) return;
      console.log(`[useTasks] Fetching tasks from Supabase table "${TABLE_NAME}" for board_key = "${boardKey}"...`);

      try {
        const { data, error, status, statusText } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .eq('board_key', boardKey);

        if (error) {
          console.error(
            `%c[useTasks] Supabase SELECT Error on table "${TABLE_NAME}":%c`,
            'color: #ef4444; font-weight: bold;',
            'color: inherit;',
            {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
              httpStatus: status,
              statusText: statusText,
            }
          );
          if (isMounted) setSyncStatus('error');
          return;
        }

        console.log(`[useTasks] Supabase SELECT Success. Loaded ${data?.length ?? 0} tasks for board "${boardKey}".`, data);

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
              createdAt: typeof row.created_at === 'number'
                ? row.created_at
                : (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
            }));

            setTasksState(mapped);
            saveLocalTasks(boardKey, mapped);
          } else if (cached.length > 0 && boardKey === DEFAULT_BOARD_KEY) {
            // Seed cloud with initial data if remote is empty
            console.log('[useTasks] Cloud board is empty. Seeding initial tasks to Supabase...');
            const seedPayloads = cached.map((c) => toSupabasePayload(c, boardKey));
            const { error: seedError } = await supabase.from(TABLE_NAME).insert(seedPayloads);
            if (seedError) {
              console.error('[useTasks] Error seeding tasks to Supabase:', seedError);
            } else {
              console.log('[useTasks] Successfully seeded initial tasks to Supabase.');
            }
          }
          setSyncStatus('synced');
        }
      } catch (err: any) {
        console.error('[useTasks] Unexpected error while fetching from Supabase:', err);
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

      console.log(`[useTasks] Optimistically adding task "${newTask.title}" (id: ${newTask.id}) to board "${currentBoard}"...`);

      // 1. Optimistic Local Update (0ms)
      setTasksState((prev) => {
        const next = [newTask, ...prev];
        saveLocalTasks(currentBoard, next);
        return next;
      });

      // 2. Background Cloud Sync
      if (supabase && isSupabaseConfigured) {
        setSyncStatus('syncing');
        const dbPayload = toSupabasePayload(newTask, currentBoard);

        console.log(`[useTasks] Sending INSERT to table "${TABLE_NAME}"...`, dbPayload);

        (async () => {
          try {
            const { data, error, status, statusText } = await supabase
              .from(TABLE_NAME)
              .insert([dbPayload])
              .select();

            if (error) {
              console.error(
                `%c[useTasks] Supabase INSERT FAILED on table "${TABLE_NAME}":%c`,
                'color: #ef4444; font-weight: bold;',
                'color: inherit;',
                {
                  message: error.message,
                  details: error.details,
                  hint: error.hint,
                  code: error.code,
                  httpStatus: status,
                  statusText: statusText,
                  payload: dbPayload,
                }
              );
              setSyncStatus('error');
            } else {
              console.log(`%c[useTasks] Supabase INSERT SUCCESS for task "${newTask.id}"!%c`, 'color: #10b981; font-weight: bold;', 'color: inherit;', data);
              setSyncStatus('synced');
            }
          } catch (err: any) {
            console.error('[useTasks] Exception during Supabase INSERT:', err);
            setSyncStatus('offline');
          }
        })();
      } else {
        console.warn(`[useTasks] Task created in LocalStorage only (Supabase client not configured: URL=${supabaseUrl})`);
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
      console.log(`[useTasks] Sending UPDATE status=${targetStatus} to table "${TABLE_NAME}" for task "${id}"...`);

      (async () => {
        try {
          const { error, status, statusText } = await supabase
            .from(TABLE_NAME)
            .update({ status: targetStatus })
            .eq('id', id)
            .eq('board_key', currentBoard);

          if (error) {
            console.error(
              `%c[useTasks] Supabase UPDATE status FAILED:%c`,
              'color: #ef4444; font-weight: bold;',
              'color: inherit;',
              { message: error.message, details: error.details, code: error.code, status, statusText }
            );
            setSyncStatus('error');
          } else {
            console.log(`[useTasks] Supabase UPDATE status SUCCESS for task "${id}".`);
            setSyncStatus('synced');
          }
        } catch (err) {
          console.error('[useTasks] Exception during Supabase UPDATE status:', err);
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
      console.log(`[useTasks] Sending UPDATE priority=${targetPriority} to table "${TABLE_NAME}" for task "${id}"...`);

      (async () => {
        try {
          const { error, status, statusText } = await supabase
            .from(TABLE_NAME)
            .update({ priority: targetPriority })
            .eq('id', id)
            .eq('board_key', currentBoard);

          if (error) {
            console.error(
              `%c[useTasks] Supabase UPDATE priority FAILED:%c`,
              'color: #ef4444; font-weight: bold;',
              'color: inherit;',
              { message: error.message, details: error.details, code: error.code, status, statusText }
            );
            setSyncStatus('error');
          } else {
            console.log(`[useTasks] Supabase UPDATE priority SUCCESS for task "${id}".`);
            setSyncStatus('synced');
          }
        } catch (err) {
          console.error('[useTasks] Exception during Supabase UPDATE priority:', err);
          setSyncStatus('offline');
        }
      })();
    }
  }, []);

  // Delete Task
  const deleteTask = useCallback((id: string) => {
    const currentBoard = boardKeyRef.current;

    console.log(`[useTasks] Optimistically deleting task "${id}" from board "${currentBoard}"...`);

    // 1. Optimistic Local Update (0ms)
    setTasksState((prev) => {
      const next = prev.filter((task) => task.id !== id);
      saveLocalTasks(currentBoard, next);
      return next;
    });

    // 2. Background Cloud Sync
    if (supabase && isSupabaseConfigured) {
      setSyncStatus('syncing');
      console.log(`[useTasks] Sending DELETE to table "${TABLE_NAME}" for task "${id}"...`);

      (async () => {
        try {
          const { error, status, statusText } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id)
            .eq('board_key', currentBoard);

          if (error) {
            console.error(
              `%c[useTasks] Supabase DELETE FAILED:%c`,
              'color: #ef4444; font-weight: bold;',
              'color: inherit;',
              { message: error.message, details: error.details, code: error.code, status, statusText }
            );
            setSyncStatus('error');
          } else {
            console.log(`[useTasks] Supabase DELETE SUCCESS for task "${id}".`);
            setSyncStatus('synced');
          }
        } catch (err) {
          console.error('[useTasks] Exception during Supabase DELETE:', err);
          setSyncStatus('offline');
        }
      })();
    }
  }, []);

  // Reset Tasks
  const resetTasks = useCallback(() => {
    const currentBoard = boardKeyRef.current;
    console.log(`[useTasks] Resetting tasks for board "${currentBoard}"...`);
    setTasksState(SEED_TASKS);
    saveLocalTasks(currentBoard, SEED_TASKS);

    if (supabase && isSupabaseConfigured) {
      setSyncStatus('syncing');
      (async () => {
        try {
          await supabase.from(TABLE_NAME).delete().eq('board_key', currentBoard);
          const seedPayloads = SEED_TASKS.map((item) => toSupabasePayload(item, currentBoard));
          const { error } = await supabase.from(TABLE_NAME).insert(seedPayloads);
          if (error) {
            console.error('[useTasks] Reset seed insert error:', error);
            setSyncStatus('error');
          } else {
            console.log('[useTasks] Reset complete.');
            setSyncStatus('synced');
          }
        } catch (err) {
          console.error('[useTasks] Exception during reset:', err);
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
