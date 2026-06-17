// We fetch the session from the Python FastAPI backend
export async function getAuthSession() {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    const data = await res.json();
    return data.session;
  } catch {
    return null;
  }
}
