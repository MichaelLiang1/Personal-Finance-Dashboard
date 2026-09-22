import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'finance.db')

let db: SqlJsDatabase | null = null
let SQL: any = null

async function initSql() {
  if (!SQL) {
    SQL = await initSqlJs()
  }
  return SQL
}

export async function getDb(): Promise<SqlJsDatabase> {
  if (!db) {
    const SQL = await initSql()

    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH)
      db = new SQL.Database(data)
    } else {
      db = new SQL.Database()
    }
  }
  return db
}

export function saveDb() {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(DB_PATH, buffer)
  }
}

export async function initDb() {
  const database = await getDb()

  // Create transactions table
  database.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      is_user_edited INTEGER DEFAULT 0,
      source_row TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create goals table
  database.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      target_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  saveDb()
  console.log('Database initialized')
}
