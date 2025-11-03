import { useState, useCallback, useRef } from 'react'
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { TaskRepositoryProvider } from './core/repositories/TaskRepositoryContext'
import { TaskList, CreateTaskForm } from './features/tasks'
import { useTasks } from './features/tasks'
import { PlannerPanel } from './features/planner'
import { timeFromPosition, tasksOverlap } from './features/planner/utils/time'
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
        <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
        <p className="text-gray-700 mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Try Again
        </button>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600">Error Details</summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
            {error.stack}
          </pre>
        </details>
      </div>
    </div>
  )
}

function AppContent() {
  const { createTask, isLoading, tasks, updateTask, deleteTask } = useTasks()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [lastMouseY, setLastMouseY] = useState<number | null>(null)
  const [dropIndicator, setDropIndicator] = useState<{ y: number; time: string; hasOverlap?: boolean } | null>(null)
  const initialMouseY = useRef<number | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require 5px of movement before drag starts
      },
    })
  )

  const handleDragStart = useCallback((event: any) => {
    setActiveId(event.active.id as string)
    // Capture initial mouse Y position
    if (event.activatorEvent) {
      initialMouseY.current = event.activatorEvent.clientY
    }
  }, [])

  const handleDragMove = useCallback((event: any) => {
    // Track current mouse position - use delta to calculate from initial position
    // or use collision data if available
    const over = event.over
    if (!over) {
      setDropIndicator(null)
      return
    }

    const dropZoneData = over.data?.current
    if (dropZoneData?.type !== 'timeline') {
      setDropIndicator(null)
      return
    }

    const timelineContainer = (dropZoneData.containerRef?.current as HTMLElement) ||
                              document.querySelector('.relative[style*="height"]') as HTMLElement
    
    if (!timelineContainer) {
      setDropIndicator(null)
      return
    }

    // Calculate current mouse Y position
    // Use delta (movement since drag started) + initial position
    let mouseY: number
    
    if (initialMouseY.current !== null && event.delta) {
      // Most accurate: initial position + delta
      mouseY = initialMouseY.current + event.delta.y
    } else if (event.activatorEvent) {
      // Fallback: use current activatorEvent if available
      mouseY = event.activatorEvent.clientY
    } else {
      // Last resort: use last known position
      mouseY = lastMouseY || 0
    }

    setLastMouseY(mouseY)

    const timelineBounds = timelineContainer.getBoundingClientRect()
    const relativeY = mouseY - timelineBounds.top
    
    const pixelsPerMinute = dropZoneData.pixelsPerMinute || 1
    const workEndHour = dropZoneData.workEndHour || 18
    const maxY = (workEndHour - dropZoneData.workStartHour) * 60 * pixelsPerMinute
    const clampedY = Math.max(0, Math.min(relativeY, maxY))
    
    // Get the dragged task
    const activeId = event.active.id as string
    const draggedTaskId = activeId.toString().replace('task-', '')
    const draggedTask = tasks.find(t => t.id === draggedTaskId)

    const scheduledStart = timeFromPosition(
      clampedY,
      dropZoneData.selectedDate,
      pixelsPerMinute,
      dropZoneData.workStartHour
    )
    
    // Check for overlaps with existing scheduled tasks
    let hasOverlap = false
    if (draggedTask) {
      const draggedDuration = draggedTask.estimateMinutes || 30
      
      // Get all scheduled tasks for the selected date (excluding the dragged task itself)
      const scheduledTasks = tasks.filter((task) => {
        if (!task.scheduledStart || task.id === draggedTaskId) return false
        const taskDate = task.scheduledStart
        return (
          taskDate.getFullYear() === dropZoneData.selectedDate.getFullYear() &&
          taskDate.getMonth() === dropZoneData.selectedDate.getMonth() &&
          taskDate.getDate() === dropZoneData.selectedDate.getDate()
        )
      })
      
      // Check if new position overlaps with any existing task
      hasOverlap = scheduledTasks.some((task) => {
        if (!task.scheduledStart) return false
        return tasksOverlap(
          scheduledStart,
          draggedDuration,
          task.scheduledStart,
          task.estimateMinutes || 30
        )
      })
    }
    
    const timeStr = scheduledStart.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    
    setDropIndicator({ 
      y: clampedY, 
      time: timeStr,
      hasOverlap, // Add overlap flag to indicator
    })
  }, [tasks, lastMouseY])

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event
    setActiveId(null)
    initialMouseY.current = null // Reset initial position

    if (!over || !active) {
      setLastMouseY(null)
      setDropIndicator(null)
      return
    }

    const draggedTaskId = active.id.toString().replace('task-', '')
    const dropZoneData = over.data?.current

    if (dropZoneData?.type === 'timeline') {
      const timelineContainer = (dropZoneData.containerRef?.current as HTMLElement) ||
                                document.querySelector('.relative[style*="height"]') as HTMLElement
      
      if (timelineContainer) {
        // Use dropIndicator if available (calculated during drag with correct position)
        if (dropIndicator) {
          // Prevent scheduling if there's an overlap
          if (dropIndicator.hasOverlap) {
            console.log('Cannot schedule: task overlaps with existing task')
            setLastMouseY(null)
            setDropIndicator(null)
            return
          }
          
          const scheduledStart = timeFromPosition(
            dropIndicator.y,
            dropZoneData.selectedDate,
            dropZoneData.pixelsPerMinute || 1,
            dropZoneData.workStartHour
          )
          
          // Double-check for overlaps before scheduling
          const draggedTask = tasks.find(t => t.id === draggedTaskId)
          if (draggedTask) {
            const draggedDuration = draggedTask.estimateMinutes || 30
            
            // Get all scheduled tasks for the selected date (excluding the dragged task itself)
            const scheduledTasks = tasks.filter((task) => {
              if (!task.scheduledStart || task.id === draggedTaskId) return false
              const taskDate = task.scheduledStart
              return (
                taskDate.getFullYear() === dropZoneData.selectedDate.getFullYear() &&
                taskDate.getMonth() === dropZoneData.selectedDate.getMonth() &&
                taskDate.getDate() === dropZoneData.selectedDate.getDate()
              )
            })
            
            // Check if new position overlaps with any existing task
            const hasOverlap = scheduledTasks.some((task) => {
              if (!task.scheduledStart) return false
              return tasksOverlap(
                scheduledStart,
                draggedDuration,
                task.scheduledStart,
                task.estimateMinutes || 30
              )
            })
            
            if (hasOverlap) {
              console.log('Cannot schedule: task overlaps with existing task')
              setLastMouseY(null)
              setDropIndicator(null)
              return
            }
          }
          
          updateTask(draggedTaskId, { scheduledStart })
        } else {
          // Fallback: calculate from last known mouse position
          const timelineBounds = timelineContainer.getBoundingClientRect()
          const mouseY = lastMouseY || timelineBounds.top + timelineBounds.height / 2
          const relativeY = mouseY - timelineBounds.top
          
          const pixelsPerMinute = dropZoneData.pixelsPerMinute || 1
          const workEndHour = dropZoneData.workEndHour || 18
          const maxY = (workEndHour - dropZoneData.workStartHour) * 60 * pixelsPerMinute
          const clampedY = Math.max(0, Math.min(relativeY, maxY))
          
          console.log('Fallback calculation:', {
            lastMouseY,
            mouseY,
            timelineTop: timelineBounds.top,
            relativeY: relativeY.toFixed(2),
            clampedY: clampedY.toFixed(2),
          })
          
          const scheduledStart = timeFromPosition(
            clampedY,
            dropZoneData.selectedDate,
            pixelsPerMinute,
            dropZoneData.workStartHour
          )
          
          updateTask(draggedTaskId, { scheduledStart })
        }
      }
    }
    
    setLastMouseY(null)
    setDropIndicator(null)
  }, [dropIndicator, lastMouseY, updateTask])

  const activeTask = activeId ? tasks.find(t => `task-${t.id}` === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-50 flex">
        {/* Left side - Tasks */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-center mb-2 text-gray-900">
                ChronoTask
              </h1>
              <p className="text-center text-gray-600">
                Modern Task Management
              </p>
            </header>

            <div className="space-y-6">
              <CreateTaskForm onSubmit={createTask} isLoading={isLoading} />
              <TaskList />
            </div>
          </div>
        </div>

        {/* Right side - Day Planner */}
        <div className="w-1/2 min-w-[500px] hidden lg:flex flex-col h-screen sticky top-0">
        <PlannerPanel
          tasks={tasks}
          onScheduleTask={(taskId, scheduledStart) => {
            updateTask(taskId, { scheduledStart })
          }}
          onDeleteTask={deleteTask}
          dropIndicator={dropIndicator}
        />
        </div>
      </div>
      
      <DragOverlay>
        {activeTask ? (
          <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg opacity-90">
            <div className="font-medium">{activeTask.title}</div>
            <div className="text-xs text-gray-500">{activeTask.estimateMinutes}m</div>
            {dropIndicator && (
              <div className={`text-xs font-semibold mt-1 ${
                dropIndicator.hasOverlap ? 'text-orange-600' : 'text-red-600'
              }`}>
                → {dropIndicator.hasOverlap ? '⚠ Overlap!' : dropIndicator.time}
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('App Error:', error, errorInfo)
      }}
    >
      <TaskRepositoryProvider>
        <AppContent />
      </TaskRepositoryProvider>
    </ErrorBoundary>
  )
}

export default App
