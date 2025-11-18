import { useState, useMemo } from 'react'
import { CreateIdeaForm } from './CreateIdeaForm'
import { IdeaMindMap } from './IdeaMindMap'
import { useIdeas } from '../hooks/useIdeas'
import { Button, Card, Textarea } from '../../../shared/components/ui'
import { Plus, X, Download, Upload } from 'lucide-react'
import { downloadIdeas, parseAndImportIdeas, readFileAsText } from '../utils/ideaExport'

export function IdeaVault() {
  const { ideas, createIdea, isLoading, loadIdeas } = useIdeas()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>('all')
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const exampleJson = `{
  "ideas": [
    {
      "name": "",
      "description": "",
      "topic": "",
      "parentName": ""
    }
  ]
}`
  const [importText, setImportText] = useState(exampleJson)
  const [showImportSection, setShowImportSection] = useState(false)

  // Extract unique topics from ideas
  const topics = useMemo(() => {
    const topicSet = new Set<string>()
    ideas.forEach(idea => {
      if (idea.topic) {
        topicSet.add(idea.topic)
      }
    })
    return Array.from(topicSet).sort()
  }, [ideas])

  // Filter ideas based on selected topic
  const filteredIdeas = useMemo(() => {
    if (selectedTopic === 'all' || !selectedTopic) {
      return ideas
    }
    return ideas.filter(idea => idea.topic === selectedTopic)
  }, [ideas, selectedTopic])

  // Export handler
  const handleExport = () => {
    downloadIdeas(ideas)
  }

  // Import from text handler
  const handleImportFromText = async () => {
    if (!importText.trim()) {
      setImportError('Please paste JSON content')
      return
    }

    setImportError(null)
    setIsImporting(true)
    
    try {
      await parseAndImportIdeas(
        importText,
        createIdea,
        async () => {
          await loadIdeas()
          return ideas
        }
      )
      await loadIdeas()
      setImportText('')
      setShowImportSection(false)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import ideas')
    } finally {
      setIsImporting(false)
    }
  }

  // Import from file handler
  const handleImportFromFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportError(null)
    setIsImporting(true)
    
    try {
      const fileContent = await readFileAsText(file)
      await parseAndImportIdeas(
        fileContent,
        createIdea,
        async () => {
          await loadIdeas()
          return ideas
        }
      )
      await loadIdeas()
      event.target.value = ''
      setShowImportSection(false)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import ideas')
    } finally {
      setIsImporting(false)
    }
  }


  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar - 1/5 width */}
      <div className="w-1/5 min-w-[200px] bg-white border-r border-gray-200 flex flex-col">
        {/* Create button */}
        <div className="p-4 border-b border-gray-200 space-y-2">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="w-full"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Idea
          </Button>
          
          <Button
            onClick={handleExport}
            className="w-full"
            variant="secondary"
            disabled={isLoading || ideas.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Ideas
          </Button>
          
          <Button
            onClick={() => {
              if (!showImportSection) {
                setImportText(exampleJson)
              }
              setShowImportSection(!showImportSection)
            }}
            className="w-full"
            variant="secondary"
            disabled={isLoading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Ideas
          </Button>
          
          {showImportSection && (
            <div className="mt-2 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste JSON here..."
                rows={8}
                className="text-xs font-mono"
                disabled={isImporting}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleImportFromText}
                  className="flex-1"
                  size="sm"
                  disabled={isImporting || !importText.trim()}
                >
                  {isImporting ? 'Importing...' : 'Import from Text'}
                </Button>
                <label className="flex-1">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFromFile}
                    className="hidden"
                    disabled={isImporting}
                    id="import-ideas-file"
                  />
                  <Button
                    type="button"
                    className="w-full"
                    size="sm"
                    variant="secondary"
                    disabled={isImporting}
                    onClick={() => {
                      document.getElementById('import-ideas-file')?.click()
                    }}
                  >
                    From File
                  </Button>
                </label>
              </div>
              {importError && (
                <p className="text-xs text-red-600 mt-1">{importError}</p>
              )}
            </div>
          )}
        </div>

        {/* Topic list */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Topics</h3>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTopic === 'all'
                  ? 'bg-blue-100 text-blue-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            {topics.map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedTopic === topic
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {topic}
              </button>
            ))}
            {topics.length === 0 && (
              <p className="text-xs text-gray-500 px-3">No topics yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Main mind map area - 4/5 width */}
      <div className="flex-1 overflow-hidden">
        <IdeaMindMap ideas={filteredIdeas} />
      </div>

      {/* Create form modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 relative">
            <button
              onClick={() => setShowCreateForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <CreateIdeaForm
              onSubmit={async (dto) => {
                const newIdea = await createIdea(dto)
                setShowCreateForm(false)
                return newIdea
              }}
              isLoading={isLoading}
            />
          </Card>
        </div>
      )}
    </div>
  )
}

