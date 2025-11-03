import { useState } from 'react'
import { Input, Textarea, Button, Card } from '../../../shared/components/ui'
import type { CreateTaskDto, TaskPriority } from '../../../core/entities/Task'

interface CreateTaskFormProps {
  onSubmit: (dto: CreateTaskDto) => Promise<void>
  isLoading?: boolean
}

export function CreateTaskForm({ onSubmit, isLoading = false }: CreateTaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [estimateMinutes, setEstimateMinutes] = useState<number>(30)
  const [error, setError] = useState<string | null>(null)

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
        priority,
        estimateMinutes,
      })
      
      // Reset form on success
      setTitle('')
      setDescription('')
      setPriority('medium')
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
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isLoading}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimate (minutes)
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
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
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              pattern="[0-9]*"
              value={Number.isFinite(estimateMinutes) ? estimateMinutes : ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (Number.isNaN(val)) {
                  setEstimateMinutes(NaN as unknown as number)
                } else {
                  setEstimateMinutes(val)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., 30"
              disabled={isLoading}
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading || !title.trim()}>
          {isLoading ? 'Creating...' : 'Create Task'}
        </Button>
      </form>
    </Card>
  )
}

