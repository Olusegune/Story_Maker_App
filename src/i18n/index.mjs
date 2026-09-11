// Storymaker i18n — lightweight, dependency-free, built to fit the existing
// vanilla-JS renderer (no framework, no string-extraction build step).
// Catalogs are flat keyed objects (see en.mjs/es.mjs/fr.mjs/de.mjs); t()
// looks up the active locale and falls back to English for any key a
// locale hasn't translated yet, so a partially-translated catalog never
// breaks — it just shows English for the missing piece. Pluralization
// defers to the platform's own Intl.PluralRules per locale rather than a
// hand-rolled `n === 1` check, which is English-only and wrong for at
// least French (0 is grammatically singular) and every language with more
// than two plural categories.
import en from "./en.mjs";
import es from "./es.mjs";
import fr from "./fr.mjs";
import de from "./de.mjs";

export const SUPPORTED_LOCALES = [
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
  { id: "fr", label: "Français" },
  { id: "de", label: "Deutsch" }
];
const CATALOGS = { en, es, fr, de };

function detectBrowserLocale() {
  try {
    const candidates = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language || "en"];
    for (const tag of candidates) {
      const short = String(tag).slice(0, 2).toLowerCase();
      if (CATALOGS[short]) return short;
    }
  } catch { /* non-browser context (e.g. a Node smoke) — fall through */ }
  return "en";
}

let currentLocale = "en";
export function setLocale(id) { currentLocale = CATALOGS[id] ? id : "en"; return currentLocale; }
export function getLocale() { return currentLocale; }
// Call once at startup with the persisted preference (or "" / null / an
// unrecognized value) — resolves to the stored choice if valid, otherwise
// the browser's own language if Storymaker has it, otherwise English.
export function initLocale(storedId) {
  currentLocale = CATALOGS[storedId] ? storedId : detectBrowserLocale();
  return currentLocale;
}

function pluralCategory(locale, count) {
  try { return new Intl.PluralRules(locale).select(count); }
  catch { return count === 1 ? "one" : "other"; }
}
function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}
// t("some.key", vars?) — vars.count selects a plural form when the
// catalog entry at that key is an object ({one: "...", other: "..."}...)
// rather than a plain string; every other var in `vars` interpolates
// into `{name}`-style placeholders in the resolved string.
export function t(key, vars) {
  const catalog = CATALOGS[currentLocale] || CATALOGS.en;
  let entry = catalog[key];
  if (entry === undefined) entry = CATALOGS.en[key];
  if (entry === undefined) return key; // surfaces a missing key visibly instead of throwing or silently rendering blank
  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    const category = typeof vars?.count === "number" ? pluralCategory(currentLocale, vars.count) : "other";
    entry = entry[category] ?? entry.other ?? Object.values(entry)[0] ?? key;
  }
  return interpolate(String(entry), vars);
}
export function formatNumber(value, options) {
  try { return new Intl.NumberFormat(currentLocale, options).format(value); } catch { return String(value); }
}
// The app's own generation-cost estimates are always USD regardless of
// display locale (that's what providers actually bill in) — only the
// separators/symbol placement localize, never the currency itself.
export function formatCurrencyUSD(value) {
  return formatNumber(value, { style: "currency", currency: "USD" });
}
export function formatDate(date, options) {
  try { return new Intl.DateTimeFormat(currentLocale, options).format(date); } catch { return String(date); }
}
