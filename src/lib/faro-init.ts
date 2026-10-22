import { getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { FARO } from "./faro";

// Loaded on demand by instrumentation-client.ts, in its own chunk.
export function init() {
  initializeFaro({
    url: FARO.url,
    app: {
      name: FARO.app,
      version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      environment: "production",
    },
    // A random id per browser tab (sessionStorage): no cookies, no accounts.
    sessionTracking: { enabled: true, persistent: false },
    instrumentations: [
      // Web vitals, errors, console warn/error, page views, resource timings.
      ...getWebInstrumentations({ captureConsole: true }),
      // Spans for fetch/XHR; requests to the API lab carry a traceparent, so
      // a leaderboard call's trace runs from the browser into the API.
      new TracingInstrumentation({ instrumentationOptions: { propagateTraceHeaderCorsUrls: FARO.traceInto } }),
    ],
  });
}
