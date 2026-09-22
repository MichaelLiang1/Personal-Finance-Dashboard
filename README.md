# Personal Finance Risk & Planning Dashboard

A full-stack personal finance web app that helps you track spending, set goals, detect unusual patterns, and get AI-powered insights about your finances.

## Features

[x] Import & Categorize - Upload bank transaction CSV files with automatic spending categorization
[x] Dashboard Analytics - View income vs expenses, spending breakdown by category, monthly trends
[x] Financial Goals - Set savings goals and get projections on when you'll reach them
[x] Anomaly Detection - Automatic flagging of unusual spending patterns (using z-score analysis)
[x] AI Insights - Ask Claude about your finances: "Why did I spend more?" or "Where can I cut $200?"
[x] Privacy First - All data stays on your machine (local SQLite database)

## Tech Stack

### Backend
- Express.js - Minimal web framework for the API
- SQLite (via sql.js) - Local, serverless database
- Node.js + TypeScript - Strong types, clear intent
- Anthropic SDK - Integration with Claude API for Q&A

### Frontend
- React + TypeScript - Component-based UI
- Vite - Fast dev server with hot reload
- Tailwind CSS - Utility-first styling
- Recharts - Composable charting library

### Architecture
- Monorepo with npm workspaces - backend/ and frontend/ share dependencies
- CORS-enabled - Frontend (5173) talks to backend (3001)
- API-first - Backend is completely decoupled from frontend

## Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- (Optional) Anthropic API key for AI features - get one at https://console.anthropic.com

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY (optional)

# 3. Start both servers
npm run dev
```

The app will open at http://localhost:5173 (frontend) with the backend running at http://localhost:3001.

## Usage Walkthrough

### 1. Import Transactions
1. Go to the Transactions page
2. Click "Import CSV File" and upload a bank statement (or use sample-transactions.csv)
3. The system auto-detects columns (date, description, amount) and auto-categorizes spending
4. You can edit categories inline if the auto-categorization missed something

CSV Format: Any format with columns for date, description/merchant, and amount. Handles:
- Multiple date formats: 2026-05-01, 05/01/2026, 1/5/2026
- Signed amounts: 100 = income, -50 = expense (or separate debit/credit columns)
- Real-world bank CSV headers like "Transaction Date", "Merchant", "Debit"

### 2. View Analytics Dashboard
Go to Dashboard to see:
- Stat tiles - Income, expenses, net savings, savings rate
- Monthly trends - Income and expense lines over time
- Spending breakdown - Pie chart of expenses by category
- Anomaly alerts - Yellow banner if unusual spending detected

### 3. Set Financial Goals
Go to Goals to:
1. Create a goal (e.g., "Save $5,000 for emergency fund")
2. See a projection: "You'll reach this in 8 months (by Jan 2027)"
3. The projection uses your recent average monthly savings rate

### 4. Ask AI Questions
Go to Ask AI to ask Claude about your finances:
- "Why did I spend more in July?"
- "Where could I cut $200 per month?"
- "What's my biggest expense category?"
- "How's my savings rate trending?"

The AI gets a summary of your recent finances and answers based on your actual data.

## How It Works (Architecture Deep Dive)

### Backend Data Flow
```
CSV Upload -> Parse + Auto-Detect Columns -> Categorize by Keywords -> Store in SQLite
                                                          |
                                    SQL Queries for Analytics
                                    |
                            Summary, Trends, Anomalies (z-score)
                                    |
                        Forward to Claude API with User Question
                                    |
                            AI Answer + Recommendations
```

### Categorization
Uses regex keyword matching ("amazon" -> Shopping, "shell" -> Transportation, etc.)
- Auto-applied at import time
- User edits are marked as sticky (is_user_edited = 1) and not overwritten on re-import

### Anomaly Detection
- Monthly z-score: Flags categories where a month's spending is >1.5σ from 6-month average
- Transaction z-score: Flags individual transactions >2.5σ within their category
- Example: If you normally spend $100/mo on groceries and spent $350 one month, it's flagged

### Goal Projections
```
Months to Goal = Target Amount / (Recent Average Monthly Savings)
Projected Date = Today + Months to Goal
```

If monthly savings is zero or negative, the goal is marked unachievable without behavior change.

## Environment Variables

Create a .env file (copy from .env.example):

```env
# Backend port (default 3001)
PORT=3001

# Anthropic API Key (optional; AI features won't work without it)
ANTHROPIC_API_KEY=sk-ant-...
```

## Project Structure

```
Personal-Finance-Dashboard/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── index.ts           # Express app + route mounting
│   │   ├── db.ts              # SQLite setup + schema
│   │   ├── services/
│   │   │   ├── categoryRules.ts      # Keyword -> category mapping
│   │   │   ├── csvImport.ts          # CSV parsing + auto-detection
│   │   │   ├── analytics.ts          # Summary, trends, anomalies
│   │   │   └── goals.ts              # Goal CRUD + projections
│   │   └── routes/
│   │       ├── transactions.ts       # POST import, GET list, PATCH category
│   │       ├── analytics.ts          # GET summary/by-category/trends/anomalies
│   │       ├── goals.ts              # CRUD + /projection
│   │       └── ai.ts                 # POST /ask -> Claude API
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React UI
│   ├── src/
│   │   ├── main.tsx            # React entry point
│   │   ├── App.tsx             # Tab navigation + page routing
│   │   ├── lib/api.ts          # Typed fetch wrappers
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # Stats + charts (Recharts)
│   │   │   ├── Transactions.tsx # CSV upload + table
│   │   │   ├── Goals.tsx        # Goal creation + projections
│   │   │   └── AskAI.tsx        # Chat interface
│   │   └── index.css            # Tailwind imports
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── package.json                # Monorepo root with workspaces
├── .env.example                # Environment template
├── .gitignore                  # Excludes .env, *.db, node_modules
└── sample-transactions.csv     # Test data
```

## Development Commands

```bash
# Start both servers (frontend + backend)
npm run dev

# Build both projects for production
npm run build

# Start only the backend
npm run dev --workspace=backend

# Start only the frontend
npm run dev --workspace=frontend

# Build backend only
npm run build --workspace=backend
```

## Testing

### Manual Testing Checklist
1. CSV Import: Upload sample-transactions.csv -> confirm categorization
2. Dashboard: Check stat tiles match totals, charts render
3. Goals: Create goal -> confirm projection math is reasonable
4. Anomalies: Check that July (unusual month in sample) is flagged
5. AI: Ask a question -> confirm answer references your actual data

### Sample Data
The repo includes sample-transactions.csv with 4 months of realistic fake data including an intentionally anomalous month (July has unusual shopping spike).

## Design Decisions & Trade-offs

### Why Express over Next.js?
- Minimal, transparent routing (good for learning)
- No SSR overhead (data lives on server, not in React)
- Easy to add middleware (CORS, file upload)

### Why SQLite + sql.js over a SQL database?
- Zero setup - no Docker/managed DB needed
- Privacy - one .db file on your machine
- Perfect for single-user - no concurrent writes
- Trade-off: Not suitable for multiple users or high concurrency

### Why separate backend and frontend?
- API-first design - backend is decoupled, could serve mobile app
- Learning value - see how requests flow through CORS, routes, database
- Scalability - if you want to add a mobile app, the API already exists

### Why rule-based categorization instead of ML?
- Interpretable - you see why a transaction is categorized
- Fast - regex matching is instant, no model loading
- Editable - add/remove rules without retraining
- Trade-off: Won't learn from your edits (could add that later)

## Future Enhancements

- Budget limits per category (flag overspend)
- Forecast future spending based on trends
- Bank API integration (Plaid) to auto-fetch transactions
- Dark mode toggle
- Mobile-responsive refinements
- Email/Slack alerts for anomalies
- ML categorization that learns from user corrections

## Troubleshooting

"Cannot find module 'express'" -> Run npm install at the root

"ANTHROPIC_API_KEY not configured" -> AI features are optional; set it in .env to enable

"Port 3001 already in use" -> Change PORT=3002 in .env

"CSV import failed" -> Check that your CSV has a date column, description/merchant column, and amount. Run the import on sample-transactions.csv first to see the expected format.

## License

MIT