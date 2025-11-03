import { useState, useEffect, useCallback } from 'react'
import { useTaskTypeRepository } from '../../../core/repositories/TaskTypeRepositoryContext'
import type { TaskType } from '../../../core/entities/TaskType'

export function useTaskTypes() {
  const repository = useTaskTypeRepository()
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTaskTypes = useCallback(async () => {
    try {
      setIsLoading(true)
      const types = await repository.getAll()
      setTaskTypes(types)
    } catch (error) {
      console.error('Failed to load task types:', error)
    } finally {
      setIsLoading(false)
    }
  }, [repository])

  useEffect(() => {
    loadTaskTypes()
    
    // Listen for storage events to detect changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chronotask_task_types') {
        loadTaskTypes()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    // Listen for custom event for same-tab updates
    const handleTaskTypesUpdated = () => {
      loadTaskTypes()
    }
    window.addEventListener('taskTypesUpdated', handleTaskTypesUpdated)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('taskTypesUpdated', handleTaskTypesUpdated)
    }
  }, [loadTaskTypes])

  const refresh = useCallback(() => {
    loadTaskTypes()
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('taskTypesUpdated'))
  }, [loadTaskTypes])

  return { taskTypes, isLoading, refresh }
}

