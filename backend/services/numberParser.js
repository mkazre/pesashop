/**
 * Locale-aware number parsing for CSV/Excel imports.
 *
 * The bug we're solving: `parseFloat("1000,00")` returns `1` because parseFloat
 * stops at the first non-digit. A European-formatted price like "1.000,00" or
 * "1000,00" silently truncates to 1.0, so a $1000 product was being stored as $1.
 *
 * This module accepts every format we've seen in real CSVs:
 *   "1000.00"        → 1000     (US standard)
 *   "1000,00"        → 1000     (EU with comma decimal)
 *   "1.000,00"       → 1000     (EU thousands + comma decimal)
 *   "1,000.00"       → 1000     (US thousands + period decimal)
 *   "1,234,567.89"   → 1234567  (US many thousands)
 *   "1.234.567,89"   → 1234567  (EU many thousands)
 *   "1 234,56"       → 1234.56  (ZA / FR space-separated thousands)
 *   "$1,234.56"      → 1234.56  (currency-prefixed)
 *   "R 1 234,56"     → 1234.56  (ZAR with currency code)
 *   "1000"           → 1000
 *   "" / null        → 0
 */

const CURRENCY_RE = /[A-Za-z$€£¥₹₦₱₨₩₪]/g;
const SPACE_RE = /\s+/g;

/**
 * Detect which character is the decimal separator. When both `.` and `,` appear,
 * the rightmost one is the decimal separator and the other is the thousands
 * grouping. When only one appears, decide based on what follows it: 1–2 digits
 * after the separator means decimal; exactly 3 digits with no further separators
 * means thousands grouping.
 */
function detectDecimalSeparator(s) {
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');

  if (lastDot >= 0 && lastComma >= 0) {
    return lastDot > lastComma ? '.' : ',';
  }
  if (lastDot >= 0) {
    const after = s.length - lastDot - 1;
    // "1.234.567" — multiple dots ⇒ thousands. "1.234" with after=3 and only ONE
    // dot ⇒ ambiguous; treat as thousands when the remaining group is exactly 3
    // digits AND there are no other separators.
    const dotCount = (s.match(/\./g) || []).length;
    if (dotCount > 1) return null;          // all dots are thousands separators
    if (after === 3 && dotCount === 1) return null; // ambiguous → treat as thousands
    return '.';
  }
  if (lastComma >= 0) {
    const after = s.length - lastComma - 1;
    const commaCount = (s.match(/,/g) || []).length;
    if (commaCount > 1) return null;
    if (after === 3 && commaCount === 1) return null;
    return ',';
  }
  return null;
}

/**
 * Parse a price-like string (or number) to a Number. Returns 0 for empty/invalid input.
 */
function parsePriceString(input) {
  if (input == null) return 0;
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : 0;
  }

  let s = String(input).trim();
  if (!s) return 0;

  // Strip currency symbols and codes (USD, EUR, ZAR, R, $, €, etc.)
  s = s.replace(CURRENCY_RE, '');
  // Strip whitespace (used as thousands separator in some locales)
  s = s.replace(SPACE_RE, '');
  if (!s) return 0;

  // Negative sign?
  let negative = false;
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith('(') && s.endsWith(')')) {
    // Accounting format "(123.45)" → -123.45
    negative = true;
    s = s.slice(1, -1);
  }

  // Drop anything that isn't digit, dot, or comma at this point
  s = s.replace(/[^0-9.,]/g, '');
  if (!s) return 0;

  const decimalSep = detectDecimalSeparator(s);

  let normalized;
  if (decimalSep === null) {
    // No decimal separator detected — strip both as thousands separators
    normalized = s.replace(/[.,]/g, '');
  } else if (decimalSep === '.') {
    // Period is decimal — remove all commas (thousands)
    normalized = s.replace(/,/g, '');
  } else {
    // Comma is decimal — remove all periods (thousands), then swap , → .
    normalized = s.replace(/\./g, '').replace(',', '.');
  }

  const n = parseFloat(normalized);
  if (!Number.isFinite(n)) return 0;
  return negative ? -n : n;
}

/**
 * Parse an integer-ish quantity (stock count, etc.). Strips thousands separators
 * but rejects decimal portions: "1,000" → 1000, "1000.5" → 1000.
 */
function parseQuantityString(input) {
  if (input == null) return 0;
  if (typeof input === 'number') return Math.trunc(input);
  const n = parsePriceString(input);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

module.exports = { parsePriceString, parseQuantityString, detectDecimalSeparator };
