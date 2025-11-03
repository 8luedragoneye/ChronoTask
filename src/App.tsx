import { TaskRepositoryProvider } from './core/repositories/TaskRepositoryContext'
import { TaskList, CreateTaskForm } from './features/tasks'
import { useTasks } from './features/tasks'
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
  const { createTask, isLoading } = useTasks()

  return (
    <div className="min-h-screen bg-gray-50">
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
