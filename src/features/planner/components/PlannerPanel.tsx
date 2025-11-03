import { useState } from 'react'
import { DayHeader } from './DayHeader'
import { Timeline } from './Timeline'
import type { Task } from '../../../core/entities/Task'
import { startOfDay } from '../utils/time'

interface PlannerPanelProps {
  tasks: Task[]
  onScheduleTask?: (taskId: string, scheduledStart: Date) => void
  onDeleteTask?: (taskId: string) => void
  dropIndicator?: { y: number; time: string; hasOverlap?: boolean } | null
}

export function PlannerPanel({ tasks, onScheduleTask, onDeleteTask, dropIndicator }: PlannerPanelProps) {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(startOfDay(newDate))
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(startOfDay(newDate))
  }

  const handleToday = () => {
    setSelectedDate(startOfDay(new Date()))
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      <DayHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onPreviousDay={handlePreviousDay}
        onNextDay={handleNextDay}
        onToday={handleToday}
      />
      <Timeline
        tasks={tasks}
        selectedDate={selectedDate}
        onScheduleTask={onScheduleTask}
        onDeleteTask={onDeleteTask}
        dropIndicator={dropIndicator}
      />
    </div>
  )
}

