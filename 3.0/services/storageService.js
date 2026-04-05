export function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('localStorage save failed:', e)
  }
}

export function load(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

export function remove(key) {
  localStorage.removeItem(key)
}

/** Returns approximate bytes used by all rb_ keys */
export function getUsedBytes() {
  let total = 0
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('rb_')) total += (localStorage[key].length * 2)
  }
  return total
}
