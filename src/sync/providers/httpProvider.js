// Provider for a plain HTTPS sync API (self-hosted, or an edge function in
// front of a hosted database). Endpoints:
//
//   POST {baseUrl}/sync/push   body { changes: Row[] }          -> 204
//   GET  {baseUrl}/sync/pull?cursor=<n>                          -> { rows, cursor, hasMore }
//
// Auth is a bearer token from whichever auth service is chosen; getToken()
// returns it (or null when signed out) and getUserId() the account id.

export function createHttpProvider({ baseUrl, getToken, getUserId }) {
  const root = baseUrl.replace(/\/$/, '')

  async function request(path, init = {}) {
    const token = await getToken()
    if (!token) throw new Error('Not signed in')
    const response = await fetch(`${root}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, ...(init.headers || {}) },
    })
    if (!response.ok) throw new Error(`Sync request failed (${response.status})`)
    return response.status === 204 ? null : response.json()
  }

  return {
    async getSession() {
      const userId = await getUserId()
      return userId ? { userId } : null
    },
    async push(_userId, changes) {
      await request('/sync/push', { method: 'POST', body: JSON.stringify({ changes }) })
    },
    async pull(_userId, cursor) {
      const query = cursor == null ? '' : `?cursor=${encodeURIComponent(cursor)}`
      return request(`/sync/pull${query}`)
    },
  }
}
