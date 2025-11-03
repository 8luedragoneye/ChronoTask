// Shared TypeScript types across the application

export type ID = string

export interface BaseEntity {
  id: ID
  createdAt: Date
  updatedAt: Date
}

