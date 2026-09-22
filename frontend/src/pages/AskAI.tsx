import { useState } from 'react'
import { askAI } from '../lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const EXAMPLE_QUESTIONS = [
  'Why did I spend more this month?',
  'Where could I cut $200 per month?',
  'Which category is my biggest expense?',
  'How is my savings rate trending?',
]

export default function AskAI() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendMessage = async (question: string) => {
    if (!question.trim()) return

    setMessages([...messages, { role: 'user', content: question }])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const response = await askAI(question)
      setMessages((prev) => [...prev, { role: 'assistant', content: response.answer }])
    } catch (err: any) {
      setError(err.message)
      setMessages((prev) => prev.slice(0, -1)) // Remove the user message if API fails
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Ask AI About Your Finances</h2>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <p className="text-sm text-blue-900">
          💡 Ask Claude anything about your spending patterns, savings goals, or financial advice based on your data.
        </p>
      </div>

      {/* Chat Area */}
      <div className="bg-white rounded shadow p-6 space-y-4" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p className="mb-4">No conversation yet. Try one of these questions:</p>
              <div className="space-y-2">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-bl-none'
                    : 'bg-gray-200 text-gray-900 rounded-tl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded rounded-tl-none">
                <p className="text-sm">Thinking...</p>
              </div>
            </div>
          )}
        </div>

        {error && <div className="text-sm text-red-600 p-2 bg-red-50 rounded">{error}</div>}

        {/* Input Area */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
            placeholder="Ask a question about your finances..."
            className="flex-1 px-3 py-2 border rounded"
            disabled={loading}
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
