import type { Task } from '../../../core/entities/Task'
import { formatTime, addMinutes } from '../utils/time'

interface TimeBlockProps {
  task: Task
  workStartHour: number
  pixelsPerMinute: number
}

export function TimeBlock({ task, workStartHour, pixelsPerMinute }: TimeBlockProps) {
  if (!task.scheduledStart) return null

  const startTime = task.scheduledStart
  const endTime = addMinutes(startTime, task.estimateMinutes)
  
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

  return (
    <div
      className={`absolute left-12 right-2 border-l-4 rounded-r px-2 py-1 text-sm ${priorityColor} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
      style={{
        top: `${Math.max(0, topPx)}px`,
        height: `${Math.max(40, heightPx)}px`,
      }}
      title={`${task.title} - ${formatTime(startTime)} to ${formatTime(endTime)}`}
    >
      <div className="font-medium truncate">{task.title}</div>
      <div className="text-xs opacity-75">
        {formatTime(startTime)} - {formatTime(endTime)}
      </div>
      {task.priority && (
        <div className="text-xs mt-1">
          <span className="font-medium">{task.priority}</span>
          {' • '}
          <span>{task.estimateMinutes}m</span>
        </div>
      )}
    </div>
  )
}

