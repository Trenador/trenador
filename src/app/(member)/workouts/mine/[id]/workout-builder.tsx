'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { saveMyWorkoutExercisesAction, getExerciseCatalogAction } from '@/actions/workouts'
import type { MemberWorkout, MemberWorkoutExercise } from '@/db/schema'

type WorkoutWithExercises = MemberWorkout & { exercises: MemberWorkoutExercise[] }

type ExerciseRow = {
  id: string | undefined
  exerciseName: string
  exerciseId: string | undefined
  dayIndex: number
  orderIndex: number
  targetSets: number | null
  targetReps: number | null
  targetWeightKg: string | null
  notes: string | null
}

export function WorkoutBuilder({ workout }: { workout: WorkoutWithExercises }) {
  const [exercises, setExercises] = useState<ExerciseRow[]>(
    workout.exercises.map(e => ({
      id: e.id as string,
      exerciseName: e.exerciseName,
      exerciseId: e.exerciseId ?? undefined,
      dayIndex: e.dayIndex,
      orderIndex: e.orderIndex,
      targetSets: e.targetSets,
      targetReps: e.targetReps,
      targetWeightKg: e.targetWeightKg,
      notes: e.notes,
    }))
  )
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string }>>([])
  const [addingRow, setAddingRow] = useState(false)
  const [newExName, setNewExName] = useState('')
  const [isSaving, startSaving] = useTransition()
  const [saved, setSaved] = useState(false)

  async function handleSearchChange(value: string) {
    setNewExName(value)
    setSearch(value)
    if (value.length < 2) { setSuggestions([]); return }
    const results = await getExerciseCatalogAction(value)
    setSuggestions(results.slice(0, 6))
  }

  function addExercise(name: string, exerciseId?: string) {
    setExercises(prev => [
      ...prev,
      {
        id: undefined,
        exerciseName: name,
        exerciseId: exerciseId ?? undefined,
        dayIndex: 0,
        orderIndex: prev.length,
        targetSets: null,
        targetReps: null,
        targetWeightKg: null,
        notes: null,
      },
    ])
    setNewExName('')
    setSearch('')
    setSuggestions([])
    setAddingRow(false)
  }

  function removeExercise(index: number) {
    setExercises(prev => prev.filter((_, i) => i !== index).map((e, i) => ({ ...e, orderIndex: i })))
  }

  function updateExercise(index: number, field: keyof ExerciseRow, value: string | number | null) {
    setExercises(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }

  function handleSave() {
    startSaving(async () => {
      await saveMyWorkoutExercisesAction(
        workout.id,
        exercises.map((e, i) => ({
          memberWorkoutId: workout.id,
          exerciseName: e.exerciseName,
          exerciseId: e.exerciseId,
          dayIndex: e.dayIndex,
          orderIndex: i,
          targetSets: e.targetSets ?? undefined,
          targetReps: e.targetReps ?? undefined,
          targetWeightKg: e.targetWeightKg ?? undefined,
          notes: e.notes ?? undefined,
        }))
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-4">
      {exercises.length === 0 && !addingRow && (
        <p className="text-sm text-muted-foreground py-4">No exercises yet. Add one below.</p>
      )}

      {exercises.map((ex, i) => (
        <div key={i} className="flex gap-3 border-b border-border/40 py-3 last:border-0">
          <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] font-medium leading-snug">{ex.exerciseName}</p>
              <button
                onClick={() => removeExercise(i)}
                className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { label: 'Sets', field: 'targetSets' as const, value: ex.targetSets },
                { label: 'Reps', field: 'targetReps' as const, value: ex.targetReps },
                { label: 'Weight kg', field: 'targetWeightKg' as const, value: ex.targetWeightKg },
              ].map(({ label, field, value }) => (
                <div key={field}>
                  <label className="label-mono mb-1 block text-[10px] normal-case tracking-wide">{label}</label>
                  <input
                    type="number"
                    value={value ?? ''}
                    onChange={e => updateExercise(i, field, e.target.value ? Number(e.target.value) : null)}
                    placeholder="—"
                    className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {addingRow ? (
        <div className="rounded-xl border bg-card p-4 relative">
          <input
            type="text"
            value={newExName}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search exercise or type free text…"
            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          {suggestions.length > 0 && (
            <div className="absolute left-4 right-4 top-[calc(100%-8px)] z-10 rounded-xl border bg-card shadow-md overflow-hidden">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  onClick={() => addExercise(s.name, s.id)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => newExName.trim() && addExercise(newExName.trim())}
              disabled={!newExName.trim()}
              className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Add
            </button>
            <button
              onClick={() => { setAddingRow(false); setNewExName(''); setSuggestions([]) }}
              className="h-9 px-4 rounded-full border border-border text-xs font-medium hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingRow(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-full border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors w-full justify-center"
        >
          <Plus className="size-4" />
          Add exercise
        </button>
      )}

      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="h-10 rounded-full bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {saved ? 'Saved!' : isSaving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
