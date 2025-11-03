import type { Task, CreateTaskDto, UpdateTaskDto, ID } from '../entities/Task'

/**
 * Repository interface for task data access.
 * This abstraction allows easy swapping between different storage implementations
 * (localStorage, API, IndexedDB, etc.)
 */
export interface ITaskRepository {
  /**
   * Get all tasks
   */
  getAll(): Promise<Task[]>

  /**
   * Get a task by ID
   */
  getById(id: ID): Promise<Task | null>

  /**
   * Create a new task
   */
  create(task: CreateTaskDto): Promise<Task>

  /**
   * Update an existing task
   */
  update(id: ID, updates: UpdateTaskDto): Promise<Task>

  /**
   * Delete a task
   */
  delete(id: ID): Promise<void>

  /**
   * Get tasks by project ID
   */
  getByProjectId(projectId: ID): Promise<Task[]>

  /**
   * Get tasks by completion status
   */
  getByCompletionStatus(completed: boolean): Promise<Task[]>
}

