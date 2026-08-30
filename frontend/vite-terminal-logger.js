// Dev-only bridge so API activity shows up in the terminal running `vite`/`npm run dev`
// instead of the browser console. `apply: 'serve'` means this plugin — and the
// middleware it registers — doesn't exist at all in a production build.

const COLOR = {
  request: '\x1b[36m', // cyan
  response: '\x1b[32m', // green
  'response-error': '\x1b[33m', // yellow — request succeeded, API returned success:false
  'network-error': '\x1b[31m', // red
  error: '\x1b[31m',
};
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

function time(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour12: false });
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
  });
}

export function terminalLoggerPlugin() {
  return {
    name: 'convocart-terminal-logger',
    apply: 'serve',
    configureServer(server) {
      const print = (msg) => server.config.logger.info(msg, { timestamp: false });

      server.middlewares.use('/__convocart_log', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        const raw = await readBody(req);
        res.statusCode = 204;
        res.end();

        let entry;
        try {
          entry = JSON.parse(raw);
        } catch {
          return;
        }

        const c = COLOR[entry.kind] || '';
        const t = `${DIM}${time(entry.time)}${RESET}`;

        switch (entry.kind) {
          case 'request':
            print(`${t} ${c}→ ${entry.method} ${entry.url}${RESET}${entry.body ? `  ${DIM}${JSON.stringify(entry.body)}${RESET}` : ''}`);
            break;
          case 'response':
            print(`${t} ${c}← ${entry.status} ${entry.method} ${entry.url} ${DIM}(${entry.ms}ms)${RESET}`);
            break;
          case 'response-error':
            print(
              `${t} ${c}⚠ ${entry.status} ${entry.method} ${entry.url} ${DIM}(${entry.ms}ms)${RESET}  ${c}${entry.code}: ${entry.message}${RESET}`,
            );
            break;
          case 'network-error':
            print(`${t} ${c}✕ ${entry.method} ${entry.url} — never got a response ${DIM}(${entry.ms}ms)${RESET}`);
            print(`${DIM}   likely cause: backend not running, wrong VITE_API_URL, or CORS rejected it${RESET}`);
            break;
          default:
            print(`${t} ${c}✕ ${entry.message}${RESET}`);
        }
      });

      print(`${COLOR.request}[convocart] terminal logger ready — API activity will print here${RESET}`);
    },
  };
}
