/**
 * Lightweight structured logger for Cloudflare Workers.
 *
 * Outputs JSON to console.log/warn/error which CF Workers Observability
 * automatically indexes, filters, and displays in the dashboard.
 * Replaces pino — no Node.js streams or worker_threads needed.
 *
 * Same call signature as before: logger.info({ job: "x" }, "message")
 */

/**
 * JSON.stringify turns an Error into "{}" because name, message and stack are not enumerable,
 * so `logger.error({ err }, ...)` used to log `"err":{}` and hide every failure reason.
 * This replacer expands Errors (and their `cause`) into plain objects.
 */
function errorReplacer(_key: string, value: unknown) {
  if (value instanceof Error) {
    const out: Record<string, unknown> = { name: value.name, message: value.message };
    // Keep extra fields such as UpstreamError.status / attempts or postgres error codes.
    for (const [k, v] of Object.entries(value)) out[k] = v;
    if (value.stack) out.stack = value.stack;
    const cause = (value as { cause?: unknown }).cause;
    if (cause !== undefined) out.cause = cause;
    return out;
  }
  return value;
}

export function formatLog(level: string, ctx: Record<string, unknown>, msg: string): string {
  return JSON.stringify({ level, msg, ...ctx, ts: Date.now() }, errorReplacer);
}

export const logger = {
  info(ctx: Record<string, unknown>, msg: string) {
    console.log(formatLog("info", ctx, msg));
  },
  warn(ctx: Record<string, unknown>, msg: string) {
    console.warn(formatLog("warn", ctx, msg));
  },
  error(ctx: Record<string, unknown>, msg: string) {
    console.error(formatLog("error", ctx, msg));
  },
};
