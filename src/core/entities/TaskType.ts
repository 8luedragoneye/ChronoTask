import type { BaseEntity } from '../types'
import type { ID } from '../types'

// Re-export ID for convenience
export type { ID }

export interface TaskType extends BaseEntity {
  name: string
  color: string // Hex color code (e.g., "#FF5733")
  isDefault?: boolean // For predefined types
}

export interface CreateTaskTypeDto {
  name: string
  color: string
}

export interface UpdateTaskTypeDto {
  name?: string
  color?: string
}

// Default task types
export const DEFAULT_TASK_TYPES: Omit<TaskType, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'work', color: '#3B82F6', isDefault: true }, // Blue
  { name: 'yt', color: '#EF4444', isDefault: true }, // Red
  { name: 'learn', color: '#10B981', isDefault: true }, // Green
  { name: 'code', color: '#8B5CF6', isDefault: true }, // Purple
]

