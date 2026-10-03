import type { ErrorRequestHandler } from "express";
import { logger } from "./logger";
import { redactErrorMessage } from "./requestMetrics";

interface HttpLikeError {
  status?: unknown;
  statusCode?: unknown;
  type?: unknown;
  expose?: unknown;
  message?: unknown;
}

/**
 * Body parsers and other middleware reject bad requests with an error that
 * carries its own 4xx status (malformed JSON, body too large, wrong charset).
 * Those are the client's mistake, not a server failure.
 */
function clientErrorStatus(err: unknown): number | undefined {
  const candidate = err as HttpLikeError | null;
  const status = candidate?.status ?? candidate?.statusCode;
  return typeof status === "number" && status >= 400 && status < 500 ? status : undefined;
}

function clientErrorBody(err: HttpLikeError, status: number): { error: string; message: string } {
  if (err.type === "entity.parse.failed") return { error: "invalid_json", message: "Request body is not valid JSON." };
  if (status === 413) return { error: "payload_too_large", message: "Request body is too large." };
  if (status === 415) return { error: "unsupported_media_type", message: "Unsupported content type or charset." };
  // `expose` marks http-errors whose text is safe to show a client.
  const message = err.expose === true && typeof err.message === "string" ? err.message : "Bad request.";
  return { error: "bad_request", message };
}

/**
 * Global Express error handler — catches anything thrown or passed via
 * next(err). Without it Express would answer with an HTML error page.
 *
 *  - CORS rejections stay 403.
 *  - Client mistakes (malformed JSON, oversized body) are answered with their
 *    own 4xx and logged as warnings, so scanners and bots do not show up as
 *    server failures in the logs or on the Live Health page.
 *  - Anything else is a real server error: logged, recorded (redacted) for the
 *    Live Health page, and answered with a generic message in production so
 *    internal details such as SQL never reach the client.
 */
export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const message = err instanceof Error ? err.message : "An unexpected error occurred";
  const isCors = message.startsWith("CORS:");
  const status = isCors ? undefined : clientErrorStatus(err);

  if (status !== undefined) {
    logger.warn(
      { status, method: req.method, url: req.url?.split("?", 1)[0], type: (err as HttpLikeError).type },
      "[http] rejected a malformed request",
    );
  } else if (!isCors) {
    logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
    // Shown on the admin Live Health page, so strip anything secret-looking.
    if (res.locals) res.locals.metricsErrorMessage = redactErrorMessage(err);
  }

  // Once a response has started we cannot send a clean error. Express's own
  // handler closes the connection, which is better than leaving it hanging.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (isCors) {
    res.status(403).json({ error: "cors_error", message });
    return;
  }
  if (status !== undefined) {
    res.status(status).json(clientErrorBody(err as HttpLikeError, status));
    return;
  }
  res.status(500).json({
    error: "internal_error",
    message: process.env.NODE_ENV === "production" ? "An unexpected error occurred." : message,
  });
};
