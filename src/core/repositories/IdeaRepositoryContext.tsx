import { createContext, useContext, type ReactNode } from 'react'
import type { IIdeaRepository } from './IIdeaRepository'
import { LocalStorageIdeaRepository } from './LocalStorageIdeaRepository'

const defaultRepository = new LocalStorageIdeaRepository()

const IdeaRepositoryContext = createContext<IIdeaRepository>(defaultRepository)

interface IdeaRepositoryProviderProps {
  children: ReactNode
  repository?: IIdeaRepository
}

/**
 * Provider component that supplies the idea repository to the component tree.
 */
export function IdeaRepositoryProvider({ children, repository = defaultRepository }: IdeaRepositoryProviderProps) {
  return (
    <IdeaRepositoryContext.Provider value={repository}>
      {children}
    </IdeaRepositoryContext.Provider>
  )
}

/**
 * Hook to access the idea repository from context.
 */
export function useIdeaRepository(): IIdeaRepository {
  const context = useContext(IdeaRepositoryContext)
  if (!context) {
    throw new Error('useIdeaRepository must be used within an IdeaRepositoryProvider')
  }
  return context
}

