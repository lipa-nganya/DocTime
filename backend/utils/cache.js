/**
 * Simple in-memory cache for static/rarely-changing data
 * Reduces database queries and saves costs
 */

const cache = new Map();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default TTL

/**
 * Get cached value
 */
function get(key) {
  const item = cache.get(key);
  if (!item) return null;
  
  // Check if expired
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
}

/**
 * Set cached value
 */
function set(key, value, ttl = DEFAULT_TTL) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl
  });
}

/**
 * Clear cache for a specific key
 */
function clear(key) {
  cache.delete(key);
}

/**
 * Clear all cache
 */
function clearAll() {
  cache.clear();
}

/**
 * Get cache statistics
 */
function getStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

module.exports = { get, set, clear, clearAll, getStats };

