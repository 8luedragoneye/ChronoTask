import type { Idea } from '../../../core/entities/Idea'

export interface IdeaVaultExport {
  ideas: Array<{
    name: string
    description?: string
    topic?: string
    parentName?: string
  }>
}

/**
 * Exports ideas to simplified JSON format
 */
export function exportIdeas(ideas: Idea[]): IdeaVaultExport {
  // Create a map of idea ID to name for parent lookup
  const ideaMap = new Map<string, string>()
  ideas.forEach(idea => ideaMap.set(idea.id, idea.name))

  return {
    ideas: ideas.map(idea => ({
      name: idea.name,
      description: idea.description,
      topic: idea.topic,
      parentName: idea.parentId ? ideaMap.get(idea.parentId) : undefined,
    })),
  }
}

/**
 * Downloads ideas as JSON file
 */
export function downloadIdeas(ideas: Idea[]): void {
  const exportData = exportIdeas(ideas)
  const jsonString = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `ideavault-export-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Finds the next available position for a new idea
 */
function findNextFreePosition(existingIdeas: Idea[]): { x: number; y: number } {
  const NODE_WIDTH = 250
  const NODE_HEIGHT = 120
  const HORIZONTAL_SPACING = 300
  
  // Find the rightmost and bottommost positions
  let maxX = 50
  let maxY = 50
  
  existingIdeas.forEach(idea => {
    if (idea.positionX !== undefined) {
      maxX = Math.max(maxX, idea.positionX + NODE_WIDTH)
    }
    if (idea.positionY !== undefined) {
      maxY = Math.max(maxY, idea.positionY + NODE_HEIGHT)
    }
  })
  
  // If no positioned ideas, start at default
  if (existingIdeas.length === 0) {
    return { x: 50, y: 50 }
  }
  
  // Place new idea to the right of existing ones
  return { x: maxX + HORIZONTAL_SPACING, y: 50 }
}

/**
 * Validates and parses imported JSON
 */
export async function parseAndImportIdeas(
  fileContent: string,
  createIdea: (dto: { name: string; description?: string; topic?: string; parentId?: string; positionX?: number; positionY?: number }) => Promise<any>,
  getAllIdeas: () => Promise<Idea[]>
): Promise<void> {
  try {
    const data = JSON.parse(fileContent) as IdeaVaultExport
    
    // Validate structure
    if (!data.ideas || !Array.isArray(data.ideas)) {
      throw new Error('Invalid format: missing ideas array')
    }
    
    // Get existing ideas to find next position
    let existingIdeas = await getAllIdeas()
    
    // Create a map of imported idea names to their new IDs
    // We'll build this as we create ideas
    const nameToIdMap = new Map<string, string>()
    
    // First pass: create all root ideas (no parent)
    for (const ideaData of data.ideas) {
      if (!ideaData.parentName) {
        // Recalculate position for each new idea
        existingIdeas = await getAllIdeas()
        const currentPosition = findNextFreePosition(existingIdeas)
        const newIdea = await createIdea({
          name: ideaData.name,
          description: ideaData.description,
          topic: ideaData.topic,
          positionX: currentPosition.x,
          positionY: currentPosition.y,
        })
        nameToIdMap.set(ideaData.name, newIdea.id)
      }
    }
    
    // Second pass: create ideas with parents
    // We need to do this in multiple passes in case of nested hierarchies
    let remainingIdeas = data.ideas.filter(idea => idea.parentName)
    let maxIterations = 100 // Prevent infinite loops
    let iteration = 0
    
    while (remainingIdeas.length > 0 && iteration < maxIterations) {
      iteration++
      const newlyCreated: typeof remainingIdeas = []
      
      for (const ideaData of remainingIdeas) {
        const parentId = ideaData.parentName ? nameToIdMap.get(ideaData.parentName) : undefined
        
        if (parentId || !ideaData.parentName) {
          // Parent exists or no parent needed
          // Recalculate position if it's a root idea
          let positionX: number | undefined = undefined
          let positionY: number | undefined = undefined
          if (!parentId) {
            existingIdeas = await getAllIdeas()
            const currentPosition = findNextFreePosition(existingIdeas)
            positionX = currentPosition.x
            positionY = currentPosition.y
          }
          
          const newIdea = await createIdea({
            name: ideaData.name,
            description: ideaData.description,
            topic: ideaData.topic,
            parentId: parentId,
            // Don't set position for nested ideas - let layout algorithm handle it
            positionX: positionX,
            positionY: positionY,
          })
          nameToIdMap.set(ideaData.name, newIdea.id)
          newlyCreated.push(ideaData)
        }
      }
      
      // Remove created ideas from remaining
      remainingIdeas = remainingIdeas.filter(idea => !newlyCreated.includes(idea))
      
      // If no progress, break to avoid infinite loop
      if (newlyCreated.length === 0) {
        console.warn('Some ideas could not be imported - parent references may be invalid')
        break
      }
    }
    
    if (remainingIdeas.length > 0) {
      throw new Error(`Could not import ${remainingIdeas.length} ideas - invalid parent references`)
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to import ideas: ${error.message}`)
    }
    throw new Error('Failed to import ideas: Unknown error')
  }
}

/**
 * Reads file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        resolve(e.target.result)
      } else {
        reject(new Error('Failed to read file'))
      }
    }
    reader.onerror = () => reject(new Error('File reading error'))
    reader.readAsText(file)
  })
}

