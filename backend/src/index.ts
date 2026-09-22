import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDb } from './db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// TODO: Mount route modules here
// app.use('/api/transactions', transactionsRouter)
// app.use('/api/analytics', analyticsRouter)
// app.use('/api/goals', goalsRouter)
// app.use('/api/ai', aiRouter)

async function start() {
  await initDb()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start().catch(console.error)
