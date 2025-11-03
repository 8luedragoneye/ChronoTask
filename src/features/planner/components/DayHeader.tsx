import { Button } from '../../../shared/components/ui'

interface DayHeaderProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  onPreviousDay: () => void
  onNextDay: () => void
  onToday: () => void
}

export function DayHeader({
  selectedDate,
  onDateChange,
  onPreviousDay,
  onNextDay,
  onToday,
}: DayHeaderProps) {
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const isToday = (() => {
    const today = new Date()
    return (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    )
  })()

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-gray-900">
          {formattedDate}
          {isToday && (
            <span className="ml-2 text-sm text-primary-600 font-normal">(Today)</span>
          )}
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onPreviousDay}>
            ←
          </Button>
          <Button variant="ghost" size="sm" onClick={onToday}>
            Today
          </Button>
          <Button variant="ghost" size="sm" onClick={onNextDay}>
            →
          </Button>
        </div>
      </div>
      
      <input
        type="date"
        value={selectedDate.toISOString().split('T')[0]}
        onChange={(e) => {
          const newDate = new Date(e.target.value)
          if (!isNaN(newDate.getTime())) {
            onDateChange(newDate)
          }
        }}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  )
}

