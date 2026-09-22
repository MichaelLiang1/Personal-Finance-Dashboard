import Papa from 'papaparse'
import { Database } from 'sql.js'
import { getDb, saveDb } from '../db.js'
import { categorizeTransaction } from './categoryRules.js'

export interface ParsedTransaction {
  date: string
  description: string
  amount: number
  category: string
}

interface DetectionResult {
  dateCol: number
  descCol: number
  amountCol: number
}

// Try to parse a date string in multiple common formats
function parseDate(val: string): string | null {
  const s = val.trim()

  // ISO format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.split('T')[0]

  // MM/DD/YYYY
  const m1 = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s)
  if (m1) {
    const [, month, day, year] = m1
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // DD/MM/YYYY (if day > 12, disambiguate)
  const m2 = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s)
  if (m2) {
    const [, a, b, year] = m2
    const day = parseInt(a), month = parseInt(b)
    if (day > 12) return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  }

  return null
}

function isDateLike(val: string): boolean {
  return parseDate(val) !== null
}

function isNumberLike(val: string): boolean {
  const num = parseFloat(val.replace(/[^0-9.-]/g, ''))
  return !isNaN(num) && val.trim().length > 0
}

function parseAmount(val: string): number {
  return parseFloat(val.replace(/[^0-9.-]/g, ''))
}

// Auto-detect column indices for date, description, amount
function detectColumns(rows: string[][]): DetectionResult | null {
  if (rows.length < 2) return null

  const headers = rows[0].map(h => h.toLowerCase())
  const sampleData = rows.slice(1, 6) // Check first 5 data rows

  let dateCol = -1, descCol = -1, amountCol = -1

  // Try header names first
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]
    if (dateCol === -1 && /date|transaction date|posted|created/.test(h)) dateCol = i
    if (descCol === -1 && /description|name|merchant|note|details/.test(h)) descCol = i
    if (amountCol === -1 && /amount|debit|credit|value|transaction/.test(h)) amountCol = i
  }

  // Fallback: detect by data type
  if (dateCol === -1 || descCol === -1 || amountCol === -1) {
    for (let col = 0; col < headers.length; col++) {
      const col_data = sampleData.map(r => r[col] || '')
      const dateScore = col_data.filter(isDateLike).length
      const numberScore = col_data.filter(isNumberLike).length

      if (dateCol === -1 && dateScore >= 3) dateCol = col
      if (amountCol === -1 && numberScore >= 3) amountCol = col
    }

    // Description is any non-date, non-number column (typically longest text)
    if (descCol === -1) {
      let maxLen = 0
      for (let col = 0; col < headers.length; col++) {
        if (col === dateCol || col === amountCol) continue
        const avgLen = sampleData.reduce((sum, r) => sum + (r[col] || '').length, 0) / sampleData.length
        if (avgLen > maxLen) {
          maxLen = avgLen
          descCol = col
        }
      }
    }
  }

  if (dateCol === -1 || descCol === -1 || amountCol === -1) {
    return null
  }

  return { dateCol, descCol, amountCol }
}

export async function importCsv(csvText: string): Promise<ParsedTransaction[]> {
  const result = Papa.parse(csvText, { skipEmptyLines: true })
  if (result.errors.length > 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`)
  }

  const rows = result.data as string[][]
  const detection = detectColumns(rows)

  if (!detection) {
    throw new Error('Could not auto-detect CSV columns. Expected columns: date, description, amount')
  }

  const { dateCol, descCol, amountCol } = detection
  const transactions: ParsedTransaction[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length < Math.max(dateCol, descCol, amountCol) + 1) continue

    const dateStr = row[dateCol]?.trim()
    const desc = row[descCol]?.trim()
    const amountStr = row[amountCol]?.trim()

    if (!dateStr || !desc || !amountStr) continue

    const date = parseDate(dateStr)
    if (!date) continue

    const amount = parseAmount(amountStr)
    if (isNaN(amount)) continue

    const category = categorizeTransaction(desc)

    transactions.push({
      date,
      description: desc,
      amount,
      category,
    })
  }

  // Insert into database
  const db = await getDb()

  for (const tx of transactions) {
    db.run(
      `INSERT INTO transactions (date, description, amount, category, source_row)
       VALUES (?, ?, ?, ?, ?)`,
      [tx.date, tx.description, tx.amount, tx.category, JSON.stringify(tx)]
    )
  }

  saveDb()

  return transactions
}
