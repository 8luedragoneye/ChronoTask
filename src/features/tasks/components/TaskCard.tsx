import { useDraggable } from '@dnd-kit/core'
import { Checkbox, Button, Card } from '../../../shared/components/ui'
import type { Task } from '../../../core/entities/Task'
import { Trash2, GripVertical } from 'lucide-react'
import { useTaskTypeRepository } from '../../../core/repositories/TaskTypeRepositoryContext'
import { useState, useEffect } from 'react'

interface TaskCardProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  const repository = useTaskTypeRepository()
  const [taskTypeEntity, setTaskTypeEntity] = useState<any>(null)

  useEffect(() => {
    if (task.taskType) {
      repository.getByName(task.taskType).then(setTaskTypeEntity).catch(() => {
        // Fallback to default if not found
        repository.getAll().then(types => {
          const defaultType = types.find(t => t.name === 'work') || types[0]
          setTaskTypeEntity(defaultType)
        })
      })
    }
  }, [task.taskType])

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: {
      type: 'task',
      task,
    },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined
  const handleToggle = () => {
    onToggle(task.id)
  }

  const handleDelete = () => {
    onDelete(task.id)
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div
          {...listeners}
          {...attributes}
          className="pt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="pt-1">
          <Checkbox
            checked={task.completed}
            onChange={handleToggle}
            aria-label={`Mark task "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3
            className={`
              font-medium text-lg
              ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}
            `}
          >
            {task.title}
          </h3>
          
          {task.description && (
            <p
              className={`
                mt-1 text-sm
                ${task.completed ? 'text-gray-400' : 'text-gray-600'}
              `}
            >
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            {task.taskType && taskTypeEntity && (
              <span
                className="px-2 py-0.5 text-xs font-medium rounded text-gray-900"
                style={{
                  backgroundColor: `${taskTypeEntity.color}20`,
                }}
              >
                {taskTypeEntity.name.charAt(0).toUpperCase() + taskTypeEntity.name.slice(1)}
              </span>
            )}
            
            {task.dueDate && (
              <span className="text-xs text-gray-500">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          aria-label={`Delete task "${task.title}"`}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}

