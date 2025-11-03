import { Timeline } from './Timeline'
import { TimeEvaluation } from './TimeEvaluation'
import type { Task } from '../../../core/entities/Task'
import { startOfDay } from '../utils/time'

interface PlannerPanelProps {
  tasks: Task[]
  onScheduleTask?: (taskId: string, scheduledStart: Date) => void
  onDeleteTask?: (taskId: string) => void
  dropIndicator?: { y: number; time: string; hasOverlap?: boolean } | null
}

export function PlannerPanel({ tasks, onScheduleTask, onDeleteTask, dropIndicator }: PlannerPanelProps) {
  // Always use today's date
  const selectedDate = startOfDay(new Date())
  const workStartHour = 8.5 // 8:30
  const workEndHour = 16.5 // 16:30

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      <div className="flex-1 overflow-hidden">
        <Timeline
          tasks={tasks}
          selectedDate={selectedDate}
          workStartHour={workStartHour}
          workEndHour={workEndHour}
          onScheduleTask={onScheduleTask}
          onDeleteTask={onDeleteTask}
          dropIndicator={dropIndicator}
        />
      </div>
      <TimeEvaluation tasks={tasks} workStartHour={workStartHour} workEndHour={workEndHour} />
    </div>
  )
}

