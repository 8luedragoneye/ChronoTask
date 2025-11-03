import type { TaskType, CreateTaskTypeDto, UpdateTaskTypeDto, ID } from '../entities/TaskType'

export interface ITaskTypeRepository {
  getAll(): Promise<TaskType[]>
  getById(id: ID): Promise<TaskType | null>
  create(dto: CreateTaskTypeDto): Promise<TaskType>
  update(id: ID, updates: UpdateTaskTypeDto): Promise<TaskType>
  delete(id: ID): Promise<void>
  getByName(name: string): Promise<TaskType | null>
}

