import { useMemo } from 'react'
import type { Task } from '../../../core/entities/Task'
import { useTaskTypes } from '../../task-types/hooks/useTaskTypes'

interface TimeEvaluationProps {
  tasks: Task[]
  workStartHour?: number
  workEndHour?: number
  workdayActive?: boolean
}

export function TimeEvaluation({ tasks, workStartHour = 8, workEndHour = 18, workdayActive = false }: TimeEvaluationProps) {
  const { taskTypes } = useTaskTypes()

  const stats = useMemo(() => {
    // Calculate total work day time
    const totalWorkDayMinutes = (workEndHour - workStartHour) * 60

    // Calculate total planned time by type (only scheduled tasks)
    const plannedByType = new Map<string, number>()
    let totalPlannedMinutes = 0
    let totalUnscheduledTaskMinutes = 0

    tasks.forEach(task => {
      const typeName = task.taskType || 'unplanned'
      const minutes = task.estimateMinutes || 0

      if (task.scheduledStart) {
        // Task is scheduled on the planner
        const current = plannedByType.get(typeName) || 0
        plannedByType.set(typeName, current + minutes)
        totalPlannedMinutes += minutes
      } else {
        // Task is not scheduled (exists but not on planner)
        totalUnscheduledTaskMinutes += minutes
      }
    })

    // Calculate break time if workday is active
    // Breaks: 10:00-10:30 (30 min), 11:30-12:30 (60 min), 14:30-15:00 (30 min)
    const breakMinutes = workdayActive ? 30 + 60 + 30 : 0 // Total: 120 minutes

    // Calculate free time (work day time minus planned tasks minus breaks)
    const freeTimeMinutes = Math.max(0, totalWorkDayMinutes - totalPlannedMinutes - breakMinutes)

    // Total time to show in chart = work day time
    const totalTime = totalWorkDayMinutes

    // Build stats array
    const typeStats: Array<{ name: string; color: string; minutes: number; percentage: number }> = []

    // Add planned types (scheduled tasks)
    plannedByType.forEach((minutes, typeName) => {
      const taskType = taskTypes.find(t => t.name === typeName)
      const percentage = totalTime > 0 ? (minutes / totalTime) * 100 : 0
      typeStats.push({
        name: typeName,
        color: taskType?.color || '#9CA3AF',
        minutes,
        percentage,
      })
    })

    // Add breaks if workday is active
    if (workdayActive && breakMinutes > 0) {
      const percentage = totalTime > 0 ? (breakMinutes / totalTime) * 100 : 0
      typeStats.push({
        name: 'break',
        color: '#FEF3C7', // Light yellow/amber for breaks (matching BreakBlock)
        minutes: breakMinutes,
        percentage,
      })
    }

    // Add free time (unplanned time in the work day)
    if (freeTimeMinutes > 0) {
      const percentage = totalTime > 0 ? (freeTimeMinutes / totalTime) * 100 : 0
      typeStats.push({
        name: 'free',
        color: '#E5E7EB', // Light gray for free time
        minutes: freeTimeMinutes,
        percentage,
      })
    }

    // Add unscheduled tasks if there are any
    if (totalUnscheduledTaskMinutes > 0) {
      const percentage = totalTime > 0 ? (totalUnscheduledTaskMinutes / totalTime) * 100 : 0
      typeStats.push({
        name: 'unscheduled',
        color: '#9CA3AF',
        minutes: totalUnscheduledTaskMinutes,
        percentage,
      })
    }

    // Sort by minutes descending
    typeStats.sort((a, b) => b.minutes - a.minutes)

    return {
      typeStats,
      totalPlannedMinutes,
      freeTimeMinutes,
      totalUnscheduledTaskMinutes,
      totalTime,
    }
  }, [tasks, taskTypes, workStartHour, workEndHour, workdayActive])

  // Calculate angles for pie chart
  let currentAngle = -90 // Start at top (12 o'clock)
  const pieSegments = stats.typeStats.map((stat) => {
    const angle = (stat.percentage / 100) * 360
    const startAngle = currentAngle
    currentAngle += angle

    // Calculate path for SVG arc
    const radius = 60
    const centerX = 70
    const centerY = 70

    const startRadians = (startAngle * Math.PI) / 180
    const endRadians = (currentAngle * Math.PI) / 180

    const x1 = centerX + radius * Math.cos(startRadians)
    const y1 = centerY + radius * Math.sin(startRadians)
    const x2 = centerX + radius * Math.cos(endRadians)
    const y2 = centerY + radius * Math.sin(endRadians)

    const largeArcFlag = angle > 180 ? 1 : 0

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ')

    return {
      ...stat,
      pathData,
      startAngle,
      endAngle: currentAngle,
    }
  })

  if (stats.totalTime === 0) {
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Time Evaluation</h3>
        <p className="text-sm text-gray-500">No tasks to evaluate</p>
      </div>
    )
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Time Evaluation</h3>
      <div className="grid grid-cols-[auto_1fr] gap-6 items-start">
        {/* Pie Chart */}
        <div className="flex-shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140">
            {pieSegments.map((segment) => (
              <path
                key={segment.name}
                d={segment.pathData}
                fill={segment.color}
                stroke="#fff"
                strokeWidth="2"
                opacity={0.8}
              />
            ))}
            {/* Center circle for donut effect */}
            <circle cx="70" cy="70" r="35" fill="white" />
            <text
              x="70"
              y="65"
              textAnchor="middle"
              className="text-xs font-semibold fill-gray-900"
            >
              {Math.round(stats.totalTime / 60)}h
            </text>
            <text
              x="70"
              y="78"
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              Total
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-[1fr_auto] gap-2 relative">
          {/* Type names column */}
          <div className="space-y-2 relative">
            {stats.typeStats.map((stat) => (
              <div
                key={`${stat.name}-name`}
                className="flex items-center gap-2 text-sm"
                style={{ paddingBottom: '0.5rem' }}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: stat.color }}
                />
                <span className="font-medium text-gray-900 capitalize border-b border-dotted border-gray-400 flex-1">
                  {stat.name === 'free' ? 'Free Time' : stat.name === 'break' ? 'Breaks' : stat.name === 'unscheduled' ? 'Unscheduled Tasks' : stat.name}
                </span>
              </div>
            ))}
          </div>

          {/* Minutes + Percentage column */}
          <div className="space-y-2">
            {stats.typeStats.map((stat) => (
              <div
                key={`${stat.name}-time`}
                className="flex items-center gap-2 text-sm"
                style={{ paddingBottom: '0.5rem' }}
              >
                <span className="text-gray-600 tabular-nums whitespace-nowrap border-b border-dotted border-gray-400">
                  {stat.minutes}m
                </span>
                <span className="text-gray-400 text-xs tabular-nums">
                  ({stat.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

