// App.tsx — CampusSprint Mobile Kanban Board root
// Features Hybrid Sync (LocalStorage + Supabase) + Optimistic Updates

import { useState } from 'react';
import { useTasks } from './hooks';
import { Header, KanbanBoard, AddTaskModal, DeleteConfirmModal } from './components';
import type { Task } from './types/task';

export default function App() {
  const {
    filteredTasks,
    countByStatus,
    priorityFilter,
    boardKey,
    syncStatus,
    progress,
    storageError,
    setBoardKey,
    addTask,
    moveTaskStatus,
    updateTaskPriority,
    deleteTask,
    setPriorityFilter,
  } = useTasks();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const handleDeleteConfirm = (id: string) => {
    deleteTask(id);
    setTaskToDelete(null);
  };

  return (
    <div className="app-container bg-[#f7f9fb] text-[#191c1e] min-h-screen flex flex-col antialiased selection:bg-slate-900 selection:text-white">
      {/* Header with App Title, Progress Counter, Board Key Sync, and Priority Filters */}
      <Header
        progress={progress}
        priorityFilter={priorityFilter}
        boardKey={boardKey}
        syncStatus={syncStatus}
        onFilterChange={setPriorityFilter}
        onBoardKeyChange={setBoardKey}
      />

      {/* Storage Notification (Accessible alert) */}
      {storageError && (
        <div
          role="alert"
          className="mx-4 mt-3 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-[12px] text-red-700 font-medium"
        >
          Storage error: {storageError}
        </div>
      )}

      {/* Main Kanban Content Area */}
      <main className="flex-1 flex flex-col">
        <KanbanBoard
          tasks={filteredTasks}
          countByStatus={countByStatus}
          onMove={moveTaskStatus}
          onTogglePriority={updateTaskPriority}
          onDeleteRequest={(task) => setTaskToDelete(task)}
          onOpenNewTask={() => setIsAddModalOpen(true)}
        />
      </main>

      {/* Floating Action Button & Add Task Bottom Sheet */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onOpen={() => setIsAddModalOpen(true)}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addTask}
      />

      {/* Fast Confirmation Dialog for Deletions */}
      <DeleteConfirmModal
        task={taskToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}
