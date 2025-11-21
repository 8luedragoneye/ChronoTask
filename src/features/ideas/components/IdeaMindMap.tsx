import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, useDroppable, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { MindMapNode } from './MindMapNode'
import { useIdeas } from '../hooks/useIdeas'
import { buildTree, calculateLayout, wouldCreateCircularReference } from '../utils/mindMapLayout'
import type { ID, Idea } from '../../../core/entities/Idea'
import { Button } from '../../../shared/components/ui'
import { ZoomIn, ZoomOut, RotateCcw, Trash2 } from 'lucide-react'

function RootDropZone({ width, height }: { width: number; height: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'mindmap-root',
    data: {
      type: 'root-drop'
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={`absolute ${isOver ? 'bg-blue-50 border-2 border-blue-400 border-dashed' : ''}`}
      style={{ 
        zIndex: 0,
        top: 0,
        left: 0,
        width: `${width}px`,
        height: `${height}px`
      }}
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
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
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

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.25, 0.25))
  }, [])

  const handleResetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const handleClearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to delete all ideas? This action cannot be undone.')) {
      // Create a copy of idea IDs to avoid issues with array mutation during deletion
      const ideaIds = ideas.map(idea => idea.id)
      // Delete all ideas
      for (const id of ideaIds) {
        await deleteIdea(id)
      }
    }
  }, [ideas, deleteIdea])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)))
    }
  }, [])

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only pan if clicking on empty space (not on a node or button)
    const target = e.target as HTMLElement
    // Don't pan if clicking on a node, button, or interactive element
    if (
      target.closest('[data-idea-node]') ||
      target.closest('button') ||
      target.closest('[role="button"]') ||
      target.closest('.zoom-controls') ||
      target.closest('svg') ||
      target.closest('line')
    ) {
      return
    }
    
    // Pan with middle mouse button, right mouse button, or space + left click
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }, [isPanning, panStart])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

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
    // Convert delta from screen space to canvas space
    const shouldUpdatePosition = dragStartPosition && delta && (delta.x !== 0 || delta.y !== 0)
    const newX = dragStartPosition && delta ? dragStartPosition.x + (delta.x / zoom) : undefined
    const newY = dragStartPosition && delta ? dragStartPosition.y + (delta.y / zoom) : undefined
    
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
  }, [ideas, allIdeasForCheck, updateIdea, dragStartPosition, zoom])

  const handleUnnest = useCallback(async (id: ID) => {
    console.log('handleUnnest called with id:', id)
    const idea = ideas.find(i => i.id === id)
    console.log('Found idea:', idea, 'has parentId:', idea?.parentId)
    if (idea?.parentId) {
      try {
        // Get current position to preserve it when unnested
        // Use calculated position from layout, or fallback to saved position
        const calculatedPosition = positions.get(id)
        const savedPositionX = idea.positionX
        const savedPositionY = idea.positionY
        
        console.log('Calculated position:', calculatedPosition)
        console.log('Saved position:', savedPositionX, savedPositionY)
        
        if (calculatedPosition) {
          console.log('Unnesting with calculated position:', calculatedPosition.x, calculatedPosition.y)
          await updateIdea(id, {
            parentId: undefined,
            positionX: calculatedPosition.x,
            positionY: calculatedPosition.y
          })
        } else if (savedPositionX !== undefined && savedPositionY !== undefined) {
          console.log('Unnesting with saved position:', savedPositionX, savedPositionY)
          await updateIdea(id, {
            parentId: undefined,
            positionX: savedPositionX,
            positionY: savedPositionY
          })
        } else {
          console.log('Unnesting without position - will use layout algorithm')
          await updateIdea(id, { parentId: undefined })
        }
        console.log('Unnest complete')
      } catch (error) {
        console.error('Error unnesting idea:', error)
      }
    } else {
      console.log('Idea has no parentId, nothing to do')
    }
  }, [ideas, positions, updateIdea])

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

  // Calculate canvas size with proper padding
  const canvasSize = useMemo(() => {
    let maxX = 0
    let maxY = 0
    
    positions.forEach(pos => {
      maxX = Math.max(maxX, pos.x + pos.width)
      maxY = Math.max(maxY, pos.y + pos.height)
    })
    
    // Add generous padding to ensure everything is visible
    return {
      width: Math.max(maxX + 200, 2000),
      height: Math.max(maxY + 200, 1000)
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
      <div 
        ref={containerRef}
        className="w-full h-full overflow-hidden bg-gray-50 relative"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right click
        style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      >
        {/* Zoom controls */}
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2 border border-gray-200 zoom-controls">
          <Button
            onClick={handleZoomIn}
            size="sm"
            variant="ghost"
            className="p-2"
            title="Zoom In (Ctrl + Scroll)"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleZoomOut}
            size="sm"
            variant="ghost"
            className="p-2"
            title="Zoom Out (Ctrl + Scroll)"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleResetView}
            size="sm"
            variant="ghost"
            className="p-2"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <div className="text-xs text-center text-gray-500 px-2 py-1">
            {Math.round(zoom * 100)}%
          </div>
          <div className="border-t border-gray-200 my-1"></div>
          <Button
            onClick={handleClearAll}
            size="sm"
            variant="ghost"
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Clear All Ideas"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

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
        
        {/* Canvas container - establishes scrollable area */}
        <div 
          ref={canvasRef}
          className="relative mindmap-canvas"
          style={{ 
            width: canvasSize.width, 
            height: canvasSize.height, 
            minWidth: '100%', 
            minHeight: '600px',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
        >
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
          <RootDropZone width={canvasSize.width} height={canvasSize.height} />

          {/* Render all nodes using calculated positions */}
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
                onUnnest={handleUnnest}
                zoom={zoom}
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

