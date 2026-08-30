// Dev-facing console logger for every API call the frontend makes. Grouped and
// timestamped so you can open devtools and immediately see whether a request left
// the browser, what came back, and how long it took.

let seq = 0;

function ts() {
  return new Date().toLocaleTimeString('en-IN', { hour12: false });
}

export const logger = {
  banner(apiBase) {
    console.log(
      '%c[convocart] API base → %c%s',
      'color:#35513F;font-weight:700',
      'color:#1B1A17;font-weight:700',
      apiBase,
    );
    console.log('%c[convocart] every request/response below is grouped — open a group to inspect it', 'color:#726E66');
  },

  request(method, url, body) {
    const id = ++seq;
    console.groupCollapsed(`%c→ #${id} ${method} ${url}`, 'color:#35513F;font-weight:600', ts());
    if (body) console.log('body:', body);
    console.groupEnd();
    return id;
  },

  response(id, method, url, status, ms, data) {
    const ok = status >= 200 && status < 300;
    console.groupCollapsed(
      `%c← #${id} ${status} ${method} ${url} (${ms}ms)`,
      `color:${ok ? '#35513F' : '#A33B2E'};font-weight:600`,
    );
    console.log('data:', data);
    console.groupEnd();
  },

  networkError(id, method, url, ms, err) {
    console.groupCollapsed(
      `%c✕ #${id} ${method} ${url} — never got a response (${ms}ms)`,
      'color:#A33B2E;font-weight:700',
    );
    console.error(err);
    console.log(
      '%cThis usually means: the backend isn\'t running, it\'s on a different port than VITE_API_URL, or CORS blocked it (check the Network tab for a red request).',
      'color:#A33B2E',
    );
    console.groupEnd();
  },

  error(...args) {
    console.error('%c[convocart]', 'color:#A33B2E;font-weight:600', ...args);
  },
};
