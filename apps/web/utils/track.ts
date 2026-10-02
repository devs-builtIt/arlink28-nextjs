// One place every analytics event goes through. Until a tool is chosen it only feeds window.dataLayer
// (what Google Tag Manager reads), so calling it is safe with nothing installed. Event names are in
// docs/homepage-conversion-strategy.md, section 15.

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: string, params: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  (window.dataLayer ??= []).push({ event, ...params });
}
