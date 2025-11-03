import { useState, useEffect } from 'react'
import { Input, Textarea, Button, Card } from '../../../shared/components/ui'
import type { CreateTaskDto } from '../../../core/entities/Task'
import { useTaskTypes } from '../../task-types/hooks/useTaskTypes'
import { Plus } from 'lucide-react'
import { TaskTypeManager } from '../../task-types'

interface CreateTaskFormProps {
  onSubmit: (dto: CreateTaskDto) => Promise<void>
  isLoading?: boolean
}

export function CreateTaskForm({ onSubmit, isLoading = false }: CreateTaskFormProps) {
  const { taskTypes } = useTaskTypes()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [taskType, setTaskType] = useState<string>('work')
  const [estimateMinutes, setEstimateMinutes] = useState<number>(30)
  const [error, setError] = useState<string | null>(null)
  const [showTaskTypeManager, setShowTaskTypeManager] = useState(false)

  // Update task type when task types load
  useEffect(() => {
    if (taskTypes.length > 0) {
      // Only set if current type doesn't exist in the list
      const typeExists = taskTypes.some(t => t.name === taskType)
      if (!typeExists) {
        setTaskType(taskTypes[0].name)
      }
    }
  }, [taskTypes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Task title is required')
      return
    }

    if (!estimateMinutes || estimateMinutes <= 0) {
      setError('Estimate must be a positive number of minutes')
      return
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        taskType,
        estimateMinutes,
      })
      
      // Reset form on success
      setTitle('')
      setDescription('')
      if (taskTypes.length > 0) {
        setTaskType(taskTypes[0].name)
      }
      setEstimateMinutes(30)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    }
  }

  const presetMinutes = [15, 30, 45, 60, 90, 120]

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title..."
          error={error || undefined}
          required
          disabled={isLoading}
        />

        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task description..."
          rows={3}
          disabled={isLoading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <div className="flex gap-2">
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={isLoading}
              >
                {taskTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowTaskTypeManager(true)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isLoading}
                title="Manage task types"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimate (minutes)
            </label>
            <div className="flex gap-2 flex-wrap">
              {presetMinutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEstimateMinutes(m)}
                  className={`px-3 py-1.5 text-sm rounded border ${
                    estimateMinutes === m
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={isLoading}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isLoading || !title.trim()}>
          {isLoading ? 'Creating...' : 'Create Task'}
        </Button>
      </form>

      {showTaskTypeManager && (
        <div className="mt-4">
          <TaskTypeManager onClose={() => setShowTaskTypeManager(false)} />
        </div>
      )}
    </Card>
  )
}

