'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { seedLogSessionAction, saveWorkoutLogAction } from '@/actions/workout-logging'
import { getExerciseCatalogAction } from '@/actions/workouts'

const WORKOUT_TYPES = ['Push', 'Pull', 'Legs', 'Full body', 'Cardio', 'Mobility', 'Other']

type SetRow = {
  setNumber: number
  reps: string
  weightKg: string
  rpe: string
  isWarmup: boolean
}

type ExerciseRow = {
  exerciseName: string
  exerciseId: string | undefined
  targetSets: number | undefined
  targetReps: number | undefined
  targetWeightKg: number | undefined
  sets: SetRow[]
}

function emptySet(n: number): SetRow {
  return { setNumber: n, reps: '', weightKg: '', rpe: '', isWarmup: false }
}

export default function LogPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromType = searchParams.get('from') // 'org' | 'mine' | null
  const fromId = searchParams.get('id')

  const [workoutType, setWorkoutType] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<ExerciseRow[]>([])
  const [sourceWorkoutId, setSourceWorkoutId] = useState<string | undefined>()
  const [sourceMemberWorkoutId, setSourceMemberWorkoutId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [addingExercise, setAddingExercise] = useState(false)
  const [exSearch, setExSearch] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string }>>([])
  const [isSaving, startSaving] = useTransition()

  // seed the session from URL params
  useEffect(() => {
    async function seed() {
      let source: Parameters<typeof seedLogSessionAction>[0] = { type: 'blank' }
      if (fromType === 'org' && fromId) source = { type: 'org_workout', workoutId: fromId }
      else if (fromType === 'mine' && fromId) source = { type: 'member_workout', workoutId: fromId }

      const seeded = await seedLogSessionAction(source)
      setSourceWorkoutId(seeded.sourceWorkoutId)
      setSourceMemberWorkoutId(seeded.sourceMemberWorkoutId)
      setExercises(
        seeded.exercises.map(ex => ({
          exerciseName: ex.name,
          exerciseId: ex.exerciseId,
          targetSets: ex.targetSets ?? undefined,
          targetReps: ex.targetReps ?? undefined,
          targetWeightKg: ex.targetWeightKg ?? undefined,
          sets: Array.from({ length: ex.targetSets ?? 1 }, (_, i) => emptySet(i + 1)),
        }))
      )
      setIsLoading(false)
    }
    seed()
  }, [fromType, fromId])

  async function handleExSearch(value: string) {
    setExSearch(value)
    if (value.length < 2) { setSuggestions([]); return }
    const results = await getExerciseCatalogAction(value)
    setSuggestions(results.slice(0, 6))
  }

  function addExercise(name: string, exerciseId?: string) {
    setExercises(prev => [...prev, { exerciseName: name, exerciseId: exerciseId ?? undefined, targetSets: undefined, targetReps: undefined, targetWeightKg: undefined, sets: [emptySet(1)] }])
    setExSearch('')
    setSuggestions([])
    setAddingExercise(false)
  }

  function removeExercise(i: number) {
    setExercises(prev => prev.filter((_, idx) => idx !== i))
  }

  function addSet(exIdx: number) {
    setExercises(prev => prev.map((ex, i) =>
      i === exIdx ? { ...ex, sets: [...ex.sets, emptySet(ex.sets.length + 1)] } : ex
    ))
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExercises(prev => prev.map((ex, i) =>
      i === exIdx
        ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx).map((s, j) => ({ ...s, setNumber: j + 1 })) }
        : ex
    ))
  }

  function updateSet(exIdx: number, setIdx: number, field: keyof SetRow, value: string | boolean) {
    setExercises(prev => prev.map((ex, i) =>
      i === exIdx
        ? { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) }
        : ex
    ))
  }

  function handleSave() {
    startSaving(async () => {
      await saveWorkoutLogAction({
        workoutType: workoutType || undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        notes: notes || undefined,
        sourceWorkoutId,
        sourceMemberWorkoutId,
        exercises: exercises.map((ex, i) => ({
          exerciseName: ex.exerciseName,
          exerciseId: ex.exerciseId,
          orderIndex: i,
          notes: undefined,
          sets: ex.sets.map(s => ({
            setNumber: s.setNumber,
            reps: s.reps ? Number(s.reps) : undefined,
            weightKg: s.weightKg ? Number(s.weightKg) : undefined,
            rpe: s.rpe ? Number(s.rpe) : undefined,
            isWarmup: s.isWarmup,
            durationSeconds: undefined,
            distanceMeters: undefined,
            notes: undefined,
          })),
        })),
      })
      router.push('/log/history')
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto pb-24">
      <div className="mb-8">
        <p className="label-mono mb-1">Training</p>
        <h1 className="text-2xl font-bold tracking-tight">Log Workout</h1>
      </div>

      {/* metadata */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="label-mono normal-case tracking-wide text-xs mb-1.5 block">Workout type</label>
          <select
            value={workoutType}
            onChange={e => setWorkoutType(e.target.value)}
            className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select type</option>
            {WORKOUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label-mono normal-case tracking-wide text-xs mb-1.5 block">Duration (min)</label>
          <input
            type="number"
            value={durationMinutes}
            onChange={e => setDurationMinutes(e.target.value)}
            placeholder="45"
            className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* exercises */}
      <div className="space-y-4 mb-4">
        {exercises.map((ex, exIdx) => (
          <div key={exIdx} className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-secondary/40">
              <span className="font-semibold text-sm">{ex.exerciseName}</span>
              <button onClick={() => removeExercise(exIdx)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>

            {ex.targetSets && (
              <div className="px-4 py-1.5 border-b">
                <span className="label-mono text-muted-foreground normal-case tracking-wide text-xs">
                  Target: {ex.targetSets} sets{ex.targetReps ? ` × ${ex.targetReps} reps` : ''}{ex.targetWeightKg ? ` @ ${ex.targetWeightKg}kg` : ''}
                </span>
              </div>
            )}

            <div className="px-4 pt-2 pb-3">
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 mb-1">
                {['#', 'Reps', 'kg', 'RPE', ''].map((h, i) => (
                  <span key={i} className="label-mono text-[10px] normal-case tracking-wide text-center">{h}</span>
                ))}
              </div>
              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} className="grid grid-cols-[2rem_1fr_1fr_1fr_2rem] gap-2 mb-1.5 items-center">
                  <span className="text-xs text-muted-foreground text-center">{set.setNumber}</span>
                  {(['reps', 'weightKg', 'rpe'] as const).map(field => (
                    <input
                      key={field}
                      type="number"
                      value={set[field]}
                      onChange={e => updateSet(exIdx, setIdx, field, e.target.value)}
                      className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ))}
                  <button
                    onClick={() => removeSet(exIdx, setIdx)}
                    className="text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addSet(exIdx)}
                className="mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Plus className="size-3.5" /> Add set
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* add exercise */}
      {addingExercise ? (
        <div className="rounded-xl border bg-card p-4 mb-4 relative">
          <input
            type="text"
            value={exSearch}
            onChange={e => handleExSearch(e.target.value)}
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
              onClick={() => exSearch.trim() && addExercise(exSearch.trim())}
              disabled={!exSearch.trim()}
              className="h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Add
            </button>
            <button
              onClick={() => { setAddingExercise(false); setExSearch(''); setSuggestions([]) }}
              className="h-9 px-4 rounded-full border border-border text-xs font-medium hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingExercise(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-full border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors w-full justify-center mb-6"
        >
          <Plus className="size-4" /> Add exercise
        </button>
      )}

      {/* notes */}
      <div className="mb-8">
        <label className="label-mono normal-case tracking-wide text-xs mb-1.5 block">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="How did it go?"
          rows={3}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving || exercises.length === 0}
        className="w-full h-11 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {isSaving ? 'Saving…' : 'Save workout'}
      </button>
    </div>
  )
}
