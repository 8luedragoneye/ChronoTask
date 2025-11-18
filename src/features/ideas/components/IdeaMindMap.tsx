import { useState, useMemo, useCallback, useEffect } from 'react'
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { MindMapNode } from './MindMapNode'
import { useIdeas } from '../hooks/useIdeas'
import { buildTree, calculateLayout, wouldCreateCircularReference } from '../utils/mindMapLayout'
import type { ID, Idea } from '../../../core/entities/Idea'

function RootDropZone() {
  const { setNodeRef, isOver } = useDroppable({
    id: 'mindmap-root',
    data: {
      type: 'root-drop'
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={`absolute inset-0 ${isOver ? 'bg-blue-50 border-2 border-blue-400 border-dashed' : ''}`}
      style={{ zIndex: 0 }}
    />
  )
}


interface IdeaMindMapProps {
  ideas?: Idea[]
}

export function IdeaMindMap({ ideas: providedIdeas }: IdeaMindMapProps = {}) {
  const { ideas: allIdeas, updateIdea, deleteIdea } = useIdeas()
  const ideas = providedIdeas || allIdeas
  // For circular reference checking, we need all ideas, not just filtered ones
  const allIdeasForCheck = allIdeas
  // Initialize with all nodes expanded
  const [expandedNodes, setExpandedNodes] = useState<Set<ID>>(() => {
    const allIds = new Set<ID>()
    ideas.forEach(idea => allIds.add(idea.id))
    return allIds
  })
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null)
  
  // Update expanded nodes when ideas change (add new ideas as expanded)
  useEffect(() => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      ideas.forEach(idea => {
        if (!next.has(idea.id)) {
          next.add(idea.id)
        }
      })
      return next
    })
  }, [ideas])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    })
  )

  // Build tree structure and calculate layout
  const positions = useMemo(() => {
    const tree = buildTree(ideas)
    return calculateLayout(tree, allIdeas)
  }, [ideas, allIdeas])

  const toggleExpand = useCallback((id: ID) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    const ideaId = (event.active.id as string).replace('idea-', '')
    const idea = ideas.find(i => i.id === ideaId)
    if (idea) {
      const position = positions.get(ideaId)
      if (position) {
        setDragStartPosition({ x: position.x, y: position.y })
      }
    }
  }, [ideas, positions])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event
    const activeId = active.id as string
    const draggedIdeaId = activeId.replace('idea-', '')
    
    setActiveId(null)
    
    // Calculate new position if dragged (not nested)
    const shouldUpdatePosition = dragStartPosition && delta && (delta.x !== 0 || delta.y !== 0)
    const newX = dragStartPosition && delta ? dragStartPosition.x + delta.x : undefined
    const newY = dragStartPosition && delta ? dragStartPosition.y + delta.y : undefined
    
    if (!over) {
      // Dropped on empty space - update position
      if (shouldUpdatePosition && newX !== undefined && newY !== undefined) {
        updateIdea(draggedIdeaId, { 
          positionX: Math.max(0, newX),
          positionY: Math.max(0, newY)
        })
      }
      setDragStartPosition(null)
      return
    }

    const overId = over.id as string
    
    if (overId.startsWith('drop-')) {
      const targetIdeaId = overId.replace('drop-', '')
      
      // Prevent dropping on itself
      if (draggedIdeaId === targetIdeaId) {
        setDragStartPosition(null)
        return
      }
      
      // Check for circular reference - need all ideas for this check
      if (wouldCreateCircularReference(draggedIdeaId, targetIdeaId, allIdeasForCheck)) {
        console.warn('Cannot nest: would create circular reference')
        setDragStartPosition(null)
        return
      }

      // Update parent (nesting) - clear manual position when nesting
      updateIdea(draggedIdeaId, { parentId: targetIdeaId, positionX: undefined, positionY: undefined })
    } else if (overId === 'mindmap-root') {
      // Drop on root level
      const draggedIdea = ideas.find(i => i.id === draggedIdeaId)
      if (draggedIdea?.parentId) {
        // Unnesting - update position if dragged
        if (shouldUpdatePosition && newX !== undefined && newY !== undefined) {
          updateIdea(draggedIdeaId, { 
            parentId: undefined,
            positionX: Math.max(0, newX),
            positionY: Math.max(0, newY)
          })
        } else {
          updateIdea(draggedIdeaId, { parentId: undefined })
        }
      } else if (shouldUpdatePosition && newX !== undefined && newY !== undefined) {
        // Just moving position
        updateIdea(draggedIdeaId, { 
          positionX: Math.max(0, newX),
          positionY: Math.max(0, newY)
        })
      }
    }
    
    setDragStartPosition(null)
  }, [ideas, allIdeasForCheck, updateIdea, dragStartPosition])

  const activeIdea = activeId ? ideas.find(i => i.id === activeId.replace('idea-', '')) : null

  // Get all connection lines for SVG
  const connectionLines = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
    
    ideas.forEach(idea => {
      if (idea.parentId && expandedNodes.has(idea.parentId)) {
        const parentPos = positions.get(idea.parentId)
        const childPos = positions.get(idea.id)
        
        if (parentPos && childPos) {
          lines.push({
            x1: parentPos.x + parentPos.width / 2,
            y1: parentPos.y + parentPos.height,
            x2: childPos.x + childPos.width / 2,
            y2: childPos.y
          })
        }
      }
    })
    
    return lines
  }, [ideas, positions, expandedNodes])

  // Calculate canvas size
  const canvasSize = useMemo(() => {
    let maxX = 0
    let maxY = 0
    
    positions.forEach(pos => {
      maxX = Math.max(maxX, pos.x + pos.width)
      maxY = Math.max(maxY, pos.y + pos.height)
    })
    
    return {
      width: Math.max(maxX + 100, 1200),
      height: Math.max(maxY + 100, 800)
    }
  }, [positions])

  if (ideas.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">No ideas yet</p>
          <p>Create your first idea to start building your mind map!</p>
        </div>
      </div>
    )
  }

  // Show help text if only one idea exists
  const showHelp = ideas.length === 1 && !ideas[0].parentId

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="relative w-full h-full overflow-auto bg-gray-50" style={{ minHeight: '600px' }}>
        {/* Help text overlay */}
        {showHelp && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg max-w-md">
            <p className="text-sm text-gray-700 mb-2">
              <strong>How to nest ideas:</strong>
            </p>
            <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
              <li>Click and drag an idea card</li>
              <li>Drop it onto another idea card</li>
              <li>The dropped idea becomes a child</li>
            </ol>
            <p className="text-xs text-gray-500 mt-2">
              Tip: The target card will highlight in blue when you hover over it
            </p>
          </div>
        )}
        
        {/* SVG overlay for connection lines */}
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ zIndex: 0 }}
        >
          {connectionLines.map((line, index) => (
            <line
              key={index}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#9CA3AF"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          ))}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="5"
              refY="5"
              orient="auto"
            >
              <polygon points="0 0, 10 5, 0 10" fill="#9CA3AF" />
            </marker>
          </defs>
        </svg>

        {/* Root drop zone */}
        <RootDropZone />

        {/* Render all nodes using calculated positions */}
        <div className="relative" style={{ width: canvasSize.width, height: canvasSize.height, minHeight: '600px' }}>
          {ideas.map((idea) => {
            // Only render if it's a root node, or if its parent is expanded
            const isRoot = !idea.parentId
            const parentExpanded = idea.parentId ? expandedNodes.has(idea.parentId) : true
            
            if (!isRoot && !parentExpanded) return null
            
            const position = positions.get(idea.id)
            if (!position) return null
            
            const children = ideas.filter(i => i.parentId === idea.id)
            
            return (
              <MindMapNode
                key={idea.id}
                idea={idea}
                children={children}
                position={position}
                isExpanded={expandedNodes.has(idea.id)}
                onToggleExpand={toggleExpand}
                onDelete={deleteIdea}
              />
            )
          })}
        </div>
      </div>

      <DragOverlay>
        {activeIdea ? (
          <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg opacity-90 min-w-[200px]">
            <div className="font-semibold text-sm">{activeIdea.name}</div>
            {activeIdea.topic && (
              <div className="text-xs text-gray-500 mt-1">#{activeIdea.topic}</div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

