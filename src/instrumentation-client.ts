import { faroEnabled } from "@/lib/faro";

// Runs in the browser before the page becomes interactive (Next.js loads this
// file first). Faro itself is loaded only after the page has finished loading
// and the browser is idle, so the monitoring can't slow down the very numbers
// it reports. Web vitals are buffered by the browser, so nothing is lost by
// starting late; errors before then are rare and would show in the console.
function startFaro() {
  import("./lib/faro-init").then(({ init }) => init()).catch(() => {});
}

if (typeof window !== "undefined" && faroEnabled(window.location.hostname)) {
  const later = () => ("requestIdleCallback" in window ? requestIdleCallback(startFaro, { timeout: 5000 }) : setTimeout(startFaro, 2000));
  if (document.readyState === "complete") later();
  else window.addEventListener("load", later, { once: true });
}
