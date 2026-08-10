function parseStart(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function parseLimit(value, fallback = 20) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, 100);
}

function skipLimit(start, limit) {
  const s = parseStart(start);
  const l = parseLimit(limit);
  return { skip: s, limit: l };
}

module.exports = { parseStart, parseLimit, skipLimit };
