/**
 * Lightweight structured logger for Cloudflare Workers.
 *
 * Outputs JSON to console.log/warn/error which CF Workers Observability
 * automatically indexes, filters, and displays in the dashboard.
 * Replaces pino — no Node.js streams or worker_threads needed.
 *
 * Same call signature as before: logger.info({ job: "x" }, "message")
 */
export const logger = {
  info(ctx: Record<string, unknown>, msg: string) {
    console.log(JSON.stringify({ level: "info", msg, ...ctx, ts: Date.now() }));
  },
  warn(ctx: Record<string, unknown>, msg: string) {
    console.warn(JSON.stringify({ level: "warn", msg, ...ctx, ts: Date.now() }));
  },
  error(ctx: Record<string, unknown>, msg: string) {
    console.error(JSON.stringify({ level: "error", msg, ...ctx, ts: Date.now() }));
  },
};
