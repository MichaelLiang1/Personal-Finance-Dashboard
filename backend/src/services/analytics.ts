import { Database } from 'sql.js'
import { getDb } from '../db.js'

export interface Summary {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  savingsRate: number
}

export interface CategoryBreakdown {
  category: string
  total: number
  count: number
  percentage: number
}

export interface MonthTrend {
  month: string
  income: number
  expenses: number
  net: number
}

export async function getSummary(fromDate?: string, toDate?: string): Promise<Summary> {
  const db = await getDb()

  let query = 'SELECT SUM(amount) as total FROM transactions WHERE amount > 0'
  const params: any[] = []

  if (fromDate) {
    query += ' AND date >= ?'
    params.push(fromDate)
  }
  if (toDate) {
    query += ' AND date <= ?'
    params.push(toDate)
  }

  let stmt = db.prepare(query)
  stmt.bind(params)
  const incomeRow = stmt.getAsObject()
  stmt.free()

  const totalIncome = (incomeRow.total as number) || 0

  query = 'SELECT SUM(ABS(amount)) as total FROM transactions WHERE amount < 0'
  params.length = 0

  if (fromDate) {
    query += ' AND date >= ?'
    params.push(fromDate)
  }
  if (toDate) {
    query += ' AND date <= ?'
    params.push(toDate)
  }

  stmt = db.prepare(query)
  stmt.bind(params)
  const expenseRow = stmt.getAsObject()
  stmt.free()

  const totalExpenses = (expenseRow.total as number) || 0
  const netSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
  }
}

export async function getSpendingByCategory(fromDate?: string, toDate?: string): Promise<CategoryBreakdown[]> {
  const db = await getDb()

  let query = `
    SELECT category, SUM(ABS(amount)) as total, COUNT(*) as count
    FROM transactions
    WHERE amount < 0
  `
  const params: any[] = []

  if (fromDate) {
    query += ' AND date >= ?'
    params.push(fromDate)
  }
  if (toDate) {
    query += ' AND date <= ?'
    params.push(toDate)
  }

  query += ' GROUP BY category ORDER BY total DESC'

  const stmt = db.prepare(query)
  stmt.bind(params)

  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as any)
  }
  stmt.free()

  const total = rows.reduce((sum, r) => sum + (r.total || 0), 0)

  return rows.map(row => ({
    category: row.category as string,
    total: row.total as number,
    count: row.count as number,
    percentage: total > 0 ? ((row.total / total) * 100) : 0,
  }))
}

export async function getMonthlyTrends(months: number = 6): Promise<MonthTrend[]> {
  const db = await getDb()

  // Get distinct months from transactions
  const stmt = db.prepare(`
    SELECT DISTINCT strftime('%Y-%m', date) as month
    FROM transactions
    ORDER BY month DESC
    LIMIT ?
  `)
  stmt.bind([months])

  const monthRows = []
  while (stmt.step()) {
    monthRows.push(stmt.getAsObject() as any)
  }
  stmt.free()

  const trends = monthRows.reverse().map(row => {
    const month = row.month as string
    return { month }
  })

  for (const trend of trends) {
    const incomeStmt = db.prepare(`
      SELECT SUM(amount) as total
      FROM transactions
      WHERE amount > 0 AND strftime('%Y-%m', date) = ?
    `)
    incomeStmt.bind([trend.month])
    const incomeRow = incomeStmt.getAsObject() as any
    incomeStmt.free()

    const expenseStmt = db.prepare(`
      SELECT SUM(ABS(amount)) as total
      FROM transactions
      WHERE amount < 0 AND strftime('%Y-%m', date) = ?
    `)
    expenseStmt.bind([trend.month])
    const expenseRow = expenseStmt.getAsObject() as any
    expenseStmt.free()

    trend.income = (incomeRow.total as number) || 0
    trend.expenses = (expenseRow.total as number) || 0
    trend.net = trend.income - trend.expenses
  }

  return trends as MonthTrend[]
}

// Calculate z-score to flag unusual spending months per category
export async function getMonthlyAnomalies(): Promise<{ category: string; month: string; zscore: number }[]> {
  const db = await getDb()

  // Get all months and categories with spending
  const stmt = db.prepare(`
    SELECT DISTINCT category, strftime('%Y-%m', date) as month
    FROM transactions
    WHERE amount < 0
    ORDER BY month DESC
  `)

  const entries = []
  while (stmt.step()) {
    entries.push(stmt.getAsObject() as any)
  }
  stmt.free()

  const anomalies = []

  // For each category, calculate z-score for each month
  const categories = [...new Set(entries.map(e => e.category as string))]

  for (const category of categories) {
    const monthlyTotals = []

    const catStmt = db.prepare(`
      SELECT strftime('%Y-%m', date) as month, SUM(ABS(amount)) as total
      FROM transactions
      WHERE amount < 0 AND category = ?
      GROUP BY month
      ORDER BY month
    `)
    catStmt.bind([category])

    while (catStmt.step()) {
      const row = catStmt.getAsObject() as any
      monthlyTotals.push({ month: row.month as string, amount: row.total as number })
    }
    catStmt.free()

    if (monthlyTotals.length < 2) continue

    const amounts = monthlyTotals.map(m => m.amount)
    const mean = amounts.reduce((a, b) => a + b) / amounts.length
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length
    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) continue

    // Flag months with |z-score| > 1.5
    for (const { month, amount } of monthlyTotals) {
      const zscore = (amount - mean) / stdDev
      if (Math.abs(zscore) > 1.5) {
        anomalies.push({ category, month, zscore })
      }
    }
  }

  return anomalies.sort((a, b) => Math.abs(b.zscore) - Math.abs(a.zscore))
}

// Flag individual transactions that are outliers within their category
export async function getTransactionAnomalies(): Promise<{ id: number; category: string; description: string; amount: number; zscore: number }[]> {
  const db = await getDb()

  const stmt = db.prepare(`
    SELECT DISTINCT category
    FROM transactions
    WHERE amount < 0
  `)

  const categories = []
  while (stmt.step()) {
    const row = stmt.getAsObject() as any
    categories.push(row.category as string)
  }
  stmt.free()

  const anomalies = []

  for (const category of categories) {
    const txStmt = db.prepare(`
      SELECT id, description, ABS(amount) as amount
      FROM transactions
      WHERE amount < 0 AND category = ?
      ORDER BY amount DESC
      LIMIT 100
    `)
    txStmt.bind([category])

    const transactions: any[] = []
    while (txStmt.step()) {
      transactions.push(txStmt.getAsObject())
    }
    txStmt.free()

    if (transactions.length < 3) continue

    const amounts = transactions.map(t => t.amount as number)
    const mean = amounts.reduce((a, b) => a + b) / amounts.length
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length
    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) continue

    for (const tx of transactions) {
      const zscore = ((tx.amount as number) - mean) / stdDev
      if (zscore > 2.5) {
        anomalies.push({
          id: tx.id as number,
          category,
          description: tx.description as string,
          amount: tx.amount as number,
          zscore,
        })
      }
    }
  }

  return anomalies.sort((a, b) => b.zscore - a.zscore).slice(0, 20)
}
