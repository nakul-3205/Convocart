// Chat history is persisted client-side only, in localStorage — the backend has no
// endpoint to fetch a shopper's past messages, so a refresh would otherwise lose the
// conversation (though the server-side cart itself survives, via the session cookie).

const STORAGE_KEY = 'convocart:chat';

export function loadChat() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null; // corrupted/unavailable storage — just start fresh
  }
}

export function saveChat(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // private browsing / quota exceeded — chat just won't survive a refresh this time
  }
}

export function clearChat() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clean up if storage was never writable
  }
}
