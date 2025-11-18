import { useDraggable, useDroppable } from '@dnd-kit/core'
import { MindMapCard } from './MindMapCard'
import type { Idea, ID } from '../../../core/entities/Idea'
import type { NodePosition } from '../utils/mindMapLayout'

interface MindMapNodeProps {
  idea: Idea
  children: Idea[]
  position: NodePosition
  isExpanded: boolean
  onToggleExpand: (id: ID) => void
  onDelete: (id: ID) => void
}

export function MindMapNode({
  idea,
  children,
  position,
  isExpanded,
  onToggleExpand,
  onDelete
}: MindMapNodeProps) {
  const hasChildren = children.length > 0

  // Make the node draggable
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging
  } = useDraggable({
    id: `idea-${idea.id}`,
    data: {
      type: 'idea',
      idea
    }
  })

  // Make the node a drop zone
  const {
    setNodeRef: setDroppableRef,
    isOver
  } = useDroppable({
    id: `drop-${idea.id}`,
    data: {
      type: 'idea-drop',
      idea
    }
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1
      }
    : {
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1
      }

  return (
    <div
      ref={setDroppableRef}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        ...style
      }}
      className={`${isOver ? 'ring-4 ring-blue-500 ring-offset-2' : ''} transition-all`}
    >
      <div 
        ref={setDraggableRef}
        {...attributes} 
        {...listeners} 
        className="cursor-move"
      >
        <div className={isOver ? 'bg-blue-50 rounded-lg p-1' : ''}>
          <MindMapCard
            idea={idea}
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            onToggleExpand={() => onToggleExpand(idea.id)}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  )
}

