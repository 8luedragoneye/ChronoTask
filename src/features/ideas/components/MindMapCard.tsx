import { Button, Card } from '../../../shared/components/ui'
import type { Idea } from '../../../core/entities/Idea'
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react'

interface MindMapCardProps {
  idea: Idea
  hasChildren: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onDelete: (id: string) => void
}

export function MindMapCard({ idea, hasChildren, isExpanded, onToggleExpand, onDelete }: MindMapCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(idea.id)
  }

  // Get topic color (simple hash-based color for now)
  const getTopicColor = (topic?: string) => {
    if (!topic) return '#E5E7EB' // gray default
    
    const colors = [
      '#DBEAFE', // blue
      '#D1FAE5', // green
      '#FEF3C7', // yellow
      '#FCE7F3', // pink
      '#E9D5FF', // purple
      '#FED7AA', // orange
    ]
    
    let hash = 0
    for (let i = 0; i < topic.length; i++) {
      hash = topic.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const topicColor = getTopicColor(idea.topic)

  return (
    <Card 
      className="relative min-w-[200px] max-w-[250px] cursor-pointer hover:shadow-lg transition-all"
      style={{ 
        borderLeft: `4px solid ${idea.topic ? topicColor : '#E5E7EB'}`,
        backgroundColor: idea.topic ? `${topicColor}20` : 'white'
      }}
    >
      <div className="flex items-start gap-2">
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
            className="flex-shrink-0 mt-0.5 p-0.5 hover:bg-gray-100 rounded"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
            {idea.name}
          </h3>
          
          {idea.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {idea.description}
            </p>
          )}
          
          {idea.topic && (
            <span 
              className="inline-block px-2 py-0.5 text-xs font-medium rounded"
              style={{ 
                backgroundColor: topicColor,
                color: '#1F2937'
              }}
            >
              #{idea.topic}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="flex-shrink-0 p-1 h-auto"
          aria-label={`Delete idea ${idea.name}`}
        >
          <Trash2 className="w-3 h-3 text-red-600" />
        </Button>
      </div>
    </Card>
  )
}

