import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getAnalyticsSummary, getMonthlyTrends, getSpendingByCategory, getAnomalies } from '../lib/api'

interface Summary {
  totalIncome: number
  totalExpenses: number
  savingsRate: number
  netSavings: number
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [anomalies, setAnomalies] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [summaryData, trends, categories, anomalyData] = await Promise.all([
        getAnalyticsSummary(),
        getMonthlyTrends(),
        getSpendingByCategory(),
        getAnomalies(),
      ])

      setSummary(summaryData)
      setMonthlyData(trends)
      setCategoryData(categories.slice(0, 6)) // Top 6 categories
      setAnomalies(anomalyData)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (error) return <div className="p-4 text-red-600">{error}</div>
  if (!summary) return <div className="p-4">Loading...</div>

  // Color palettes (matching dataviz guidelines)
  const categoryColors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b']

  // Diverging palette for income (green) vs expenses (red)
  const incomeColor = '#10b981' // green
  const expenseColor = '#ef4444' // red

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {/* Summary Stat Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Income</h3>
          <p className="text-3xl font-bold text-green-600">${summary.totalIncome.toFixed(0)}</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Expenses</h3>
          <p className="text-3xl font-bold text-red-600">${summary.totalExpenses.toFixed(0)}</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Net Savings</h3>
          <p className={`text-3xl font-bold ${summary.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${summary.netSavings.toFixed(0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Savings Rate</h3>
          <p className="text-3xl font-bold text-blue-600">{summary.savingsRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Anomalies Banner */}
      {anomalies?.monthlyCategories?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Unusual Spending Detected</h3>
          <p className="text-sm text-yellow-800">
            Abnormal spending patterns found in: {anomalies.monthlyCategories.slice(0, 3).join(', ')}
            {anomalies.monthlyCategories.length > 3 && `... and ${anomalies.monthlyCategories.length - 3} more`}
          </p>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="font-semibold mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `$${value.toFixed(0)}`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke={incomeColor} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="expenses" stroke={expenseColor} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Spending by Category */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="font-semibold mb-4">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ category, percentage }) => `${category}: ${percentage.toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toFixed(0)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Income vs Expenses Bar Chart */}
        <div className="bg-white p-6 rounded shadow lg:col-span-2">
          <h3 className="font-semibold mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `$${value.toFixed(0)}`} />
              <Legend />
              <Bar dataKey="income" fill={incomeColor} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill={expenseColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
