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

const NODE_WIDTH = 350 // Increased to accommodate larger cards at low zoom
const NODE_HEIGHT = 140 // Slightly increased for better text fit
const HORIZONTAL_SPACING = 200 // Reduced spacing between nodes
const VERTICAL_SPACING = 120 // Reduced vertical spacing

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
 * Calculates the width of a subtree (for layout planning)
 * This ensures we allocate enough space for all descendants
 */
function calculateSubtreeWidth(node: LayoutNode, depth: number = 0): number {
  if (node.children.length === 0) {
    return NODE_WIDTH
  }
  
  // Calculate width needed for all children and their subtrees
  const childrenCount = node.children.length
  const totalChildrenWidth = node.children.reduce((sum, child) => {
    return sum + calculateSubtreeWidth(child, depth + 1)
  }, 0)
  
  // Add spacing between children (minimum spacing between each pair)
  const spacing = (childrenCount - 1) * HORIZONTAL_SPACING
  
  // Return the maximum of: node width, or total width needed for children
  return Math.max(NODE_WIDTH, totalChildrenWidth + spacing)
}

/**
 * Calculates positions for nodes in a top-down tree layout
 * Uses saved positions if available, otherwise calculates automatic layout
 * Improved algorithm to handle many children and deep hierarchies
 */
export function calculateLayout(rootNodes: LayoutNode[], allIdeas: Idea[]): Map<ID, NodePosition> {
  const positions = new Map<ID, NodePosition>()
  let currentY = 50 // Start position from top
  let maxX = 0
  let maxY = 0

  // Create a map of ideas by ID for quick lookup
  const ideaMap = new Map<ID, Idea>()
  allIdeas.forEach(idea => ideaMap.set(idea.id, idea))

  /**
   * Layout a node and its children recursively
   * Returns the bottom Y position of this subtree
   */
  function layoutNode(node: LayoutNode, x: number, y: number, useSavedPosition: boolean = true): { y: number; rightmostX: number } {
    const idea = ideaMap.get(node.idea.id)
    
    // Use saved position if available, otherwise use calculated position
    let finalX = x
    let finalY = y
    
    if (useSavedPosition && idea?.positionX !== undefined && idea?.positionY !== undefined) {
      finalX = idea.positionX
      finalY = idea.positionY
    }
    
    // Set position
    node.position = { x: finalX, y: finalY, width: NODE_WIDTH, height: NODE_HEIGHT }
    positions.set(node.idea.id, node.position)
    maxX = Math.max(maxX, finalX + NODE_WIDTH)
    maxY = Math.max(maxY, finalY + NODE_HEIGHT)
    
    let rightmostX = finalX + NODE_WIDTH

    if (node.children.length === 0) {
      return { y: finalY + NODE_HEIGHT + VERTICAL_SPACING, rightmostX }
    }

    // Check if any children have saved positions
    const childrenWithSavedPositions = node.children.filter(child => {
      const childIdea = ideaMap.get(child.idea.id)
      return childIdea?.positionX !== undefined && childIdea?.positionY !== undefined
    })

    // If all children have saved positions, use them but ensure no overlap
    // Otherwise, use automatic layout
    const useAutomaticLayout = childrenWithSavedPositions.length < node.children.length

    let childY = finalY + NODE_HEIGHT + VERTICAL_SPACING
    let maxChildY = childY

    if (useAutomaticLayout) {
      // Automatic layout: calculate subtree widths and position children
      const childWidths = node.children.map(child => calculateSubtreeWidth(child))
      const totalChildrenWidth = childWidths.reduce((sum, width) => sum + width, 0) + 
                                (node.children.length - 1) * HORIZONTAL_SPACING

      // Start positioning children from the left
      // Center the children group under the parent, but ensure minimum spacing
      let currentChildX = finalX + (NODE_WIDTH / 2) - (totalChildrenWidth / 2)
      // Ensure we don't go negative
      currentChildX = Math.max(50, currentChildX)

      // Layout each child with proper spacing
      node.children.forEach((child, index) => {
        const childIdea = ideaMap.get(child.idea.id)
        const childSubtreeWidth = childWidths[index]
        
        // Position child - center it within its allocated space
        // The allocated space is childSubtreeWidth, so center the node within that
        const childX = currentChildX + (childSubtreeWidth / 2) - (NODE_WIDTH / 2)
        
        // Use saved position if available, otherwise use calculated
        let finalChildX = childX
        let useSavedPos = false
        if (childIdea?.positionX !== undefined && childIdea?.positionY !== undefined) {
          // If saved position would cause overlap, ignore it for layout purposes
          // but still use it for the node itself
          const savedX = childIdea.positionX
          const minX = currentChildX
          const maxX = currentChildX + childSubtreeWidth - NODE_WIDTH
          
          if (savedX >= minX && savedX <= maxX) {
            finalChildX = savedX
            useSavedPos = true
          }
          // Otherwise, use calculated position to prevent overlap
        }
        
        const result = layoutNode(child, finalChildX, childY, useSavedPos)
        maxChildY = Math.max(maxChildY, result.y)
        rightmostX = Math.max(rightmostX, result.rightmostX)
        
        // Move to next child position
        // Always advance by calculated width + spacing to prevent overlap
        // This ensures siblings never overlap, even if they have wide subtrees
        currentChildX += childSubtreeWidth + HORIZONTAL_SPACING
      })
    } else {
      // All children have saved positions - use them but ensure proper Y spacing
      node.children.forEach((child) => {
        const childIdea = ideaMap.get(child.idea.id)
        if (childIdea?.positionX !== undefined && childIdea?.positionY !== undefined) {
          const result = layoutNode(child, childIdea.positionX, childIdea.positionY, true)
          maxChildY = Math.max(maxChildY, result.y)
          rightmostX = Math.max(rightmostX, result.rightmostX)
        }
      })
    }

    return { y: maxChildY, rightmostX }
  }

  // Layout root nodes horizontally with proper spacing
  let rootX = 50
  rootNodes.forEach((root, index) => {
    const rootIdea = ideaMap.get(root.idea.id)
    
    // Use saved position if available
    if (rootIdea?.positionX !== undefined && rootIdea?.positionY !== undefined) {
      rootX = rootIdea.positionX
      currentY = Math.max(currentY, rootIdea.positionY)
    } else {
      // Calculate spacing between root nodes
      if (index > 0) {
        const prevRootWidth = calculateSubtreeWidth(rootNodes[index - 1])
        rootX += prevRootWidth + HORIZONTAL_SPACING * 2
      }
    }
    
    const result = layoutNode(root, rootX, currentY, rootIdea?.positionX !== undefined)
    currentY = Math.max(currentY, result.y)
    maxX = Math.max(maxX, result.rightmostX)
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

