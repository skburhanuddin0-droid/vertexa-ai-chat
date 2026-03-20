// helpers for localStorage chat sessions — scoped per user
const STORAGE_PREFIX = 'ai-chat-sessions';

function getKey(userId) {
  return userId ? `${STORAGE_PREFIX}-${userId}` : STORAGE_PREFIX;
}

export function loadSessions(userId) {
  try {
    const raw = localStorage.getItem(getKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load sessions', e);
    return {};
  }
}

export function saveSessions(sessions, userId) {
  try {
    localStorage.setItem(getKey(userId), JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions', e);
  }
}

// Clean up old shared storage key (migration)
export function clearOldSessions() {
  try {
    localStorage.removeItem(STORAGE_PREFIX);
  } catch (e) { }
}
