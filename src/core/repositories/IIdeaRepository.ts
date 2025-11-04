import type { Idea, CreateIdeaDto, UpdateIdeaDto, ID } from '../entities/Idea'

/**
 * Repository interface for idea data access.
 */
export interface IIdeaRepository {
  /**
   * Get all ideas
   */
  getAll(): Promise<Idea[]>

  /**
   * Get an idea by ID
   */
  getById(id: ID): Promise<Idea | null>

  /**
   * Create a new idea
   */
  create(idea: CreateIdeaDto): Promise<Idea>

  /**
   * Update an existing idea
   */
  update(id: ID, updates: UpdateIdeaDto): Promise<Idea>

  /**
   * Delete an idea
   */
  delete(id: ID): Promise<void>
}

