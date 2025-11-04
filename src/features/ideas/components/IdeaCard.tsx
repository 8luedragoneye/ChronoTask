import { Button, Card } from '../../../shared/components/ui'
import type { Idea } from '../../../core/entities/Idea'
import { Trash2 } from 'lucide-react'

interface IdeaCardProps {
  idea: Idea
  onDelete: (id: string) => void
}

export function IdeaCard({ idea, onDelete }: IdeaCardProps) {
  const handleDelete = () => {
    onDelete(idea.id)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {idea.name}
          </h3>

          {idea.description && (
            <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
              {idea.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            {idea.topic && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                {idea.topic}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="flex-shrink-0"
          aria-label={`Delete idea ${idea.name}`}
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </Button>
      </div>
    </Card>
  )
}

