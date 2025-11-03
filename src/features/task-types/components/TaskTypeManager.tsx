import { useState } from 'react'
import { useTaskTypeRepository } from '../../../core/repositories/TaskTypeRepositoryContext'
import { useTaskTypes } from '../hooks/useTaskTypes'
import { Button, Card, Input } from '../../../shared/components/ui'
import { Plus, Trash2, Edit2, X } from 'lucide-react'
import type { TaskType } from '../../../core/entities/TaskType'

interface TaskTypeManagerProps {
  onClose?: () => void
}

export function TaskTypeManager({ onClose }: TaskTypeManagerProps = {}) {
  const repository = useTaskTypeRepository()
  const { taskTypes, isLoading, refresh } = useTaskTypes()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' })

  const handleAdd = async () => {
    if (!formData.name.trim()) return
    
    try {
      await repository.create({
        name: formData.name.trim(),
        color: formData.color,
      })
      setFormData({ name: '', color: '#3B82F6' })
      setShowAddForm(false)
      refresh()
    } catch (error) {
      console.error('Failed to create task type:', error)
      alert(error instanceof Error ? error.message : 'Failed to create task type')
    }
  }

  const handleEdit = async (id: string) => {
    if (!formData.name.trim()) return
    
    try {
      await repository.update(id, {
        name: formData.name.trim(),
        color: formData.color,
      })
      setFormData({ name: '', color: '#3B82F6' })
      setEditingId(null)
      refresh()
    } catch (error) {
      console.error('Failed to update task type:', error)
      alert(error instanceof Error ? error.message : 'Failed to update task type')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await repository.delete(id)
      refresh()
    } catch (error) {
      console.error('Failed to delete task type:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete task type')
    }
  }

  const startEdit = (type: TaskType) => {
    if (type.isDefault) return // Can't edit defaults
    setEditingId(type.id)
    setFormData({ name: type.name, color: type.color })
    setShowAddForm(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFormData({ name: '', color: '#3B82F6' })
  }

  if (isLoading) {
    return <div className="text-center py-4 text-gray-500">Loading task types...</div>
  }

  const customTypes = taskTypes.filter(t => !t.isDefault)
  const defaultTypes = taskTypes.filter(t => t.isDefault)

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Task Types</h2>
        <div className="flex items-center gap-2">
          {!showAddForm && !editingId && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowAddForm(true)
                setEditingId(null)
                setFormData({ name: '', color: '#3B82F6' })
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Type
            </Button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              title="Close task type manager"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <Input
            label="Type Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Meeting, Exercise..."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={editingId ? () => handleEdit(editingId) : handleAdd}
              disabled={!formData.name.trim()}
            >
              {editingId ? 'Save' : 'Add'}
            </Button>
            <Button variant="secondary" onClick={() => {
              setShowAddForm(false)
              cancelEdit()
            }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Default Types */}
      {defaultTypes.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Default Types</h3>
          <div className="flex flex-wrap gap-2">
            {defaultTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ backgroundColor: `${type.color}20`, borderColor: type.color }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-sm font-medium" style={{ color: type.color }}>
                  {type.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Types */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Custom Types</h3>
        {customTypes.length === 0 ? (
          <p className="text-sm text-gray-500">No custom types yet. Add one to get started!</p>
        ) : (
          <div className="space-y-2">
            {customTypes.map((type) => (
              <div
                key={type.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-sm font-medium">{type.name}</span>
                  <span className="text-xs text-gray-500">{type.color}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(type)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(type.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

