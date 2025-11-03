import type { ITaskTypeRepository } from './ITaskTypeRepository'
import type { TaskType, CreateTaskTypeDto, UpdateTaskTypeDto, ID } from '../entities/TaskType'
import { DEFAULT_TASK_TYPES } from '../entities/TaskType'

const STORAGE_KEY = 'chronotask_task_types'

export class LocalStorageTaskTypeRepository implements ITaskTypeRepository {
  private getTaskTypesFromStorage(): TaskType[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) {
      // Initialize with default types
      const defaultTypes: TaskType[] = DEFAULT_TASK_TYPES.map((type) => ({
        ...type,
        id: `default-${type.name}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
        this.saveTaskTypesToStorage(defaultTypes)
        return defaultTypes
      }
      
      const raw = JSON.parse(data) as any[]
      return raw.map((type: any) => ({
        ...type,
        createdAt: new Date(type.createdAt),
        updatedAt: new Date(type.updatedAt),
      })) as TaskType[]
    } catch (error) {
      console.error('Error reading task types from storage:', error)
      // Return defaults on error
      return DEFAULT_TASK_TYPES.map((type) => ({
        ...type,
        id: `default-${type.name}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    }
  }

  private saveTaskTypesToStorage(taskTypes: TaskType[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskTypes))
    } catch (error) {
      console.error('Error saving task types to storage:', error)
      throw new Error('Failed to save task types to storage')
    }
  }

  async getAll(): Promise<TaskType[]> {
    return this.getTaskTypesFromStorage()
  }

  async getById(id: ID): Promise<TaskType | null> {
    const types = this.getTaskTypesFromStorage()
    return types.find(type => type.id === id) || null
  }

  async getByName(name: string): Promise<TaskType | null> {
    const types = this.getTaskTypesFromStorage()
    return types.find(type => type.name.toLowerCase() === name.toLowerCase()) || null
  }

  async create(dto: CreateTaskTypeDto): Promise<TaskType> {
    const types = this.getTaskTypesFromStorage()
    
    // Check if name already exists
    const existing = types.find(t => t.name.toLowerCase() === dto.name.toLowerCase())
    if (existing) {
      throw new Error(`Task type with name "${dto.name}" already exists`)
    }

    const now = new Date()
    const newType: TaskType = {
      id: crypto.randomUUID(),
      name: dto.name.trim(),
      color: dto.color,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    }

    types.push(newType)
    this.saveTaskTypesToStorage(types)
    return newType
  }

  async update(id: ID, updates: UpdateTaskTypeDto): Promise<TaskType> {
    const types = this.getTaskTypesFromStorage()
    const index = types.findIndex(type => type.id === id)
    
    if (index === -1) {
      throw new Error(`Task type with id ${id} not found`)
    }

    // Don't allow updating default types
    if (types[index].isDefault) {
      throw new Error('Cannot update default task types')
    }

    // Check if new name conflicts with existing type
    if (updates.name) {
      const existing = types.find((t, i) => i !== index && t.name.toLowerCase() === updates.name!.toLowerCase())
      if (existing) {
        throw new Error(`Task type with name "${updates.name}" already exists`)
      }
    }

    const updatedType: TaskType = {
      ...types[index],
      ...updates,
      name: updates.name?.trim() || types[index].name,
      updatedAt: new Date(),
    }

    types[index] = updatedType
    this.saveTaskTypesToStorage(types)
    return updatedType
  }

  async delete(id: ID): Promise<void> {
    const types = this.getTaskTypesFromStorage()
    const type = types.find(t => t.id === id)
    
    if (!type) {
      throw new Error(`Task type with id ${id} not found`)
    }

    // Don't allow deleting default types
    if (type.isDefault) {
      throw new Error('Cannot delete default task types')
    }

    const filteredTypes = types.filter(type => type.id !== id)
    this.saveTaskTypesToStorage(filteredTypes)
  }
}

