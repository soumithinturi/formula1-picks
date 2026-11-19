import { logger } from "./logger.ts";

/**
 * Resilient fetch for the Jolpica (Ergast-compatible) F1 API.
 *
 * Why this exists: the daily schedule and standings syncs each make one Jolpica call and turn any
 * non-2xx into a 500. Jolpica is a free, community-run API that rate-limits anonymous callers and
 * has short bursts of 429/5xx. The daily workflow fires both jobs at the same moment from the same
 * Worker, and curl's retries (3 x 10s) re-fire them in lockstep, so a blip that lasts ~30s fails a
 * job. Which job loses is random, which is why the failures move between "Sync Season Schedule"
 * and "Sync Driver Standings" from day to day.
 *
 * This helper retries transient failures inside the Worker with exponential backoff and jitter,
 * honours Retry-After on 429/503, and puts a timeout on every attempt so a hung upstream can't
 * stall the request. Permanent errors (other 4xx) fail fast.
 */

export const JOLPI_API_BASE = "https://api.jolpi.ca/ergast/f1";

/** Thrown when Jolpica can't be reached or keeps answering with an error. */
export class UpstreamError extends Error {
  constructor(
    message: string,
    /** Last HTTP status seen, or null if the request never got a response (timeout / network). */
    public readonly status: number | null,
    public readonly attempts: number
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

export interface JolpicaFetchOptions {
  /** Total attempts, including the first. Default 4. */
  attempts?: number;
  /** Base delay for backoff in ms. Attempt n waits roughly base * 2^(n-1), plus jitter. Default 2000. */
  baseDelayMs?: number;
  /** Upper bound for any single wait, including a server-sent Retry-After. Default 20000. */
  maxDelayMs?: number;
  /** Per-attempt timeout in ms. Default 15000. */
  timeoutMs?: number;
  /** Injected for tests. */
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

/** Statuses worth retrying: rate limited, or a server-side / gateway problem. */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 408 || (status >= 500 && status <= 599);
}

/**
 * Parses Retry-After (either delta-seconds or an HTTP date) into milliseconds.
 * Returns null when the header is missing or unparseable.
 */
export function parseRetryAfter(header: string | null, now = Date.now()): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(header);
  return Number.isNaN(date) ? null : Math.max(0, date - now);
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * GETs `${JOLPI_API_BASE}/${path}` and returns the parsed JSON body.
 * Retries on network errors, timeouts, 408/429/5xx and malformed JSON; throws UpstreamError when
 * every attempt fails or on a non-retryable status.
 */
export async function fetchJolpicaJson<T = any>(path: string, opts: JolpicaFetchOptions = {}): Promise<T> {
  const {
    attempts = 4,
    baseDelayMs = 2000,
    maxDelayMs = 20000,
    timeoutMs = 15000,
    fetchImpl = fetch,
    sleep = defaultSleep,
    random = Math.random,
  } = opts;

  const url = `${JOLPI_API_BASE}/${path.replace(/^\/+/, "")}`;
  let lastStatus: number | null = null;
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= attempts; attempt++) {
    let retryAfterMs: number | null = null;

    try {
      const res = await fetchImpl(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      lastStatus = res.status;

      if (res.ok) {
        try {
          return (await res.json()) as T;
        } catch {
          // A truncated or HTML error page with a 200 has been seen from busy proxies; retry it.
          lastError = "invalid JSON body";
        }
      } else {
        lastError = `HTTP ${res.status}`;
        // Drain the body so the connection can be reused.
        await res.body?.cancel().catch(() => {});
        if (!isRetryableStatus(res.status)) {
          throw new UpstreamError(`Jolpica ${path} failed: ${lastError}`, res.status, attempt);
        }
        retryAfterMs = parseRetryAfter(res.headers.get("retry-after"));
      }
    } catch (err) {
      if (err instanceof UpstreamError) throw err;
      // Timeout (TimeoutError/AbortError) or a network failure: no status to report.
      lastStatus = null;
      lastError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    }

    if (attempt === attempts) break;

    // Exponential backoff with full jitter on top of the base, or the server's Retry-After if longer.
    const backoff = baseDelayMs * 2 ** (attempt - 1);
    const jittered = backoff + Math.floor(random() * backoff);
    const delay = Math.min(maxDelayMs, Math.max(jittered, retryAfterMs ?? 0));

    logger.warn(
      { job: "jolpica", path, attempt, status: lastStatus, error: lastError, retryInMs: delay },
      `Jolpica ${path} attempt ${attempt}/${attempts} failed (${lastError}); retrying in ${delay}ms`
    );
    await sleep(delay);
  }

  throw new UpstreamError(`Jolpica ${path} failed after ${attempts} attempts: ${lastError}`, lastStatus, attempts);
}
