import { Router, Request, Response } from 'express'
import { createGoal, getGoals, getGoal, getGoalProjection, deleteGoal } from '../services/goals.js'

const router = Router()

// POST /api/goals - Create a goal
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, targetAmount, targetDate } = req.body

    if (!name || typeof targetAmount !== 'number') {
      res.status(400).json({ error: 'name and targetAmount required' })
      return
    }

    const goal = await createGoal(name, targetAmount, targetDate)
    res.json(goal)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/goals - List all goals
router.get('/', async (req: Request, res: Response) => {
  try {
    const goals = await getGoals()
    res.json(goals)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/goals/:id - Get single goal with projection
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const goal = await getGoal(parseInt(id))

    if (!goal) {
      res.status(404).json({ error: 'Goal not found' })
      return
    }

    res.json(goal)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/goals/:id/projection - Get projection for a goal
router.get('/:id/projection', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const projection = await getGoalProjection(parseInt(id))

    if (!projection) {
      res.status(404).json({ error: 'Goal not found' })
      return
    }

    res.json(projection)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/goals/:id - Delete a goal
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await deleteGoal(parseInt(id))
    res.json({ success: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
