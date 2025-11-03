import { useDraggable } from '@dnd-kit/core'
import type { Task } from '../../../core/entities/Task'
import { formatTime, addMinutes } from '../utils/time'
import { GripVertical, Trash2 } from 'lucide-react'
import { Button } from '../../../shared/components/ui'

interface TimeBlockProps {
  task: Task
  workStartHour: number
  pixelsPerMinute: number
  onDelete?: (id: string) => void
}

export function TimeBlock({ task, workStartHour, pixelsPerMinute, onDelete }: TimeBlockProps) {
  if (!task.scheduledStart) return null

  // Debug: log task to see if title exists
  if (!task.title) {
    console.warn('TimeBlock: Task missing title', task)
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: {
      type: 'task',
      task,
    },
  })

  const startTime = task.scheduledStart
  const endTime = addMinutes(startTime, task.estimateMinutes || 30)
  
  const startHour = startTime.getHours()
  const startMinute = startTime.getMinutes()
  
  // Calculate position from work start (e.g., 8:00) in pixels
  const minutesFromStart = (startHour - workStartHour) * 60 + startMinute
  const topPx = minutesFromStart * pixelsPerMinute
  const heightPx = task.estimateMinutes * pixelsPerMinute

  const priorityColors = {
    high: 'bg-red-100 border-red-300 text-red-900',
    medium: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    low: 'bg-blue-100 border-blue-300 text-blue-900',
  }

  const priorityColor = priorityColors[task.priority || 'medium']

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete && confirm(`Are you sure you want to delete "${task.title}"?`)) {
      onDelete(task.id)
    }
  }

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
        style={{
          ...style,
          position: 'absolute',
          left: '48px',
          right: '8px',
          top: `${Math.max(0, topPx)}px`,
          height: `${Math.max(50, heightPx)}px`,
          minHeight: '50px',
        }}
      className={`border-l-4 rounded-r px-2 py-1 text-sm ${priorityColor} shadow-sm hover:shadow-md transition-shadow ${isDragging ? 'opacity-50 z-50' : ''}`}
      title={`${task.title || 'Untitled Task'} - ${formatTime(startTime)} to ${formatTime(endTime)}`}
    >
      <div className="flex items-start gap-2 h-full">
        <div
          {...listeners}
          {...attributes}
          className="pt-0.5 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <GripVertical className="w-3 h-3" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-start overflow-hidden py-0.5">
          <div className="text-xs opacity-90 font-normal leading-none mb-1 whitespace-nowrap">
            {formatTime(startTime)} - {formatTime(endTime)}
          </div>
          <div 
            className="font-semibold truncate text-xs leading-tight" 
            style={{ 
              color: 'inherit', 
              minHeight: '14px', 
              display: 'block',
              visibility: 'visible',
              opacity: 1,
            }}
          >
            {task?.title ? String(task.title) : 'Untitled Task'}
          </div>
        </div>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="flex-shrink-0 h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            aria-label={`Delete task "${task.title}"`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

