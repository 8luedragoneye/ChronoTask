import { formatTime, addMinutes } from '../utils/time'

interface BreakBlockProps {
  startTime: Date
  durationMinutes: number
  workStartHour: number
  pixelsPerMinute: number
}

export function BreakBlock({ startTime, durationMinutes, workStartHour, pixelsPerMinute }: BreakBlockProps) {
  const endTime = addMinutes(startTime, durationMinutes)
  
  const startHour = startTime.getHours()
  const startMinute = startTime.getMinutes()
  
  // Calculate position from work start (e.g., 8.5 = 8:30) in pixels
  // Match TimeBlock calculation for consistency
  const minutesFromStart = (startHour - workStartHour) * 60 + startMinute
  const topPx = minutesFromStart * pixelsPerMinute + 16 // Add padding at top to match timeline
  const heightPx = durationMinutes * pixelsPerMinute

  return (
    <div
      style={{
        position: 'absolute',
        left: '48px',
        right: '8px',
        top: `${Math.max(0, topPx)}px`,
        height: `${Math.max(50, heightPx)}px`,
        minHeight: '50px',
        backgroundColor: '#FEF3C7', // Light yellow/amber background
        borderLeft: '4px solid #F59E0B', // Amber border
        borderRadius: '0 4px 4px 0',
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none', // Don't interfere with drag and drop
        opacity: 0.7,
      }}
      className="text-sm"
      title={`Break: ${formatTime(startTime)} to ${formatTime(endTime)}`}
    >
      <span className="font-medium text-gray-900">Break</span>
      <span className="text-xs text-gray-600">{formatTime(startTime)} - {formatTime(endTime)}</span>
    </div>
  )
}

