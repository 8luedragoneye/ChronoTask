import { TaskCard } from './TaskCard'
import { useTasks } from '../hooks/useTasks'
import { Button } from '../../../shared/components/ui'

export function TaskList() {
  const {
    tasks,
    isLoading,
    error,
    toggleTaskCompletion,
    deleteTask,
    loadTasks,
  } = useTasks()

  if (error && !isLoading) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={loadTasks}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    )
  }

  if (isLoading && tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No tasks yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Create your first task to get started!
        </p>
      </div>
    )
  }

  // Filter out tasks that are scheduled on the planner
  const unscheduledTasks = tasks.filter((task) => !task.scheduledStart)

  if (unscheduledTasks.length === 0 && tasks.length > 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">All tasks are scheduled</p>
        <p className="text-gray-400 text-sm mt-2">
          Tasks on the planner won't appear here. Remove them from the planner to see them again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {unscheduledTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={toggleTaskCompletion}
          onDelete={deleteTask}
        />
      ))}
    </div>
  )
}

