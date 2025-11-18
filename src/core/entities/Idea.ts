import type { BaseEntity, ID } from '../types'

export type { ID }

export interface Idea extends BaseEntity {
  name: string
  description?: string
  topic?: string
  parentId?: ID
  positionX?: number
  positionY?: number
}

export interface CreateIdeaDto {
  name: string
  description?: string
  topic?: string
  parentId?: ID
  positionX?: number
  positionY?: number
}

export interface UpdateIdeaDto {
  name?: string
  description?: string
  topic?: string
  parentId?: ID
  positionX?: number
  positionY?: number
}

