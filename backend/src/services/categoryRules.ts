// Rule-based transaction categorizer using keyword matching
// Each rule is a regex pattern that matches against the transaction description
// The first matching rule wins

export interface CategoryRule {
  category: string
  patterns: RegExp[]
}

export const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Groceries',
    patterns: [/\bgrocery|whole foods|trader joe|safeway|kroger|target|walmart\b/i],
  },
  {
    category: 'Dining',
    patterns: [/\bcafe|restaurant|pizza|burger|sushi|coffee|doordash|grubhub|uber eats|food delivery\b/i],
  },
  {
    category: 'Transportation',
    patterns: [/\bgas station|shell|chevron|exxon|uber|lyft|taxi|parking|toll|transit|metro\b/i],
  },
  {
    category: 'Utilities',
    patterns: [/\belectric|water|gas|internet|phone|cable|utility\b/i],
  },
  {
    category: 'Subscription',
    patterns: [/\bspotify|netflix|hulu|adobe|microsoft|apple|subscription|monthly fee\b/i],
  },
  {
    category: 'Entertainment',
    patterns: [/\bmovie|cinema|theater|concert|game|gaming|twitch|music\b/i],
  },
  {
    category: 'Health',
    patterns: [/\bpharmacy|doctor|hospital|gym|fitness|medical|health|cvs|walgreens\b/i],
  },
  {
    category: 'Shopping',
    patterns: [/\bamazon|ebay|clothing|apparel|shoes|mall|store|retail|shop\b/i],
  },
  {
    category: 'Rent',
    patterns: [/\brent|landlord|housing|mortgage\b/i],
  },
]

export function categorizeTransaction(description: string): string {
  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(description)) {
        return rule.category
      }
    }
  }
  return 'Other'
}
