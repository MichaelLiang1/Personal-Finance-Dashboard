import { Router, Request, Response } from 'express'
import multer from 'multer'
import { importCsv } from '../services/csvImport.js'
import { getDb, saveDb } from '../db.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// POST /api/transactions/import - Upload and import CSV
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    const csvText = req.file.buffer.toString('utf-8')
    const transactions = await importCsv(csvText)

    res.json({
      success: true,
      imported: transactions.length,
      transactions,
    })
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// GET /api/transactions - List all transactions
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb()
    const stmt = db.prepare('SELECT * FROM transactions ORDER BY date DESC')
    const rows = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject())
    }
    stmt.free()

    res.json(rows)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// PATCH /api/transactions/:id - Update transaction (e.g., change category)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { category } = req.body

    if (!category) {
      res.status(400).json({ error: 'Category required' })
      return
    }

    const db = await getDb()
    db.run('UPDATE transactions SET category = ?, is_user_edited = 1 WHERE id = ?', [category, parseInt(id)])
    saveDb()

    const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?')
    stmt.bind([parseInt(id)])
    stmt.step()
    const row = stmt.getAsObject()
    stmt.free()

    res.json(row)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
