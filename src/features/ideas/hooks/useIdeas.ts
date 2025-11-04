import { useState, useEffect, useCallback } from 'react'
import { useIdeaRepository } from '../../../core/repositories/IdeaRepositoryContext'
import type { Idea, CreateIdeaDto, UpdateIdeaDto } from '../../../core/entities/Idea'

const IDEAS_UPDATED_EVENT = 'ideasUpdated'

/**
 * Custom hook that provides idea management functionality.
 */
export function useIdeas() {
  const repository = useIdeaRepository()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadIdeas = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const loadedIdeas = await repository.getAll()
      setIdeas(loadedIdeas)
    } catch (err) {
      console.error('Failed to load ideas:', err)
      setError(err instanceof Error ? err.message : 'Failed to load ideas')
    } finally {
      setIsLoading(false)
    }
  }, [repository])

  useEffect(() => {
    loadIdeas()

    // Listen for storage changes and custom events
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'chronotask_ideas') {
        loadIdeas()
      }
    }

    const handleIdeasUpdated = () => {
      loadIdeas()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener(IDEAS_UPDATED_EVENT, handleIdeasUpdated)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(IDEAS_UPDATED_EVENT, handleIdeasUpdated)
    }
  }, [loadIdeas])

  const createIdea = useCallback(async (dto: CreateIdeaDto): Promise<Idea> => {
    try {
      const newIdea = await repository.create(dto)
      await loadIdeas()
      // Dispatch event to notify other instances
      window.dispatchEvent(new Event(IDEAS_UPDATED_EVENT))
      return newIdea
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create idea'
      setError(errorMessage)
      throw err
    }
  }, [repository, loadIdeas])

  const updateIdea = useCallback(async (id: string, updates: UpdateIdeaDto): Promise<void> => {
    try {
      await repository.update(id, updates)
      await loadIdeas()
      // Dispatch event to notify other instances
      window.dispatchEvent(new Event(IDEAS_UPDATED_EVENT))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update idea'
      setError(errorMessage)
      throw err
    }
  }, [repository, loadIdeas])

  const deleteIdea = useCallback(async (id: string): Promise<void> => {
    try {
      await repository.delete(id)
      await loadIdeas()
      // Dispatch event to notify other instances
      window.dispatchEvent(new Event(IDEAS_UPDATED_EVENT))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete idea'
      setError(errorMessage)
      throw err
    }
  }, [repository, loadIdeas])

  return {
    ideas,
    isLoading,
    error,
    createIdea,
    updateIdea,
    deleteIdea,
    loadIdeas,
  }
}

