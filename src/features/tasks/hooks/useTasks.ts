import { useEffect, useRef } from 'react'
import { useTaskRepository } from '../../../core/repositories/TaskRepositoryContext'
import { useTaskStore } from '../../../infrastructure/state/taskStore'

/**
 * Custom hook that provides task management functionality.
 * Connects the Zustand store with the repository through dependency injection.
 */
export function useTasks() {
  const repository = useTaskRepository()
  const store = useTaskStore()
  const initializedRef = useRef(false)

  // Initialize store with repository when repository is available (only once)
  useEffect(() => {
    if (repository && !initializedRef.current) {
      initializedRef.current = true
      store.setRepository(repository)
    }
  }, [repository])

  return {
    tasks: store.tasks,
    isLoading: store.isLoading,
    error: store.error,
    loadTasks: store.loadTasks,
    createTask: store.createTask,
    updateTask: store.updateTask,
    deleteTask: store.deleteTask,
    toggleTaskCompletion: store.toggleTaskCompletion,
    getTaskById: store.getTaskById,
    getActiveTasks: store.getActiveTasks,
    getCompletedTasks: store.getCompletedTasks,
  }
}

