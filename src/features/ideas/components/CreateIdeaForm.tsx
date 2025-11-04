import { useState } from 'react'
import { Input, Textarea, Button, Card } from '../../../shared/components/ui'
import type { CreateIdeaDto, Idea } from '../../../core/entities/Idea'

interface CreateIdeaFormProps {
  onSubmit: (dto: CreateIdeaDto) => Promise<Idea>
  isLoading?: boolean
}

export function CreateIdeaForm({ onSubmit, isLoading = false }: CreateIdeaFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Idea name is required')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        topic: topic.trim() || undefined,
      })

      // Reset form on success
      setName('')
      setDescription('')
      setTopic('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create idea')
    }
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Add New Idea</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Idea Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter idea name..."
          error={error || undefined}
          required
          disabled={isLoading}
        />

        <Textarea
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your idea..."
          rows={3}
          disabled={isLoading}
        />

        <Input
          label="Topic (optional)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., Technology, Design, Business"
          disabled={isLoading}
        />

        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? 'Creating...' : 'Add Idea'}
        </Button>
      </form>
    </Card>
  )
}

