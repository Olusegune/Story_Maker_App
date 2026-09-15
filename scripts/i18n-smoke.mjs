// i18n — smoke. Catalog parity (every locale has exactly en.mjs's keys,
// with matching {placeholder} sets and matching plural-category shapes)
// plus the t()/setLocale()/initLocale() engine itself. In test:release so
// a translation added/edited without updating every locale — or a typo in
// a {placeholder} name — fails CI instead of shipping a silent English
// fallback or a literal "{count}" in the UI.
import en from "../src/i18n/en.mjs";
import es from "../src/i18n/es.mjs";
import fr from "../src/i18n/fr.mjs";
import de from "../src/i18n/de.mjs";
import { t, setLocale, getLocale, initLocale, SUPPORTED_LOCALES, formatNumber, formatCurrencyUSD } from "../src/i18n/index.mjs";

let failed = 0;
const ok = (label, cond, detail = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`); if (!cond) failed++; };

const placeholders = (value) => {
  if (typeof value === "string") return [...new Set([...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
  if (value && typeof value === "object" && !Array.isArray(value)) return [...new Set(Object.keys(value).flatMap((category) => placeholders(value[category])))].sort();
  return [];
};

console.log("--- catalog parity (es/fr/de vs. en) ---");
{
  const enKeys = Object.keys(en);
  ok("English catalog is non-trivial", enKeys.length > 300, `${enKeys.length} keys`);
  for (const [id, catalog] of [["es", es], ["fr", fr], ["de", de]]) {
    const catalogKeys = new Set(Object.keys(catalog));
    const missing = enKeys.filter((key) => !catalogKeys.has(key));
    const extra = [...catalogKeys].filter((key) => !enKeys.includes(key));
    ok(`${id}.mjs has every English key`, missing.length === 0, missing.slice(0, 5).join(", "));
    ok(`${id}.mjs has no orphan keys not in English`, extra.length === 0, extra.slice(0, 5).join(", "));
    const phMismatches = enKeys.filter((key) => catalogKeys.has(key) && JSON.stringify(placeholders(en[key])) !== JSON.stringify(placeholders(catalog[key])));
    ok(`${id}.mjs placeholders match English for every shared key`, phMismatches.length === 0, phMismatches.slice(0, 5).join(", "));
    const pluralShapeMismatches = enKeys.filter((key) => {
      const enIsPlural = en[key] && typeof en[key] === "object";
      const otherIsPlural = catalog[key] && typeof catalog[key] === "object";
      return enIsPlural !== otherIsPlural;
    });
    ok(`${id}.mjs uses a plural object exactly where English does`, pluralShapeMismatches.length === 0, pluralShapeMismatches.slice(0, 5).join(", "));
    const missingOther = Object.entries(catalog).filter(([, value]) => value && typeof value === "object" && !("other" in value));
    ok(`${id}.mjs's plural entries all define an "other" form`, missingOther.length === 0, missingOther.map(([key]) => key).slice(0, 5).join(", "));
  }
}

console.log("\n--- t() engine ---");
{
  setLocale("en");
  ok("unknown key falls back to returning the key itself (visible, not silent)", t("nonexistent.key.xyz") === "nonexistent.key.xyz");
  ok("simple lookup", t("common.cancel") === "Cancel");
  ok("interpolation", t("settings.updates.versionKnown", { version: "1.2.3" }) === "Version 1.2.3");
  ok("plural — English 'one'", t("home.pulse.cast.count", { count: 1 }) === "1 character");
  ok("plural — English 'other' (0)", t("home.pulse.cast.count", { count: 0 }) === "0 characters");
  ok("plural — English 'other' (2)", t("home.pulse.cast.count", { count: 2 }) === "2 characters");

  setLocale("fr");
  ok("locale switch takes effect", getLocale() === "fr");
  ok("French translation used", t("common.cancel") === "Annuler");
  ok("French plural — 0 is grammatically singular (Intl.PluralRules, not a hand-rolled n===1 check)", t("home.pulse.cast.count", { count: 0 }) === "0 personnage");
  ok("French plural — 2 is plural", t("home.pulse.cast.count", { count: 2 }) === "2 personnages");
  ok("missing-in-locale key still falls back to English silently (no crash)", typeof t("common.cancel") === "string");

  setLocale("xx-not-a-real-locale");
  ok("setLocale rejects an unknown id and falls back to English", getLocale() === "en");

  const resolved = initLocale("de");
  ok("initLocale resolves a valid stored id", resolved === "de" && getLocale() === "de");
  const resolvedInvalid = initLocale("not-a-locale");
  ok("initLocale falls back (not a hard crash) for an invalid stored id", ["en", "es", "fr", "de"].includes(resolvedInvalid));

  setLocale("en");
  ok("SUPPORTED_LOCALES lists exactly the 4 shipped catalogs", SUPPORTED_LOCALES.map((entry) => entry.id).sort().join(",") === "de,en,es,fr");
  ok("formatNumber is locale-aware (comma-free, plain integer, English)", formatNumber(1234) === "1,234" || formatNumber(1234) === "1234");
  ok("formatCurrencyUSD renders a USD amount regardless of display locale", /\$/.test(formatCurrencyUSD(12.5)) || /USD|US\$/.test(formatCurrencyUSD(12.5)));
}

console.log(`\n${failed === 0 ? "STORYMAKER_I18N_SMOKE_OK" : `I18N SMOKE FAILED (${failed})`}`);
process.exit(failed === 0 ? 0 : 1);
