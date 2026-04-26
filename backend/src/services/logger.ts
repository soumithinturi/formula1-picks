import pino from "pino";

/**
 * Global logger service configured for F1 Picks.
 * 
 * Strategy (per user request):
 * - Production (NODE_ENV=production): Human-readable logs via pino-pretty for easier debugging in production dashboards.
 * - Local / Default: High-performance JSON output.
 */
const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // In production, we use pino-pretty for human readability in cloud provider logs.
  // In dev/local, we use standard JSON for high performance.
  transport: isProduction
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "hostname,pid",
        },
      }
    : undefined,
});
