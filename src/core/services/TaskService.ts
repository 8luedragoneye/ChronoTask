import type { ITaskRepository } from '../repositories/ITaskRepository'
import type { Task, CreateTaskDto, UpdateTaskDto, ID } from '../entities/Task'

/**
 * Service layer for task business logic.
 * Handles validation, transformations, and orchestrates repository operations.
 */
export class TaskService {
  #repository: ITaskRepository

  constructor(repository: ITaskRepository) {
    this.#repository = repository
  }

  /**
   * Validate task title
   */
  #validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Task title is required')
    }
    if (title.trim().length > 200) {
      throw new Error('Task title must be 200 characters or less')
    }
  }

  /**
   * Validate task description
   */
  #validateDescription(description?: string): void {
    if (description && description.length > 1000) {
      throw new Error('Task description must be 1000 characters or less')
    }
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    return this.#repository.getAll()
  }

  /**
   * Get a task by ID
   */
  async getTaskById(id: ID): Promise<Task | null> {
    return this.#repository.getById(id)
  }

  /**
   * Create a new task with validation
   */
  async createTask(dto: CreateTaskDto): Promise<Task> {
    // Validate input
    this.#validateTitle(dto.title)
    this.#validateDescription(dto.description)

    // Normalize data
    const normalizedDto: CreateTaskDto = {
      ...dto,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      tags: dto.tags?.filter(tag => tag.trim().length > 0).map(tag => tag.trim()),
    }

    return this.#repository.create(normalizedDto)
  }

  /**
   * Update an existing task with validation
   */
  async updateTask(id: ID, updates: UpdateTaskDto): Promise<Task> {
    // Validate updates
    if (updates.title !== undefined) {
      this.#validateTitle(updates.title)
    }
    if (updates.description !== undefined) {
      this.#validateDescription(updates.description)
    }

    // Normalize data
    const normalizedUpdates: UpdateTaskDto = {
      ...updates,
      title: updates.title?.trim(),
      description: updates.description?.trim(),
      tags: updates.tags?.filter(tag => tag.trim().length > 0).map(tag => tag.trim()),
    }

    return this.#repository.update(id, normalizedUpdates)
  }

  /**
   * Delete a task
   */
  async deleteTask(id: ID): Promise<void> {
    return this.#repository.delete(id)
  }

  /**
   * Toggle task completion status
   */
  async toggleTaskCompletion(id: ID): Promise<Task> {
    const task = await this.#repository.getById(id)
    if (!task) {
      throw new Error(`Task with id ${id} not found`)
    }

    return this.#repository.update(id, { completed: !task.completed })
  }

  /**
   * Get tasks by project
   */
  async getTasksByProject(projectId: ID): Promise<Task[]> {
    return this.#repository.getByProjectId(projectId)
  }

  /**
   * Get completed tasks
   */
  async getCompletedTasks(): Promise<Task[]> {
    return this.#repository.getByCompletionStatus(true)
  }

  /**
   * Get active (incomplete) tasks
   */
  async getActiveTasks(): Promise<Task[]> {
    return this.#repository.getByCompletionStatus(false)
  }
}

