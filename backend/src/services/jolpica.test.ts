import { expect, test, describe } from "bun:test";
import { fetchJolpicaJson, parseRetryAfter, isRetryableStatus, UpstreamError } from "./jolpica.ts";
import { formatLog } from "./logger.ts";

/** Builds a fake fetch that plays back one response (or thrown error) per call. */
function scripted(steps: Array<Response | Error>) {
  const calls: string[] = [];
  const impl = (async (input: any) => {
    calls.push(String(input));
    const step = steps[calls.length - 1];
    if (!step) throw new Error("unexpected extra fetch");
    if (step instanceof Error) throw step;
    return step;
  }) as typeof fetch;
  return { impl, calls };
}

const noSleep = { sleep: async () => {}, random: () => 0 };
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

describe("fetchJolpicaJson", () => {
  test("returns JSON on the first success", async () => {
    const { impl, calls } = scripted([json({ ok: 1 })]);
    expect(await fetchJolpicaJson("current/driverstandings.json", { fetchImpl: impl, ...noSleep })).toEqual({ ok: 1 });
    expect(calls).toEqual(["https://api.jolpi.ca/ergast/f1/current/driverstandings.json"]);
  });

  test("retries 429 and 5xx, then succeeds", async () => {
    const { impl, calls } = scripted([json({}, 429), json({}, 503), json({ ok: 2 })]);
    expect(await fetchJolpicaJson("x.json", { fetchImpl: impl, ...noSleep })).toEqual({ ok: 2 });
    expect(calls.length).toBe(3);
  });

  test("retries network errors, timeouts and broken JSON", async () => {
    const timeout = Object.assign(new Error("timed out"), { name: "TimeoutError" });
    const { impl, calls } = scripted([
      new TypeError("fetch failed"),
      timeout,
      new Response("<html>busy</html>", { status: 200 }),
      json({ ok: 3 }),
    ]);
    expect(await fetchJolpicaJson("x.json", { fetchImpl: impl, ...noSleep })).toEqual({ ok: 3 });
    expect(calls.length).toBe(4);
  });

  test("fails fast on a non-retryable 4xx", async () => {
    const { impl, calls } = scripted([json({}, 404)]);
    const err = await fetchJolpicaJson("x.json", { fetchImpl: impl, ...noSleep }).catch((e) => e);
    expect(err).toBeInstanceOf(UpstreamError);
    expect(err.status).toBe(404);
    expect(calls.length).toBe(1);
  });

  test("gives up after the last attempt with the last status", async () => {
    const { impl, calls } = scripted([json({}, 502), json({}, 502), json({}, 429)]);
    const err = await fetchJolpicaJson("x.json", { attempts: 3, fetchImpl: impl, ...noSleep }).catch((e) => e);
    expect(err).toBeInstanceOf(UpstreamError);
    expect(err.status).toBe(429);
    expect(err.attempts).toBe(3);
    expect(calls.length).toBe(3);
  });

  test("backs off exponentially and honours Retry-After, capped at maxDelayMs", async () => {
    const waits: number[] = [];
    const { impl } = scripted([json({}, 500), json({}, 429, { "retry-after": "7" }), json({}, 429, { "retry-after": "999" }), json({ ok: 4 })]);
    await fetchJolpicaJson("x.json", {
      fetchImpl: impl,
      baseDelayMs: 1000,
      maxDelayMs: 20000,
      random: () => 0,
      sleep: async (ms) => void waits.push(ms),
    });
    // 1st: base 1000. 2nd: backoff 2000 but Retry-After says 7000. 3rd: Retry-After 999s capped to 20000.
    expect(waits).toEqual([1000, 7000, 20000]);
  });
});

describe("helpers", () => {
  test("isRetryableStatus", () => {
    for (const s of [408, 429, 500, 502, 503, 504]) expect(isRetryableStatus(s)).toBe(true);
    for (const s of [400, 401, 403, 404]) expect(isRetryableStatus(s)).toBe(false);
  });

  test("parseRetryAfter handles seconds, HTTP dates and junk", () => {
    expect(parseRetryAfter("3")).toBe(3000);
    expect(parseRetryAfter(new Date(10_000).toUTCString(), 4_000)).toBe(6000);
    expect(parseRetryAfter("soon")).toBeNull();
    expect(parseRetryAfter(null)).toBeNull();
  });

  test("logger keeps the message and fields of an Error instead of {}", () => {
    const line = JSON.parse(formatLog("error", { err: new UpstreamError("boom", 429, 4) }, "x"));
    expect(line.err.name).toBe("UpstreamError");
    expect(line.err.message).toBe("boom");
    expect(line.err.status).toBe(429);
    expect(line.err.attempts).toBe(4);
  });
});
