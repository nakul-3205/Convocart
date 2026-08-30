// Sends structured log entries to the terminal running the Vite dev server — see
// vite-terminal-logger.js. Dev-only: import.meta.env.DEV is false in a production
// build, so send() below is a no-op and nothing is ever emitted from a deployed app.

const DEV = import.meta.env.DEV;

function send(entry) {
  if (!DEV) return;
  fetch('/__convocart_log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...entry, time: Date.now() }),
    keepalive: true,
  }).catch(() => {
    // the dev logger endpoint only exists while `vite` is running — never let this
    // convenience channel break the app if it's unreachable for any reason
  });
}

export const devLogger = {
  request: (method, url, body) => send({ kind: 'request', method, url, body }),
  response: (method, url, status, ms, data) => send({ kind: 'response', method, url, status, ms, data }),
  responseError: (method, url, status, ms, code, message) =>
    send({ kind: 'response-error', method, url, status, ms, code, message }),
  networkError: (method, url, ms) => send({ kind: 'network-error', method, url, ms }),
  error: (message) => send({ kind: 'error', message }),
};
