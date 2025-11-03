import { create } from 'zustand'
import type { Task, CreateTaskDto, UpdateTaskDto, ID } from '../../core/entities/Task'
import { TaskService } from '../../core/services/TaskService'
import type { ITaskRepository } from '../../core/repositories/ITaskRepository'

interface TaskStore {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setRepository: (repository: ITaskRepository) => void
  loadTasks: () => Promise<void>
  createTask: (dto: CreateTaskDto) => Promise<void>
  updateTask: (id: ID, updates: UpdateTaskDto) => Promise<void>
  deleteTask: (id: ID) => Promise<void>
  toggleTaskCompletion: (id: ID) => Promise<void>
  
  // Selectors
  getTaskById: (id: ID) => Task | undefined
  getActiveTasks: () => Task[]
  getCompletedTasks: () => Task[]
}

// Service instance (will be initialized with repository)
let taskService: TaskService | null = null

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  setRepository: (repository: ITaskRepository) => {
    taskService = new TaskService(repository)
    // Load tasks asynchronously after setting repository
    setTimeout(() => {
      get().loadTasks().catch((error) => {
        console.error('Failed to load tasks:', error)
      })
    }, 0)
  },

  loadTasks: async () => {
    if (!taskService) {
      set({ error: 'Task service not initialized' })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const tasks = await taskService.getAllTasks()
      set({ tasks, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load tasks',
        isLoading: false,
      })
    }
  },

  createTask: async (dto: CreateTaskDto) => {
    if (!taskService) {
      set({ error: 'Task service not initialized' })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const newTask = await taskService.createTask(dto)
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create task',
        isLoading: false,
      })
      throw error
    }
  },

  updateTask: async (id: ID, updates: UpdateTaskDto) => {
    if (!taskService) {
      set({ error: 'Task service not initialized' })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const updatedTask = await taskService.updateTask(id, updates)
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? updatedTask : task
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update task',
        isLoading: false,
      })
      throw error
    }
  },

  deleteTask: async (id: ID) => {
    if (!taskService) {
      set({ error: 'Task service not initialized' })
      return
    }

    set({ isLoading: true, error: null })
    try {
      await taskService.deleteTask(id)
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete task',
        isLoading: false,
      })
      throw error
    }
  },

  toggleTaskCompletion: async (id: ID) => {
    if (!taskService) {
      set({ error: 'Task service not initialized' })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const updatedTask = await taskService.toggleTaskCompletion(id)
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? updatedTask : task
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to toggle task',
        isLoading: false,
      })
      throw error
    }
  },

  getTaskById: (id: ID) => {
    return get().tasks.find((task) => task.id === id)
  },

  getActiveTasks: () => {
    return get().tasks.filter((task) => !task.completed)
  },

  getCompletedTasks: () => {
    return get().tasks.filter((task) => task.completed)
  },
}))

