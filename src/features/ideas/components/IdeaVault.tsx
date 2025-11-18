import { useState, useMemo } from 'react'
import { CreateIdeaForm } from './CreateIdeaForm'
import { IdeaMindMap } from './IdeaMindMap'
import { useIdeas } from '../hooks/useIdeas'
import { Button, Card } from '../../../shared/components/ui'
import { Plus, X } from 'lucide-react'

export function IdeaVault() {
  const { ideas, createIdea, isLoading } = useIdeas()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>('all')

  // Extract unique topics from ideas
  const topics = useMemo(() => {
    const topicSet = new Set<string>()
    ideas.forEach(idea => {
      if (idea.topic) {
        topicSet.add(idea.topic)
      }
    })
    return Array.from(topicSet).sort()
  }, [ideas])

  // Filter ideas based on selected topic
  const filteredIdeas = useMemo(() => {
    if (selectedTopic === 'all' || !selectedTopic) {
      return ideas
    }
    return ideas.filter(idea => idea.topic === selectedTopic)
  }, [ideas, selectedTopic])


  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar - 1/5 width */}
      <div className="w-1/5 min-w-[200px] bg-white border-r border-gray-200 flex flex-col">
        {/* Create button */}
        <div className="p-4 border-b border-gray-200">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="w-full"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Idea
          </Button>
        </div>

        {/* Topic list */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Topics</h3>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTopic === 'all'
                  ? 'bg-blue-100 text-blue-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedTopic === topic
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {topic}
              </button>
            ))}
            {topics.length === 0 && (
              <p className="text-xs text-gray-500 px-3">No topics yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Main mind map area - 4/5 width */}
      <div className="flex-1 overflow-hidden">
        <IdeaMindMap ideas={filteredIdeas} />
      </div>

      {/* Create form modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 relative">
            <button
              onClick={() => setShowCreateForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <CreateIdeaForm
              onSubmit={async (dto) => {
                const newIdea = await createIdea(dto)
                setShowCreateForm(false)
                return newIdea
              }}
              isLoading={isLoading}
            />
          </Card>
        </div>
      )}
    </div>
  )
}

