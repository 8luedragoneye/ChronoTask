import type { IIdeaRepository } from './IIdeaRepository'
import type { Idea, CreateIdeaDto, UpdateIdeaDto, ID } from '../entities/Idea'

const STORAGE_KEY = 'chronotask_ideas'

export class LocalStorageIdeaRepository implements IIdeaRepository {
  private getIdeasFromStorage(): Idea[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []

      const raw = JSON.parse(data) as any[]
      return raw.map((idea: any) => ({
        ...idea,
        createdAt: new Date(idea.createdAt),
        updatedAt: new Date(idea.updatedAt),
      })) as Idea[]
    } catch (error) {
      console.error('Error reading ideas from storage:', error)
      return []
    }
  }

  private saveIdeasToStorage(ideas: Idea[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas))
    } catch (error) {
      console.error('Error saving ideas to storage:', error)
    }
  }

  async getAll(): Promise<Idea[]> {
    return this.getIdeasFromStorage()
  }

  async getById(id: ID): Promise<Idea | null> {
    const ideas = this.getIdeasFromStorage()
    return ideas.find(idea => idea.id === id) || null
  }

  async create(dto: CreateIdeaDto): Promise<Idea> {
    const ideas = this.getIdeasFromStorage()
    const now = new Date()

    const newIdea: Idea = {
      id: crypto.randomUUID(),
      name: dto.name.trim(),
      description: dto.description?.trim() || undefined,
      topic: dto.topic?.trim() || undefined,
      parentId: dto.parentId,
      positionX: dto.positionX,
      positionY: dto.positionY,
      createdAt: now,
      updatedAt: now,
    }

    ideas.push(newIdea)
    this.saveIdeasToStorage(ideas)
    return newIdea
  }

  async update(id: ID, updates: UpdateIdeaDto): Promise<Idea> {
    const ideas = this.getIdeasFromStorage()
    const index = ideas.findIndex(idea => idea.id === id)

    if (index === -1) {
      throw new Error(`Idea with id ${id} not found`)
    }

    const updatedIdea: Idea = {
      ...ideas[index],
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.description !== undefined && { description: updates.description?.trim() || undefined }),
      ...(updates.topic !== undefined && { topic: updates.topic?.trim() || undefined }),
      ...(updates.parentId !== undefined && { parentId: updates.parentId }),
      ...(updates.positionX !== undefined && { positionX: updates.positionX }),
      ...(updates.positionY !== undefined && { positionY: updates.positionY }),
      updatedAt: new Date(),
    }

    ideas[index] = updatedIdea
    this.saveIdeasToStorage(ideas)
    return updatedIdea
  }

  async delete(id: ID): Promise<void> {
    const ideas = this.getIdeasFromStorage()
    const filtered = ideas.filter(idea => idea.id !== id)
    this.saveIdeasToStorage(filtered)
  }
}

