import type { Idea, ID } from '../../../core/entities/Idea'

export interface NodePosition {
  x: number
  y: number
  width: number
  height: number
}

export interface LayoutNode {
  idea: Idea
  children: LayoutNode[]
  position: NodePosition
}

const NODE_WIDTH = 250
const NODE_HEIGHT = 120
const HORIZONTAL_SPACING = 300
const VERTICAL_SPACING = 150

/**
 * Builds a tree structure from a flat list of ideas
 */
export function buildTree(ideas: Idea[]): LayoutNode[] {
  const ideaMap = new Map<ID, LayoutNode>()
  const rootNodes: LayoutNode[] = []

  // Create nodes for all ideas
  ideas.forEach(idea => {
    ideaMap.set(idea.id, {
      idea,
      children: [],
      position: { x: 0, y: 0, width: NODE_WIDTH, height: NODE_HEIGHT }
    })
  })

  // Build parent-child relationships
  ideas.forEach(idea => {
    const node = ideaMap.get(idea.id)!
    if (idea.parentId) {
      const parent = ideaMap.get(idea.parentId)
      if (parent) {
        parent.children.push(node)
      } else {
        // Parent not found, treat as root
        rootNodes.push(node)
      }
    } else {
      rootNodes.push(node)
    }
  })

  return rootNodes
}

/**
 * Calculates positions for nodes in a top-down tree layout
 * Uses saved positions if available, otherwise calculates automatic layout
 */
export function calculateLayout(rootNodes: LayoutNode[], allIdeas: Idea[]): Map<ID, NodePosition> {
  const positions = new Map<ID, NodePosition>()
  let currentY = 50 // Start position from top
  let maxX = 0

  // Create a map of ideas by ID for quick lookup
  const ideaMap = new Map<ID, Idea>()
  allIdeas.forEach(idea => ideaMap.set(idea.id, idea))

  function layoutNode(node: LayoutNode, x: number, y: number): number {
    const idea = ideaMap.get(node.idea.id)
    
    // Use saved position if available, otherwise use calculated position
    let finalX = x
    let finalY = y
    
    if (idea?.positionX !== undefined && idea?.positionY !== undefined) {
      finalX = idea.positionX
      finalY = idea.positionY
    }
    
    // Set position
    node.position = { x: finalX, y: finalY, width: NODE_WIDTH, height: NODE_HEIGHT }
    positions.set(node.idea.id, node.position)
    maxX = Math.max(maxX, finalX)

    if (node.children.length === 0) {
      return Math.max(y, finalY) + NODE_HEIGHT + VERTICAL_SPACING
    }

    // Calculate total width needed for children
    const childrenWidth = node.children.length * HORIZONTAL_SPACING
    const startX = finalX - (childrenWidth - NODE_WIDTH) / 2

    // Layout children
    let childY = finalY + NODE_HEIGHT + VERTICAL_SPACING
    let maxChildY = childY

    node.children.forEach((child, index) => {
      const childIdea = ideaMap.get(child.idea.id)
      // Use saved position for child if available, otherwise calculate
      let childX = startX + index * HORIZONTAL_SPACING
      if (childIdea?.positionX !== undefined) {
        childX = childIdea.positionX
      }
      const nextY = layoutNode(child, childX, childY)
      maxChildY = Math.max(maxChildY, nextY)
    })

    return maxChildY
  }

  // Layout root nodes horizontally
  let rootX = 50
  rootNodes.forEach((root, index) => {
    const rootIdea = ideaMap.get(root.idea.id)
    // Use saved position if available
    if (rootIdea?.positionX !== undefined) {
      rootX = rootIdea.positionX
    } else {
      if (index > 0) {
        rootX += HORIZONTAL_SPACING * 2
      }
    }
    currentY = Math.max(currentY, layoutNode(root, rootX, currentY))
  })

  return positions
}

/**
 * Gets all descendants of a node (for circular reference checking)
 */
export function getDescendants(nodeId: ID, ideas: Idea[]): Set<ID> {
  const descendants = new Set<ID>()
  const children = ideas.filter(i => i.parentId === nodeId)
  
  children.forEach(child => {
    descendants.add(child.id)
    const childDescendants = getDescendants(child.id, ideas)
    childDescendants.forEach(id => descendants.add(id))
  })
  
  return descendants
}

/**
 * Checks if moving idea to new parent would create a circular reference
 */
export function wouldCreateCircularReference(
  ideaId: ID,
  newParentId: ID | undefined,
  ideas: Idea[]
): boolean {
  if (!newParentId) return false // Root level is always valid
  
  if (ideaId === newParentId) return true // Can't be parent of itself
  
  const descendants = getDescendants(ideaId, ideas)
  return descendants.has(newParentId) // Can't be child of its own descendant
}

