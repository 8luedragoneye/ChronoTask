import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { LocalStorageTaskTypeRepository } from './LocalStorageTaskTypeRepository'
import type { ITaskTypeRepository } from './ITaskTypeRepository'

const TaskTypeRepositoryContext = createContext<ITaskTypeRepository | null>(null)

interface TaskTypeRepositoryProviderProps {
  children: ReactNode
  repository?: ITaskTypeRepository
}

export function TaskTypeRepositoryProvider({
  children,
  repository,
}: TaskTypeRepositoryProviderProps) {
  const repo = repository || new LocalStorageTaskTypeRepository()

  return (
    <TaskTypeRepositoryContext.Provider value={repo}>
      {children}
    </TaskTypeRepositoryContext.Provider>
  )
}

export function useTaskTypeRepository(): ITaskTypeRepository {
  const repository = useContext(TaskTypeRepositoryContext)
  if (!repository) {
    throw new Error('useTaskTypeRepository must be used within TaskTypeRepositoryProvider')
  }
  return repository
}

