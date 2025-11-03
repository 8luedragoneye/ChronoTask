/**
 * Time utilities for planner feature
 */

/**
 * Snap a date to the nearest 15-minute increment
 */
export function snapTo15Minutes(date: Date): Date {
  const minutes = date.getMinutes()
  const snappedMinutes = Math.round(minutes / 15) * 15
  const snapped = new Date(date)
  snapped.setMinutes(snappedMinutes)
  snapped.setSeconds(0)
  snapped.setMilliseconds(0)
  return snapped
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1
}

/**
 * Format time as HH:MM
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Get the start of a day (00:00:00)
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get the end of a day (23:59:59)
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Check if a date is on the same day as another date
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date)
  result.setMinutes(result.getMinutes() + minutes)
  return result
}

/**
 * Calculate minutes between two dates
 */
export function minutesBetween(date1: Date, date2: Date): number {
  return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60))
}

/**
 * Get the position (in percentage) of a time within a day's working hours
 * Assumes working hours are 8:00 to 18:00 (10 hours = 600 minutes)
 */
export function getTimePositionInDay(date: Date, workStartHour: number = 8): number {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const totalMinutes = (hours - workStartHour) * 60 + minutes
  return Math.max(0, totalMinutes) // Return 0 if before work start
}

/**
 * Get the height percentage for a task based on its duration
 * Assumes 10 working hours = 600 minutes total
 */
export function getDurationHeight(durationMinutes: number, totalWorkMinutes: number = 600): number {
  return (durationMinutes / totalWorkMinutes) * 100
}

/**
 * Calculate time from Y position (in pixels) and day
 * @param y Y position in pixels
 * @param day The day to schedule on
 * @param pixelsPerMinute How many pixels per minute
 * @param workStartHour Starting hour (e.g., 8 for 8:00 AM)
 * @returns Date snapped to 15-minute intervals
 */
export function timeFromPosition(
  y: number,
  day: Date,
  pixelsPerMinute: number,
  workStartHour: number = 8
): Date {
  // Calculate total minutes from the start of the work day
  const minutesFromStart = Math.round(y / pixelsPerMinute)
  const hours = Math.floor(minutesFromStart / 60)
  const minutes = minutesFromStart % 60
  
  // Create date with the calculated time
  const result = new Date(day)
  result.setHours(workStartHour + hours, minutes, 0, 0)
  
  // Snap to 15-minute intervals
  return snapTo15Minutes(result)
}

