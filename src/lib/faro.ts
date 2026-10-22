// Real user monitoring with Grafana Faro: web vitals, JavaScript errors,
// console warnings/errors and request timings from visitors' own browsers,
// sent to Grafana Cloud Frontend Observability (the obs.djmiskey.com lab
// shows what arrives). The collector URL isn't a secret (every browser sees
// it); Grafana only accepts it from this site's origin (CORS).

export const FARO = {
  url: "https://faro-collector-prod-us-east-3.grafana.net/collect/a52946f6992ed8300593879cea7dbdfc",
  app: "motion-lab",
  /** Only the real site reports: local dev, previews and tests send nothing. */
  host: "motion.djmiskey.com",
  /** Requests that get a traceparent, so their trace continues into the API lab. */
  traceInto: [/^https:\/\/api\.djmiskey\.com\//],
};

export const faroEnabled = (hostname: string) => Boolean(FARO.url) && hostname === FARO.host;
