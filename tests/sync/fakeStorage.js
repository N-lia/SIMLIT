// Minimal localStorage stand-in. Each simulated device gets its own instance;
// swapping globalThis.localStorage switches which device the code under test sees.
export function createFakeStorage() {
  const data = new Map()
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
    get length() {
      return data.size
    },
  }
}
