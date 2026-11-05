// ============================================================
// useTasks — Hybrid Sync (LocalStorage + Supabase)
// Features: Dynamic Categories + Priority & Category Filters
// Key: 'campussprint_board_key'
// ============================================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Task, Priority, TaskStatus } from '../types/task';
import { STATUS_ORDER, NEXT_PRIORITY_CYCLE, DEFAULT_CATEGORIES } from '../types/task';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BOARD_KEY_STORAGE = 'campussprint_board_key';
const CUSTOM_CATEGORIES_STORAGE = 'campussprint_custom_categories';
const TABLE_NAME = 'tasks';

/** Generate clean random board key string, e.g. sprint-k8m2px */
export function generateRandomBoardKey(): string {
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `sprint-${randomPart}`;
}

/** Check initial board key from URL param ?board= or localStorage */
function detectInitialBoardKey(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('board')?.trim().toLowerCase();
    if (fromUrl) {
      window.localStorage.setItem(BOARD_KEY_STORAGE, fromUrl);
      return fromUrl;
    }
    const fromStorage = window.localStorage.getItem(BOARD_KEY_STORAGE)?.trim().toLowerCase();
    if (fromStorage) {
      return fromStorage;
    }
  } catch {
    // fallback
  }
  return null;
}

/** Load custom categories from localStorage, seeded with defaults */
function loadCustomCategories(): string[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_CATEGORIES_STORAGE);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CATEGORIES;
    // Ensure all defaults are present
    const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...parsed]));
    return combined;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function saveCustomCategories(categories: string[]): void {
  try {
    window.localStorage.setItem(CUSTOM_CATEGORIES_STORAGE, JSON.stringify(categories));
  } catch {
    // ignore
  }
}

/** Default sample tasks seeded when a brand new board is initiated */
function createInitialSeedTasks(): Task[] {
  return [
    {
      id: `task-${Date.now()}-1`,
      title: 'Submit software architecture documentation',
      description: 'Prepare diagrams, API specifications, and database entity relationships.',
      priority: 'HIGH',
      status: 'TODO',
      category: 'Academic',
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      createdAt: Date.now() - 3600_000,
    },
    {
      id: `task-${Date.now()}-2`,
      title: 'Build responsive Kanban board with Tailwind',
      description: 'Implement drag-free tap-to-move interactions and WCAG AA contrast badges.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      category: 'Coding',
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      createdAt: Date.now() - 7200_000,
    },
    {
      id: `task-${Date.now()}-3`,
      title: 'Organize student council meeting agenda',
      description: 'Finalize budget review and delegate committee sprint leads.',
      priority: 'MEDIUM',
      status: 'DONE',
      category: 'Organization',
      dueDate: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      createdAt: Date.now() - 86400_000,
    },
  ];
}

function getStorageKey(boardKey: string): string {
  return `campussprint_tasks_${boardKey}`;
}

function loadLocalTasks(boardKey: string | null): Task[] {
  if (!boardKey) return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey(boardKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Task[];
  } catch (err) {
    console.warn('[useTasks] Error reading local cache:', err);
    return [];
  }
}

function saveLocalTasks(boardKey: string | null, tasks: Task[]): void {
  if (!boardKey) return;
  try {
    window.localStorage.setItem(getStorageKey(boardKey), JSON.stringify(tasks));
  } catch (err) {
    console.error('[useTasks] Error writing local cache:', err);
  }
}

function generateId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Formatter helper: encode category safely inside description so Supabase without a category column syncs seamlessly */
function serializeDescription(desc?: string, category?: string): string | null {
  const cat = (category || 'General').trim();
  const body = (desc || '').trim();
  // Format: [category:Coding] task details...
  return `[cat:${cat}]${body}`;
}

function deserializeDescription(rawDesc?: string | null): { description?: string; category: string } {
  if (!rawDesc) return { category: 'General' };
  const match = rawDesc.match(/^\[cat:([^\]]+)\]([\s\S]*)$/);
  if (match) {
    const category = match[1].trim() || 'General';
    const description = match[2].trim() || undefined;
    return { category, description };
  }
  return { description: rawDesc.trim() || undefined, category: 'General' };
}

/** Formatter helper for Supabase DB payload */
function toSupabasePayload(task: Task, boardKey: string) {
  return {
    id: task.id,
    board_key: boardKey,
    title: task.title,
    description: serializeDescription(task.description, task.category),
    priority: task.priority,
    status: task.status,
    due_date: task.dueDate || null,
    created_at: task.createdAt,
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
  categoryFilter: string; // 'ALL' or specific category name
  availableCategories: string[];
  boardKey: string | null;
  syncStatus: SyncStatus;
  storageError: string | null;
  progress: ProgressStats;
  countByStatus: Record<TaskStatus, number>;
  createAutoBoard: () => string;
  selectBoard: (key: string) => void;
  leaveBoard: () => void;
  addTask: (payload: Omit<Task, 'id' | 'createdAt' | 'status'>) => void;
  moveTaskStatus: (id: string, direction: 'forward' | 'backward') => void;
  updateTaskPriority: (id: string) => void;
  deleteTask: (id: string) => void;
  setPriorityFilter: (filter: PriorityFilter) => void;
  setCategoryFilter: (category: string) => void;
  registerCategory: (category: string) => void;
}

export function useTasks(): UseTasksReturn {
  const [boardKey, setBoardKeyState] = useState<string | null>(() => detectInitialBoardKey());
  const [tasks, setTasksState] = useState<Task[]>(() => loadLocalTasks(boardKey));
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [customCategories, setCustomCategories] = useState<string[]>(() => loadCustomCategories());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isSupabaseConfigured ? 'syncing' : 'offline');
  const [storageError] = useState<string | null>(null);

  const boardKeyRef = useRef(boardKey);
  boardKeyRef.current = boardKey;

  // Compute union of default, custom, and any existing categories present in active tasks
  const availableCategories = useMemo(() => {
    const set = new Set<string>(customCategories);
    tasks.forEach((t) => {
      if (t.category && t.category.trim()) {
        set.add(t.category.trim());
      }
    });
    return Array.from(set);
  }, [customCategories, tasks]);

  const registerCategory = useCallback((newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    setCustomCategories((prev) => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      saveCustomCategories(updated);
      return updated;
    });
  }, []);

  // Helper to commit boardKey to URL and storage
  const commitBoardKey = useCallback((key: string | null) => {
    try {
      const url = new URL(window.location.href);
      if (key) {
        window.localStorage.setItem(BOARD_KEY_STORAGE, key);
        url.searchParams.set('board', key);
      } else {
        window.localStorage.removeItem(BOARD_KEY_STORAGE);
        url.searchParams.delete('board');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // ignore
    }
  }, []);

  // 1. Create a brand new auto board
  const createAutoBoard = useCallback(() => {
    const newKey = generateRandomBoardKey();
    console.log(`[useTasks] Generating new board key: "${newKey}"`);
    commitBoardKey(newKey);
    setBoardKeyState(newKey);

    // Seed initial dummy tasks for friendly onboarding
    const initialTasks = createInitialSeedTasks();
    saveLocalTasks(newKey, initialTasks);
    setTasksState(initialTasks);

    // Sync seed tasks to Supabase if configured
    if (supabase && isSupabaseConfigured) {
      setSyncStatus('syncing');
      const seedPayloads = initialTasks.map((t) => toSupabasePayload(t, newKey));
      (async () => {
        try {
          const { error } = await supabase.from(TABLE_NAME).insert(seedPayloads);
          if (error) {
            console.error('[useTasks] Error inserting initial seed tasks:', error);
            setSyncStatus('error');
          } else {
            setSyncStatus('synced');
          }
        } catch {
          setSyncStatus('offline');
        }
      })();
    }

    return newKey;
  }, [commitBoardKey]);

  // 2. Select / Join an existing board
  const selectBoard = useCallback((key: string) => {
    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanKey) return;
    console.log(`[useTasks] Loading existing board key: "${cleanKey}"`);
    commitBoardKey(cleanKey);
    setBoardKeyState(cleanKey);
  }, [commitBoardKey]);

  // 3. Leave / Change current board
  const leaveBoard = useCallback(() => {
    console.log('[useTasks] Leaving current board...');
    commitBoardKey(null);
    setBoardKeyState(null);
    setTasksState([]);
  }, [commitBoardKey]);

  // Fetch tasks from Supabase when boardKey changes
  useEffect(() => {
    if (!boardKey) {
      setTasksState([]);
      return;
    }

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
      if (!supabase || !boardKey) return;
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
          const mapped: Task[] = data.map((row: any) => {
            const parsed = deserializeDescription(row.description);
            // If the row directly has a category column, prefer that, else fallback to parsed
            const category = row.category || parsed.category || 'General';
            return {
              id: String(row.id),
              title: row.title || 'Untitled',
              description: parsed.description,
              priority: (row.priority as Priority) || 'MEDIUM',
              status: (row.status as TaskStatus) || 'TODO',
              dueDate: row.due_date || row.dueDate || undefined,
              category: category,
              boardKey: row.board_key || boardKey,
              createdAt: typeof row.created_at === 'number'
                ? row.created_at
                : (row.created_at ? new Date(row.created_at).getTime() : Date.now()),
            };
          });

          setTasksState(mapped);
          saveLocalTasks(boardKey, mapped);

          // Auto-register any new categories found in remote data into custom categories
          mapped.forEach((t) => {
            if (t.category) registerCategory(t.category);
          });

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
  }, [boardKey, registerCategory]);

  // Sync to localStorage whenever tasks state updates
  useEffect(() => {
    if (boardKey) {
      saveLocalTasks(boardKey, tasks);
    }
  }, [boardKey, tasks]);

  // ── OPTIMISTIC ACTIONS ──────────────────────────────────────────

  // Add Task
  const addTask = useCallback(
    (payload: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
      const currentBoard = boardKeyRef.current;
      if (!currentBoard) return;

      const category = (payload.category || 'General').trim();
      registerCategory(category);

      const newTask: Task = {
        ...payload,
        category,
        id: generateId(),
        status: 'TODO',
        boardKey: currentBoard,
        createdAt: Date.now(),
      };

      console.log(`[useTasks] Optimistically adding task "${newTask.title}" [${newTask.category}] to board "${currentBoard}"...`);

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

        (async () => {
          try {
            const { data, error } = await supabase
              .from(TABLE_NAME)
              .insert([dbPayload])
              .select();

            if (error) {
              console.error(`[useTasks] Supabase INSERT FAILED on table "${TABLE_NAME}":`, error);
              setSyncStatus('error');
            } else {
              console.log(`[useTasks] Supabase INSERT SUCCESS for task "${newTask.id}"!`, data);
              setSyncStatus('synced');
            }
          } catch (err: any) {
            console.error('[useTasks] Exception during Supabase INSERT:', err);
            setSyncStatus('offline');
          }
        })();
      }
    },
    [registerCategory]
  );

  // Move Task Status
  const moveTaskStatus = useCallback((id: string, direction: 'forward' | 'backward') => {
    const currentBoard = boardKeyRef.current;
    if (!currentBoard) return;
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
            .from(TABLE_NAME)
            .update({ status: targetStatus })
            .eq('id', id)
            .eq('board_key', currentBoard);

          if (error) {
            console.error(`[useTasks] Supabase UPDATE status FAILED:`, error);
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
    if (!currentBoard) return;
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
            .from(TABLE_NAME)
            .update({ priority: targetPriority })
            .eq('id', id)
            .eq('board_key', currentBoard);

          if (error) {
            console.error(`[useTasks] Supabase UPDATE priority FAILED:`, error);
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
    if (!currentBoard) return;

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
            .from(TABLE_NAME)
            .delete()
            .eq('id', id)
            .eq('board_key', currentBoard);

          if (error) {
            console.error(`[useTasks] Supabase DELETE FAILED:`, error);
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

  // Filter tasks by both priority and category
  const filteredTasks = useMemo<Task[]>(() => {
    let result = tasks;

    if (priorityFilter !== 'ALL') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    if (categoryFilter !== 'ALL') {
      result = result.filter((t) => t.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    const PRIORITY_RANK: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return [...result].sort((a, b) => {
      const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (rankDiff !== 0) return rankDiff;
      return b.createdAt - a.createdAt;
    });
  }, [tasks, priorityFilter, categoryFilter]);

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
    categoryFilter,
    availableCategories,
    boardKey,
    syncStatus,
    storageError,
    progress,
    countByStatus,
    createAutoBoard,
    selectBoard,
    leaveBoard,
    addTask,
    moveTaskStatus,
    updateTaskPriority,
    deleteTask,
    setPriorityFilter,
    setCategoryFilter,
    registerCategory,
  };
}
