import { searchLocations, findLocationByQuery } from './fuzzySearch';

// Patterns for intent detection
const WHERE_PATTERNS = [
  /where(?:\s+is|\s+can\s+i\s+find)?\s+(?:the\s+)?(.+)/i,
  /(?:find|locate|show|take\s+me\s+to)\s+(?:the\s+)?(.+)/i,
  /how\s+(?:to|do\s+i)\s+(?:get|reach|go)\s+to\s+(?:the\s+)?(.+)/i,
  /(?:what's|what\s+is)\s+(?:the\s+location\s+of\s+)?(.+)/i,
  /(?:directions?\s+to|navigate\s+to|path\s+to)\s+(?:the\s+)?(.+)/i,
];

const FROM_PATTERNS = [
  /from\s+(?:the\s+)?(.+?)(?:\s+to|\s*$)/i,
  /starting\s+(?:from\s+)?(?:the\s+)?(.+?)(?:\s+to|\s*$)/i,
];

const TO_PATTERNS = [
  /to\s+(?:the\s+)?(.+?)(?:\s+from|\s*$)/i,
];

const NEARBY_PATTERNS = [
  /(?:nearby|near|around|close\s+to|adjacent)\s+(?:the\s+)?(.+)/i,
  /what(?:'s|\s+is)\s+near\s+(?:the\s+)?(.+)/i,
];

/**
 * Parse a natural language query into structured intent
 */
export function parseIntent(query) {
  const q = query.trim();

  // Check for "from X to Y" pattern
  const fromMatch = FROM_PATTERNS.map(p => p.exec(q)).find(Boolean);
  const toMatch = TO_PATTERNS.map(p => p.exec(q)).find(Boolean);

  if (fromMatch && toMatch) {
    const sourceText = fromMatch[1].trim();
    const destText = toMatch[1].trim();
    const source = findLocationByQuery(sourceText);
    const destination = findLocationByQuery(destText);
    if (destination) {
      return {
        type: 'navigate',
        source: source || null,
        destination,
        rawQuery: q,
        confidence: source ? 'high' : 'medium',
      };
    }
  }

  // Check for nearby pattern
  for (const pattern of NEARBY_PATTERNS) {
    const match = pattern.exec(q);
    if (match) {
      const loc = findLocationByQuery(match[1].trim());
      if (loc) {
        return { type: 'nearby', location: loc, rawQuery: q };
      }
    }
  }

  // Check for where/navigate pattern
  for (const pattern of WHERE_PATTERNS) {
    const match = pattern.exec(q);
    if (match) {
      // Try to extract source from the matched text
      const destText = match[1].trim();
      const fromInDest = FROM_PATTERNS.map(p => p.exec(destText)).find(Boolean);

      let sourceText = null;
      let cleanDest = destText;

      if (fromInDest) {
        sourceText = fromInDest[1].trim();
        cleanDest = destText.replace(FROM_PATTERNS[0], '').replace(FROM_PATTERNS[1], '').trim();
      }

      const destination = findLocationByQuery(cleanDest);
      const source = sourceText ? findLocationByQuery(sourceText) : null;

      if (destination) {
        return {
          type: 'navigate',
          source,
          destination,
          rawQuery: q,
          confidence: 'high',
        };
      }
    }
  }

  // Fallback: treat entire query as destination search
  const results = searchLocations(q, 3);
  if (results.length > 0) {
    return {
      type: 'navigate',
      source: null,
      destination: results[0],
      alternatives: results.slice(1),
      rawQuery: q,
      confidence: results[0].score < 0.2 ? 'high' : 'low',
    };
  }

  return { type: 'unknown', rawQuery: q };
}
