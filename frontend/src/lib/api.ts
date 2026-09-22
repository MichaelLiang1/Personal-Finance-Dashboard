const API_BASE = '/api'

interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  category: string
  is_user_edited: number
}

interface AnalyticsSummary {
  totalIncome: number
  totalExpenses: number
  savingsRate: number
}

interface CategoryBreakdown {
  category: string
  total: number
  count: number
}

interface AnomalyResponse {
  categories: string[]
  transactions: Transaction[]
}

// Transactions
export async function uploadTransactionsCsv(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/transactions/import`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to import CSV')
  }

  return res.json()
}

export async function getTransactions() {
  const res = await fetch(`${API_BASE}/transactions`)
  if (!res.ok) throw new Error('Failed to fetch transactions')
  return res.json() as Promise<Transaction[]>
}

export async function updateTransactionCategory(id: number, category: string) {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  })

  if (!res.ok) throw new Error('Failed to update transaction')
  return res.json()
}

// Analytics
export async function getAnalyticsSummary() {
  const res = await fetch(`${API_BASE}/analytics/summary`)
  if (!res.ok) throw new Error('Failed to fetch summary')
  return res.json() as Promise<AnalyticsSummary>
}

export async function getSpendingByCategory() {
  const res = await fetch(`${API_BASE}/analytics/by-category`)
  if (!res.ok) throw new Error('Failed to fetch spending by category')
  return res.json() as Promise<CategoryBreakdown[]>
}

export async function getMonthlyTrends() {
  const res = await fetch(`${API_BASE}/analytics/monthly-trends`)
  if (!res.ok) throw new Error('Failed to fetch monthly trends')
  return res.json()
}

export async function getAnomalies() {
  const res = await fetch(`${API_BASE}/analytics/anomalies`)
  if (!res.ok) throw new Error('Failed to fetch anomalies')
  return res.json() as Promise<AnomalyResponse>
}

// Goals
export async function createGoal(name: string, targetAmount: number, targetDate?: string) {
  const res = await fetch(`${API_BASE}/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, targetAmount, targetDate }),
  })

  if (!res.ok) throw new Error('Failed to create goal')
  return res.json()
}

export async function getGoals() {
  const res = await fetch(`${API_BASE}/goals`)
  if (!res.ok) throw new Error('Failed to fetch goals')
  return res.json()
}

export async function getGoalProjection(goalId: number) {
  const res = await fetch(`${API_BASE}/goals/${goalId}/projection`)
  if (!res.ok) throw new Error('Failed to fetch projection')
  return res.json()
}

// AI
export async function askAI(question: string) {
  const res = await fetch(`${API_BASE}/ai/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to ask AI')
  }

  return res.json()
}
