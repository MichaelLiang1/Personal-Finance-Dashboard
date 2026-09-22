import { Router, Request, Response } from 'express'
import { getSummary, getSpendingByCategory, getMonthlyTrends, getMonthlyAnomalies, getTransactionAnomalies } from '../services/analytics.js'

const router = Router()

// GET /api/analytics/summary - Income, expenses, savings rate
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const summary = await getSummary()
    res.json(summary)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/analytics/by-category - Spending breakdown
router.get('/by-category', async (req: Request, res: Response) => {
  try {
    const breakdown = await getSpendingByCategory()
    res.json(breakdown)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/analytics/monthly-trends - Income/expense by month
router.get('/monthly-trends', async (req: Request, res: Response) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string) : 6
    const trends = await getMonthlyTrends(months)
    res.json(trends)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/analytics/anomalies - Unusual spending patterns
router.get('/anomalies', async (req: Request, res: Response) => {
  try {
    const monthlyAnomalies = await getMonthlyAnomalies()
    const transactionAnomalies = await getTransactionAnomalies()

    res.json({
      monthlyCategories: monthlyAnomalies.map(a => a.category),
      topTransactions: transactionAnomalies,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
