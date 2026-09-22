import { useState, useEffect } from 'react'
import { createGoal, getGoals, getGoalProjection } from '../lib/api'

interface Goal {
  id: number
  name: string
  target_amount: number
  target_date: string | null
  created_at: string
}

interface GoalWithProjection extends Goal {
  months_to_reach?: number | null
  will_reach_by_date?: string | null
  estimated_monthly_savings?: number
}

export default function Goals() {
  const [goals, setGoals] = useState<GoalWithProjection[]>([])
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const data = await getGoals()

      // Load projections for each goal
      const goalsWithProjections = await Promise.all(
        data.map(async (goal) => {
          try {
            const proj = await getGoalProjection(goal.id)
            return proj
          } catch {
            return goal
          }
        })
      )

      setGoals(goalsWithProjections)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !targetAmount) {
      setError('Name and target amount required')
      return
    }

    setCreating(true)
    setError('')

    try {
      const goal = await createGoal(name, parseFloat(targetAmount), targetDate || undefined)

      // Load projection for the new goal
      const proj = await getGoalProjection(goal.id)
      setGoals([proj, ...goals])

      setName('')
      setTargetAmount('')
      setTargetDate('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Financial Goals</h2>

      {/* Create Goal Form */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="font-semibold mb-4">Create a New Goal</h3>
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Goal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Emergency Fund"
              className="w-full px-3 py-2 border rounded"
              disabled={creating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Target Amount ($)</label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="5000"
                className="w-full px-3 py-2 border rounded"
                disabled={creating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target Date (Optional)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                disabled={creating}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={creating}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {creating ? 'Creating...' : 'Create Goal'}
          </button>
        </form>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded text-center text-gray-500">
            No goals yet. Create one to get started!
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="bg-white p-6 rounded shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg">{goal.name}</h3>
                <span className="text-sm text-gray-500">{goal.created_at?.split('T')[0]}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Target: ${goal.target_amount.toFixed(0)}</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: '0%' }} // In a real app, track current progress
                    />
                  </div>
                </div>

                {goal.estimated_monthly_savings !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600">
                      Average monthly savings: ${(goal.estimated_monthly_savings || 0).toFixed(0)}
                    </p>
                  </div>
                )}

                {goal.months_to_reach !== null && goal.months_to_reach !== undefined ? (
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm font-semibold text-blue-900">
                      ✓ Projected to reach in {goal.months_to_reach} months
                    </p>
                    {goal.will_reach_by_date && (
                      <p className="text-sm text-blue-800">By: {goal.will_reach_by_date}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 p-3 rounded">
                    <p className="text-sm font-semibold text-red-900">
                      ⚠️ Current savings rate is insufficient to reach this goal
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
