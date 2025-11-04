import { IdeaCard } from './IdeaCard'
import { useIdeas } from '../hooks/useIdeas'

export function IdeaList() {
  const { ideas, isLoading, error, deleteIdea } = useIdeas()

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading ideas...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p className="text-lg mb-2">Error loading ideas</p>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (ideas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg mb-2">No ideas yet</p>
        <p className="text-sm">Add your first idea to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          onDelete={deleteIdea}
        />
      ))}
    </div>
  )
}

