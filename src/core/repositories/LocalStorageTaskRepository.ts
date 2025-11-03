import type { ITaskRepository } from './ITaskRepository'
import type { Task, CreateTaskDto, UpdateTaskDto, ID } from '../entities/Task'

const STORAGE_KEY = 'chronotask_tasks'

/**
 * LocalStorage implementation of ITaskRepository.
 * Stores tasks in browser localStorage as JSON.
 */
export class LocalStorageTaskRepository implements ITaskRepository {
  private getTasksFromStorage(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []
      
      const raw = JSON.parse(data) as any[]
      // Convert date strings back to Date objects and fill defaults
      return raw.map((task: any) => {
        const createdAt = task.createdAt ? new Date(task.createdAt) : new Date()
        const updatedAt = task.updatedAt ? new Date(task.updatedAt) : createdAt
        const dueDate = task.dueDate ? new Date(task.dueDate) : undefined
        const scheduledStart = task.scheduledStart ? new Date(task.scheduledStart) : undefined
        const estimateMinutes = typeof task.estimateMinutes === 'number' && !isNaN(task.estimateMinutes)
          ? task.estimateMinutes
          : 30

        return {
          ...task,
          title: task.title || 'Untitled Task', // Ensure title always exists
          createdAt,
          updatedAt,
          dueDate,
          scheduledStart,
          estimateMinutes,
        } as Task
      })
    } catch (error) {
      console.error('Error reading tasks from storage:', error)
      return []
    }
  }

  private saveTasksToStorage(tasks: Task[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (error) {
      console.error('Error saving tasks to storage:', error)
      throw new Error('Failed to save tasks to storage')
    }
  }

  async getAll(): Promise<Task[]> {
    const tasks = this.getTasksFromStorage()
    // Migrate: Fix any tasks missing required fields
    let needsSave = false
    const fixedTasks = tasks.map(task => {
      if (!task.title || task.title === 'undefined') {
        needsSave = true
        return { ...task, title: task.title || 'Untitled Task' }
      }
      return task
    })
    
    if (needsSave) {
      this.saveTasksToStorage(fixedTasks)
      return fixedTasks
    }
    
    return tasks
  }

  async getById(id: ID): Promise<Task | null> {
    const tasks = this.getTasksFromStorage()
    return tasks.find(task => task.id === id) || null
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const tasks = this.getTasksFromStorage()
    const now = new Date()
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: dto.title,
      description: dto.description,
      completed: false,
      dueDate: dto.dueDate,
      priority: dto.priority || 'medium',
      projectId: dto.projectId,
      tags: dto.tags || [],
      createdAt: now,
      updatedAt: now,
      estimateMinutes: dto.estimateMinutes && dto.estimateMinutes > 0 ? dto.estimateMinutes : 30,
      scheduledStart: dto.scheduledStart,
    }

    tasks.push(newTask)
    this.saveTasksToStorage(tasks)
    return newTask
  }

  async update(id: ID, updates: UpdateTaskDto): Promise<Task> {
    const tasks = this.getTasksFromStorage()
    const index = tasks.findIndex(task => task.id === id)
    
    if (index === -1) {
      throw new Error(`Task with id ${id} not found`)
    }

    const updatedTask: Task = {
      ...tasks[index],
      ...updates,
      // Preserve title if not being updated
      title: updates.title !== undefined ? updates.title : tasks[index].title,
      // Preserve estimateMinutes if not being updated
      estimateMinutes: updates.estimateMinutes !== undefined
        ? (updates.estimateMinutes > 0 ? updates.estimateMinutes : tasks[index].estimateMinutes)
        : tasks[index].estimateMinutes,
      // Preserve scheduledStart if not being updated
      scheduledStart: updates.scheduledStart !== undefined
        ? updates.scheduledStart
        : tasks[index].scheduledStart,
      updatedAt: new Date(),
    }
    
    // Ensure required fields are always present
    if (!updatedTask.title) {
      updatedTask.title = tasks[index].title || 'Untitled Task'
    }

    tasks[index] = updatedTask
    this.saveTasksToStorage(tasks)
    return updatedTask
  }

  async delete(id: ID): Promise<void> {
    const tasks = this.getTasksFromStorage()
    const filteredTasks = tasks.filter(task => task.id !== id)
    
    if (filteredTasks.length === tasks.length) {
      throw new Error(`Task with id ${id} not found`)
    }

    this.saveTasksToStorage(filteredTasks)
  }

  async getByProjectId(projectId: ID): Promise<Task[]> {
    const tasks = this.getTasksFromStorage()
    return tasks.filter(task => task.projectId === projectId)
  }

  async getByCompletionStatus(completed: boolean): Promise<Task[]> {
    const tasks = this.getTasksFromStorage()
    return tasks.filter(task => task.completed === completed)
  }
}

