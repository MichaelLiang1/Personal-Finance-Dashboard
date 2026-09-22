import { useState, useEffect } from 'react'
import { uploadTransactionsCsv, getTransactions, updateTransactionCategory } from '../lib/api'

interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  category: string
  is_user_edited: number
}

const CATEGORIES = [
  'Groceries', 'Dining', 'Transportation', 'Utilities', 'Subscription',
  'Entertainment', 'Health', 'Shopping', 'Rent', 'Other'
]

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      const data = await getTransactions()
      setTransactions(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    try {
      const result = await uploadTransactionsCsv(file)
      setTransactions(result.transactions)
      alert(`Imported ${result.imported} transactions`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = '' // Reset file input
    }
  }

  const handleCategoryChange = async (id: number, newCategory: string) => {
    try {
      await updateTransactionCategory(id, newCategory)
      setTransactions(transactions.map(t => t.id === id ? { ...t, category: newCategory } : t))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Transactions</h2>

        <div className="bg-white p-4 rounded shadow mb-4">
          <label className="block mb-2 font-semibold">Import CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:px-4 file:py-2 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
          {uploading && <p className="mt-2 text-sm text-gray-600">Uploading...</p>}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-left">Category</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{tx.date}</td>
                  <td className="px-4 py-2">{tx.description}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={tx.amount >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={tx.category}
                      onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="p-4 text-center text-gray-500">No transactions yet. Upload a CSV to get started.</div>
          )}
        </div>
      </div>
    </div>
  )
}
