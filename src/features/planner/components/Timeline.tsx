import { useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { TimeBlock } from './TimeBlock'
import { formatTime } from '../utils/time'
import type { Task } from '../../../core/entities/Task'

interface TimelineProps {
  tasks: Task[]
  selectedDate: Date
  workStartHour?: number
  workEndHour?: number
  onScheduleTask?: (taskId: string, scheduledStart: Date) => void
  onDeleteTask?: (taskId: string) => void
  dropIndicator?: { y: number; time: string; hasOverlap?: boolean } | null
}

export function Timeline({
  tasks,
  selectedDate,
  workStartHour = 8,
  workEndHour = 18,
  onScheduleTask,
  onDeleteTask,
  dropIndicator,
}: TimelineProps) {
  const totalWorkHours = workEndHour - workStartHour
  const totalWorkMinutes = totalWorkHours * 60

  // Generate time slots for the grid
  const timeSlots: number[] = []
  for (let hour = workStartHour; hour < workEndHour; hour++) {
    timeSlots.push(hour)
  }

  // Filter tasks scheduled for the selected day
  const scheduledTasks = tasks.filter((task) => {
    if (!task.scheduledStart) return false
    const taskDate = task.scheduledStart
    return (
      taskDate.getFullYear() === selectedDate.getFullYear() &&
      taskDate.getMonth() === selectedDate.getMonth() &&
      taskDate.getDate() === selectedDate.getDate()
    )
  })

  // Use pixel-based positioning: fit on screen (calculate based on viewport height)
  // Target: ~600px height for 10 hours = ~1px per minute
  const pixelsPerMinute = 1
  const totalHeight = totalWorkMinutes * pixelsPerMinute

  const containerRef = useRef<HTMLDivElement>(null)
  
  const { setNodeRef, isOver } = useDroppable({
    id: 'timeline-drop-zone',
    data: {
      type: 'timeline',
      selectedDate,
      workStartHour,
      workEndHour,
      pixelsPerMinute,
      onScheduleTask,
      containerRef,
    },
  })

  // Combine refs
  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node)
    containerRef.current = node
  }

  return (
    <div className="flex-1 overflow-hidden bg-white">
      <div
        ref={combinedRef}
        className={`relative ${isOver ? 'bg-blue-50' : ''}`}
        style={{ height: `${totalHeight}px`, minHeight: `${totalHeight}px`, paddingTop: '16px' }}
        onDrop={(e) => {
          e.preventDefault()
          // Handle is managed by DndContext
        }}
      >
        {/* Time grid lines */}
        {timeSlots.map((hour) => {
          const topPx = (hour - workStartHour) * 60 * pixelsPerMinute + 16 // Add padding at top
          return (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-gray-200"
              style={{ top: `${topPx}px` }}
            >
              <div className="absolute left-0 top-0 px-2 text-xs text-gray-500 bg-white" style={{ transform: 'translateY(-50%)' }}>
                {formatTime(new Date(2000, 0, 1, hour, 0))}
              </div>
            </div>
          )
        })}

        {/* Half-hour grid lines (lighter) */}
        {timeSlots.map((hour) => {
          if (hour === workEndHour - 1) return null
          const topPx = (hour + 0.5 - workStartHour) * 60 * pixelsPerMinute + 16 // Add padding at top
          return (
            <div
              key={`${hour}-half`}
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{ top: `${topPx}px` }}
            />
          )
        })}

        {/* 15-minute grid lines (very light) */}
        {timeSlots.flatMap((hour) => [
          hour,
          hour + 0.25,
          hour + 0.5,
          hour + 0.75,
        ]).filter((time) => {
          const totalTime = workStartHour + (time - workStartHour)
          return totalTime < workEndHour
        }).map((time) => {
          const topPx = (time - workStartHour) * 60 * pixelsPerMinute + 16 // Add padding at top
          const hour = Math.floor(time)
          const minute = (time % 1) * 60
          return (
            <div
              key={`${hour}-${minute}`}
              className="absolute left-12 right-0 border-t border-gray-50"
              style={{ top: `${topPx}px` }}
            />
          )
        })}

        {/* Drop indicator line */}
        {dropIndicator && (
          <div
            className={`absolute left-0 right-0 border-t-2 z-10 pointer-events-none ${
              dropIndicator.hasOverlap ? 'border-orange-500' : 'border-red-500'
            }`}
            style={{ top: `${dropIndicator.y}px` }}
          >
            <div className={`absolute left-0 top-0 px-2 py-0.5 text-white text-xs font-semibold rounded-r ${
              dropIndicator.hasOverlap ? 'bg-orange-500' : 'bg-red-500'
            }`}>
              {dropIndicator.hasOverlap ? '⚠ Overlap' : dropIndicator.time}
            </div>
          </div>
        )}

               {/* Task blocks */}
               {scheduledTasks.map((task) => (
                 <TimeBlock
                   key={task.id}
                   task={task}
                   workStartHour={workStartHour}
                   pixelsPerMinute={pixelsPerMinute}
                   onDelete={onDeleteTask}
                 />
               ))}
      </div>
    </div>
  )
}

