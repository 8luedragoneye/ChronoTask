import { useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { TimeBlock } from './TimeBlock'
import { BreakBlock } from './BreakBlock'
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
  workdayActive?: boolean
}

export function Timeline({
  tasks,
  selectedDate,
  workStartHour = 8,
  workEndHour = 18,
  onScheduleTask,
  onDeleteTask,
  dropIndicator,
  workdayActive = false,
}: TimelineProps) {
  const totalWorkHours = workEndHour - workStartHour
  const totalWorkMinutes = totalWorkHours * 60

  // Generate time slots for the grid
  // Include all hours from start to end (e.g., 8:30-16:30 means show hours 8, 9, 10, 11, 12, 13, 14, 15, 16)
  const timeSlots: number[] = []
  const startHour = Math.floor(workStartHour)
  const endHour = Math.ceil(workEndHour)
  for (let hour = startHour; hour <= endHour; hour++) {
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
          // Show hour if it's within or at the boundaries of the work range
          // Include start hour (e.g., 8 when workStartHour is 8.5) and end hour (e.g., 16 when workEndHour is 16.5)
          const startHourInt = Math.floor(workStartHour)
          const endHourInt = Math.floor(workEndHour)
          
          // Only show if hour is between start and end (inclusive)
          if (hour < startHourInt || hour > endHourInt) return null
          
          // Determine minutes for label: if it's the start hour with fractional part, show those minutes
          let displayMinutes = 0
          let displayHour = hour
          
          const isStartHour = hour === startHourInt
          const isEndHour = hour === endHourInt
          const hasStartMinutes = workStartHour % 1 !== 0
          const hasEndMinutes = workEndHour % 1 !== 0
          
          if (isStartHour && hasStartMinutes) {
            displayMinutes = Math.floor((workStartHour % 1) * 60)
          } else if (isEndHour && hasEndMinutes) {
            // Show end hour with its minutes if it has fractional part
            displayMinutes = Math.floor((workEndHour % 1) * 60)
          }
          
          // Calculate position relative to workStartHour
          // For the start hour with fractional time, position at the start (0 offset)
          let topPx: number
          if (isStartHour) {
            // Position at the very top (after padding) - this is the start time (8:30)
            topPx = 16
          } else {
            // Regular calculation: hours from start
            topPx = (hour - workStartHour) * 60 * pixelsPerMinute + 16
          }
          
          return (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-gray-200"
              style={{ top: `${topPx}px` }}
            >
              <div 
                className="absolute left-0 px-2 text-xs text-gray-500 bg-white whitespace-nowrap" 
                style={{ 
                  top: isStartHour && hasStartMinutes ? '0px' : '-50%',
                  transform: isStartHour && hasStartMinutes ? 'none' : 'translateY(-50%)'
                }}
              >
                {formatTime(new Date(2000, 0, 1, displayHour, displayMinutes))}
              </div>
            </div>
          )
        })}

        {/* Half-hour grid lines (lighter) */}
        {timeSlots.map((hour) => {
          if (hour >= Math.floor(workEndHour)) return null
          const topPx = (hour + 0.5 - workStartHour) * 60 * pixelsPerMinute + 16 // Add padding at top
          if (topPx < 16 || topPx > totalHeight + 16) return null // Skip if outside visible area
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
          return time >= workStartHour && time < workEndHour
        }).map((time) => {
          const topPx = (time - workStartHour) * 60 * pixelsPerMinute + 16 // Add padding at top
          const hour = Math.floor(time)
          const minute = Math.round((time % 1) * 60)
          if (topPx < 16 || topPx > totalHeight + 16) return null // Skip if outside visible area
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

               {/* Break blocks (when workday is active) */}
               {workdayActive && (() => {
                 const breaks = [
                   { hour: 10, minute: 0, duration: 30 }, // 10:00-10:30
                   { hour: 11, minute: 30, duration: 60 }, // 11:30-12:30
                   { hour: 14, minute: 30, duration: 30 }, // 14:30-15:00
                 ]
                 
                 return breaks.map((breakTime, index) => {
                   const breakStart = new Date(selectedDate)
                   breakStart.setHours(breakTime.hour, breakTime.minute, 0, 0)
                   
                   return (
                     <BreakBlock
                       key={`break-${index}`}
                       startTime={breakStart}
                       durationMinutes={breakTime.duration}
                       workStartHour={workStartHour}
                       pixelsPerMinute={pixelsPerMinute}
                     />
                   )
                 })
               })()}

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

