import { randomUUID } from 'crypto';

/**
 * Request ID Middleware.
 * Assigns a unique correlation ID to every incoming request.
 * Sets the 'X-Request-Id' header on both the request and response.
 */
export function requestIdMiddleware(req, res, next) {
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId.trim().length > 0
    ? incomingId.trim().slice(0, 64)
    : randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

export default requestIdMiddleware;
