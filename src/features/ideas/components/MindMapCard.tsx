import { Button, Card } from '../../../shared/components/ui'
import type { Idea } from '../../../core/entities/Idea'
import { Trash2, ChevronDown, ChevronRight, Unlink } from 'lucide-react'

interface MindMapCardProps {
  idea: Idea
  hasChildren: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onDelete: (id: string) => void
  onUnnest?: (id: string) => void
  zoom?: number
  isHovered?: boolean
}

export function MindMapCard({ idea, hasChildren, isExpanded, onToggleExpand, onDelete, onUnnest, zoom = 1, isHovered = false }: MindMapCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(idea.id)
  }

  const handleUnnest = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onUnnest) {
      console.log('Unnesting idea:', idea.id, idea.name)
      onUnnest(idea.id)
    }
  }

  const handleUnnestPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
  }

  // Check if button should show
  const shouldShowUnnest = idea.parentId !== undefined && idea.parentId !== null && onUnnest !== undefined
  
  // Debug logging (remove after testing)
  if (idea.parentId) {
    console.log('Idea has parent:', idea.name, 'parentId:', idea.parentId, 'onUnnest:', !!onUnnest, 'shouldShow:', shouldShowUnnest)
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

  // When hovered, always show all content
  // Hide description when zoomed out (<= 0.75) unless hovered
  const showDescription = isHovered || (zoom > 0.75 && idea.description)
  // Hide topic when zoomed out even more (<= 0.5) unless hovered
  const showTopic = isHovered || (zoom > 0.5 && idea.topic)

  // Calculate font size - since the canvas is already scaled by zoom via CSS transform,
  // we use a base size that works well at 100% and remains readable when scaled
  // Base 20px: 100%=20px, 75%=15px, 50%=10px, 25%=5px (too small)
  // For very low zoom, we need to compensate by using a larger base
  // Use 20px base, but ensure minimum effective size of 10px (so at 25% zoom, use 40px base)
  const effectiveSize = 20 * zoom
  const minReadableSize = 10
  const baseSize = effectiveSize < minReadableSize ? minReadableSize / zoom : 20
  const titleFontSize = `${baseSize}px`

  // Increase card size when zoomed out (< 50%) to fit larger text
  // When hovered, make it larger to show all content
  const baseCardWidth = zoom < 0.5 ? '350px' : '250px'
  const baseCardMinWidth = zoom < 0.5 ? '300px' : '200px'
  const cardWidth = isHovered ? '400px' : baseCardWidth
  const cardMinWidth = isHovered ? '350px' : baseCardMinWidth

  return (
    <Card 
      className={`relative cursor-pointer transition-all duration-200 ${
        isHovered ? 'shadow-2xl scale-110' : 'hover:shadow-lg'
      }`}
      style={{
        minWidth: cardMinWidth,
        maxWidth: cardWidth,
        width: cardWidth,
        borderLeft: `4px solid ${idea.topic ? topicColor : '#E5E7EB'}`,
        backgroundColor: idea.topic ? `${topicColor}20` : 'white',
        transformOrigin: 'center center'
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
          <h3 
            className={`font-semibold text-gray-900 mb-1 ${isHovered ? '' : 'line-clamp-2'}`}
            style={{ fontSize: titleFontSize }}
          >
            {idea.name}
          </h3>
          
          {showDescription && (
            <p className={`text-xs text-gray-600 mb-2 ${isHovered ? '' : 'line-clamp-2'}`}>
              {idea.description}
            </p>
          )}
          
          {showTopic && (
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

        <div className="flex flex-shrink-0 gap-1 items-center">
          {shouldShowUnnest && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnnest}
              onPointerDown={handleUnnestPointerDown}
              className="p-1 h-auto hover:bg-blue-50 flex-shrink-0"
              aria-label={`Unnest ${idea.name} from parent`}
              title="Unnest from parent"
            >
              <Unlink className="w-4 h-4 text-blue-600" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="p-1 h-auto"
            aria-label={`Delete idea ${idea.name}`}
          >
            <Trash2 className="w-3 h-3 text-red-600" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

