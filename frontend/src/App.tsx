import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Goals from './pages/Goals'
import AskAI from './pages/AskAI'

type Page = 'dashboard' | 'transactions' | 'goals' | 'ai'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <nav className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">💰 Finance Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setPage('dashboard')}
              className={`px-4 py-2 rounded ${page === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setPage('transactions')}
              className={`px-4 py-2 rounded ${page === 'transactions' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Transactions
            </button>
            <button
              onClick={() => setPage('goals')}
              className={`px-4 py-2 rounded ${page === 'goals' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Goals
            </button>
            <button
              onClick={() => setPage('ai')}
              className={`px-4 py-2 rounded ${page === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Ask AI
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {page === 'dashboard' && <Dashboard />}
        {page === 'transactions' && <Transactions />}
        {page === 'goals' && <Goals />}
        {page === 'ai' && <AskAI />}
      </main>
    </div>
  )
}
