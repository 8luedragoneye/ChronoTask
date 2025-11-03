import type { BaseEntity, ID } from '../types'

// Re-export ID for convenience
export type { ID } from '../types'

export interface Task extends BaseEntity {
  title: string
  description?: string
  completed: boolean
  dueDate?: Date
  priority?: TaskPriority
  projectId?: ID
  tags?: string[]
}

export type TaskPriority = 'low' | 'medium' | 'high'

export interface CreateTaskDto {
  title: string
  description?: string
  dueDate?: Date
  priority?: TaskPriority
  projectId?: ID
  tags?: string[]
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  completed?: boolean
  dueDate?: Date
  priority?: TaskPriority
  projectId?: ID
  tags?: string[]
}

