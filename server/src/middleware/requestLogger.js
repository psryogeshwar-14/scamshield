import { IS_TEST } from '../config/index.js';

/**
 * Privacy-preserving request logger middleware.
 * Logs method, path, status, duration, and safe length metadata WITHOUT
 * leaking full message bodies, passwords, or personal credentials.
 */
export function requestLogger(req, res, next) {
  if (IS_TEST) return next();

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    let context = '';

    if (req.body && typeof req.body === 'object') {
      if (req.body.url && typeof req.body.url === 'string') {
        try {
          const parsed = new URL(req.body.url.trim());
          context = ` [url_host: ${parsed.hostname}, path_len: ${parsed.pathname.length}]`;
        } catch {
          context = ` [url_chars: ${req.body.url.length}]`;
        }
      } else if (req.body.message && typeof req.body.message === 'string') {
        context = ` [message_chars: ${req.body.message.length}]`;
      } else if (req.body.userInput && typeof req.body.userInput === 'string') {
        context = ` [type: ${req.body.inputType || 'unknown'}, chars: ${req.body.userInput.length}]`;
      }
    }

    const statusIcon = res.statusCode >= 500 ? '🔴' : res.statusCode >= 400 ? '🟡' : '🟢';
    const reqId = req.id ? ` [id: ${req.id.slice(0, 8)}]` : '';

    console.log(
      `${statusIcon} ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)${reqId}${context}`
    );
  });

  next();
}

export default requestLogger;
