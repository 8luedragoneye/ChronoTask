import { CreateIdeaForm } from './CreateIdeaForm'
import { IdeaList } from './IdeaList'
import { useIdeas } from '../hooks/useIdeas'

export function IdeaVault() {
  const { createIdea, isLoading } = useIdeas()

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <CreateIdeaForm onSubmit={createIdea} isLoading={isLoading} />
          <IdeaList />
        </div>
      </div>
    </div>
  )
}

