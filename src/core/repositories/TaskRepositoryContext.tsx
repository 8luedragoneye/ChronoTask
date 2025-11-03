import { createContext, useContext, type ReactNode } from 'react'
import type { ITaskRepository } from './ITaskRepository'
import { LocalStorageTaskRepository } from './LocalStorageTaskRepository'

// Create the default repository instance
const defaultRepository = new LocalStorageTaskRepository()

const TaskRepositoryContext = createContext<ITaskRepository>(defaultRepository)

interface TaskRepositoryProviderProps {
  children: ReactNode
  repository?: ITaskRepository
}

/**
 * Provider component that supplies the task repository to the component tree.
 * Allows easy swapping of repository implementations via dependency injection.
 */
export function TaskRepositoryProvider({
  children,
  repository = defaultRepository,
}: TaskRepositoryProviderProps) {
  return (
    <TaskRepositoryContext.Provider value={repository}>
      {children}
    </TaskRepositoryContext.Provider>
  )
}

/**
 * Hook to access the task repository from context.
 */
export function useTaskRepository(): ITaskRepository {
  const repository = useContext(TaskRepositoryContext)
  if (!repository) {
    throw new Error('useTaskRepository must be used within TaskRepositoryProvider')
  }
  return repository
}

