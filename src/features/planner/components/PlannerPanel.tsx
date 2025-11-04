import { useState } from 'react'
import { Timeline } from './Timeline'
import { TimeEvaluation } from './TimeEvaluation'
import type { Task } from '../../../core/entities/Task'
import { startOfDay } from '../utils/time'
import { Checkbox } from '../../../shared/components/ui'

interface PlannerPanelProps {
  tasks: Task[]
  onScheduleTask?: (taskId: string, scheduledStart: Date) => void
  onDeleteTask?: (taskId: string) => void
  dropIndicator?: { y: number; time: string; hasOverlap?: boolean } | null
}

export function PlannerPanel({ tasks, onScheduleTask, onDeleteTask, dropIndicator }: PlannerPanelProps) {
  const [workdayActive, setWorkdayActive] = useState(true) // Default activated
  // Always use today's date
  const selectedDate = startOfDay(new Date())
  const workStartHour = 8.5 // 8:30
  const workEndHour = 16.5 // 16:30

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
        <Checkbox
          checked={workdayActive}
          onChange={(e) => setWorkdayActive(e.target.checked)}
          label="Workday"
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <Timeline
          tasks={tasks}
          selectedDate={selectedDate}
          workStartHour={workStartHour}
          workEndHour={workEndHour}
          onScheduleTask={onScheduleTask}
          onDeleteTask={onDeleteTask}
          dropIndicator={dropIndicator}
          workdayActive={workdayActive}
        />
      </div>
      <TimeEvaluation tasks={tasks} workStartHour={workStartHour} workEndHour={workEndHour} workdayActive={workdayActive} />
    </div>
  )
}

