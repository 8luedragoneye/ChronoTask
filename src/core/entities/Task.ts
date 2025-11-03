import type { BaseEntity, ID } from '../types'

// Re-export ID for convenience
export type { ID } from '../types'

export interface Task extends BaseEntity {
  title: string
  description?: string
  completed: boolean
  dueDate?: Date
  taskType?: TaskType
  projectId?: ID
  tags?: string[]
  estimateMinutes: number
  scheduledStart?: Date
}

// TaskType is now a string identifier that can reference either default types or custom types
export type TaskType = string

export interface CreateTaskDto {
  title: string
  description?: string
  dueDate?: Date
  taskType?: TaskType
  projectId?: ID
  tags?: string[]
  estimateMinutes?: number
  scheduledStart?: Date
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  completed?: boolean
  dueDate?: Date
  taskType?: TaskType
  projectId?: ID
  tags?: string[]
  estimateMinutes?: number
  scheduledStart?: Date
}

