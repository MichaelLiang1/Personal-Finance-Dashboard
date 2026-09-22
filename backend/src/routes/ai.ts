import { Router, Request, Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { getSummary, getSpendingByCategory, getMonthlyTrends } from '../services/analytics.js'

const router = Router()

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// POST /api/ai/ask - Ask a question about finances
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { question } = req.body

    if (!question) {
      res.status(400).json({ error: 'Question required' })
      return
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({
        error: 'ANTHROPIC_API_KEY not configured. Please set it in your .env file.',
      })
      return
    }

    // Gather financial context
    const summary = await getSummary()
    const byCategory = await getSpendingByCategory()
    const trends = await getMonthlyTrends(6)

    // Build a concise financial summary for Claude
    const financialContext = `
Recent Financial Summary:
- Total Income: $${summary.totalIncome.toFixed(2)}
- Total Expenses: $${summary.totalExpenses.toFixed(2)}
- Net Savings: $${summary.netSavings.toFixed(2)}
- Savings Rate: ${summary.savingsRate.toFixed(1)}%

Spending by Category (top categories):
${byCategory.slice(0, 5).map(c => `- ${c.category}: $${c.total.toFixed(2)} (${c.percentage.toFixed(1)}%)`).join('\n')}

Monthly Trends (last 6 months):
${trends.map(t => `- ${t.month}: Income: $${t.income.toFixed(2)}, Expenses: $${t.expenses.toFixed(2)}, Net: $${t.net.toFixed(2)}`).join('\n')}

User's Question: ${question}

Please analyze their finances and answer the question concisely, providing actionable insights.
    `.trim()

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: financialContext,
        },
      ],
    })

    const answer =
      message.content[0].type === 'text'
        ? message.content[0].text
        : 'Unable to process response'

    res.json({
      question,
      answer,
    })
  } catch (error: any) {
    console.error('AI endpoint error:', error)
    res.status(500).json({
      error: error.message || 'Failed to process question',
    })
  }
})

export default router
