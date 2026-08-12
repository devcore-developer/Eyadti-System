/**
 * Shared Relevance Ranking for Medical Autocomplete
 * 
 * Priority Order:
 * 1. Exact match          → 100
 * 2. Starts with query    → 80
 * 3. Word starts with     → 60
 * 4. Contains query       → 40
 */

export function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ")
}

export function rankByRelevance(name: string, query: string): number {
  const n = normalize(name)
  const q = normalize(query)

  if (!n || !q || q.length < 2) return 0

  // Priority 1: Exact match
  if (n === q) return 100

  // Priority 2: Starts with query
  if (n.startsWith(q)) return 80

  // Priority 3: Word starts with query (after space, hyphen, slash, etc.)
  const words = n.split(/[\s\-_/()]+/)
  if (words.some(w => w.startsWith(q))) return 60

  // Priority 4: Contains query anywhere
  if (n.includes(q)) return 40

  return 0
}

export interface RankableItem {
  name?: string
  tradeName?: string
  _rank?: number
}

export function rankAndSort<T extends RankableItem>(
  items: T[],
  query: string,
  getName: (item: T) => string
): T[] {
  return items
    .map(item => ({
      ...item,
      _rank: rankByRelevance(getName(item), query)
    }))
    .filter(item => (item._rank ?? 0) > 0)
    .sort((a, b) => {
      // Sort by rank descending
      if ((b._rank ?? 0) !== (a._rank ?? 0)) {
        return (b._rank ?? 0) - (a._rank ?? 0)
      }
      // Secondary: alphabetical by name
      return getName(a).localeCompare(getName(b))
    })
}