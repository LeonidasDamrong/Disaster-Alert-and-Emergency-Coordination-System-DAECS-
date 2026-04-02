/** Stable id so we can move the node to end of <head> and beat Google-injected rules. */
export const GOOGLE_PAC_STYLE_ID = 'fyp-google-pac-typography';

/**
 * Dropdown is rendered by Google on `body`. Google injects CSS after our bundle, so rules in
 * index.css can lose for font-size. This sheet is appended (and re-appended on focus) so it wins.
 */
const CSS = `
html body .pac-container .pac-item {
  display: flex !important;
  align-items: flex-start !important;
  font-size: 10px !important;
  line-height: 1.35 !important;
}
html body .pac-container .pac-item .pac-icon {
  align-self: flex-start !important;
  flex-shrink: 0 !important;
  margin-top: 0.125rem !important;
}
html body .pac-container .pac-item .pac-item-query {
  font-size: 13px !important;
  line-height: 1.35 !important;
}
html body .pac-container .pac-item .pac-item-query ~ span,
html body .pac-container .pac-item .pac-item-query ~ div {
  font-size: 10px !important;
  line-height: 1.35 !important;
}
html body .pac-container .pac-item .pac-secondary-text {
  font-size: 10px !important;
  line-height: 1.35 !important;
}
html body .pac-container .pac-item > span:not(.pac-icon) .pac-item-query ~ span,
html body .pac-container .pac-item > span:not(.pac-icon) .pac-item-query ~ div {
  font-size: 10px !important;
  line-height: 1.35 !important;
}
`.trim();

/** Create or move style to end of head so it overrides Maps-injected styles. */
export function ensureGooglePacDropdownStyles(): void {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(GOOGLE_PAC_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = GOOGLE_PAC_STYLE_ID;
    el.textContent = CSS;
  }
  document.head.appendChild(el);
}
