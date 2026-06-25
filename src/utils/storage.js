// Single-key persistence for the entire auction state.
// Versioned so future schema changes can be handled without breaking saved data.

export const STORAGE_KEY = 'cricket-auction:v1';
export const STORAGE_VERSION = 26;

export function load() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== STORAGE_VERSION) return null;
    return parsed;
  } catch (err) {
    console.warn('[auction] failed to load state from localStorage', err);
    return null;
  }
}

export function save(state) {
  if (typeof window === 'undefined') return;
  try {
    const payload = { ...state, version: STORAGE_VERSION, savedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[auction] failed to persist state to localStorage', err);
  }
}

export function reset() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
