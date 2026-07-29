/**
 * Cloudflare Web Analytics, loaded only if a token is configured.
 *
 * Chosen over Google Analytics deliberately: it sets no cookies and stores no
 * per-visitor identifiers, so it needs no consent banner under GDPR — which
 * matters when the whole pitch is that your notes stay yours. It also costs
 * nothing on the account the reflection Worker already uses.
 *
 * With the token unset the app runs exactly as before and sends nothing.
 */
const TOKEN = import.meta.env.VITE_CF_ANALYTICS_TOKEN ?? "";

export const startAnalytics = () => {
  if (!TOKEN) return;

  // Installed copies open offline constantly; a beacon that cannot reach the
  // network is just a console error.
  if (!navigator.onLine) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.dataset.cfBeacon = JSON.stringify({ token: TOKEN });
  document.head.appendChild(script);
};
