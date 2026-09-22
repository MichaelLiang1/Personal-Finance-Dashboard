import { getDb, saveDb } from '../db.js'
import { getSummary } from './analytics.js'

export interface Goal {
  id: number
  name: string
  target_amount: number
  target_date: string | null
  created_at: string
}

export interface GoalProjection extends Goal {
  months_to_reach: number | null
  will_reach_by_date: string | null
  estimated_monthly_savings: number
}

export async function createGoal(name: string, targetAmount: number, targetDate?: string): Promise<Goal> {
  const db = await getDb()

  db.run(
    'INSERT INTO goals (name, target_amount, target_date) VALUES (?, ?, ?)',
    [name, targetAmount, targetDate || null]
  )

  saveDb()

  const stmt = db.prepare('SELECT * FROM goals ORDER BY id DESC LIMIT 1')
  stmt.step()
  const goal = stmt.getAsObject() as any
  stmt.free()

  return {
    id: goal.id as number,
    name: goal.name as string,
    target_amount: goal.target_amount as number,
    target_date: goal.target_date as string | null,
    created_at: goal.created_at as string,
  }
}

export async function getGoals(): Promise<Goal[]> {
  const db = await getDb()

  const stmt = db.prepare('SELECT * FROM goals ORDER BY created_at DESC')
  const rows = []

  while (stmt.step()) {
    rows.push(stmt.getAsObject() as any)
  }
  stmt.free()

  return rows.map(row => ({
    id: row.id as number,
    name: row.name as string,
    target_amount: row.target_amount as number,
    target_date: row.target_date as string | null,
    created_at: row.created_at as string,
  }))
}

export async function getGoal(id: number): Promise<Goal | null> {
  const db = await getDb()

  const stmt = db.prepare('SELECT * FROM goals WHERE id = ?')
  stmt.bind([id])

  if (!stmt.step()) {
    stmt.free()
    return null
  }

  const row = stmt.getAsObject() as any
  stmt.free()

  return {
    id: row.id as number,
    name: row.name as string,
    target_amount: row.target_amount as number,
    target_date: row.target_date as string | null,
    created_at: row.created_at as string,
  }
}

export async function getGoalProjection(goalId: number): Promise<GoalProjection | null> {
  const goal = await getGoal(goalId)
  if (!goal) return null

  const summary = await getSummary()
  const monthlyNet = summary.netSavings / 6 // Simple: assume recent average

  let monthsToReach = null
  let willReachByDate = null

  if (monthlyNet > 0) {
    monthsToReach = Math.ceil(goal.target_amount / monthlyNet)

    // Calculate projection date
    const today = new Date()
    const projDate = new Date(today)
    projDate.setMonth(projDate.getMonth() + monthsToReach)
    willReachByDate = projDate.toISOString().split('T')[0]
  }

  return {
    ...goal,
    months_to_reach: monthsToReach,
    will_reach_by_date: willReachByDate,
    estimated_monthly_savings: monthlyNet,
  }
}

export async function deleteGoal(id: number): Promise<void> {
  const db = await getDb()
  db.run('DELETE FROM goals WHERE id = ?', [id])
  saveDb()
}
