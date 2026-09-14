import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { getMessages } from "../lib/messages";
import type { Locale } from "../lib/locale";

const require = createRequire(import.meta.url);
let locale: Locale = "ja";
const replacements = [
  ["next/navigation", { useRouter: () => ({}) }],
  ["../lib/firebase", { auth: {} }],
  ["../components/LocaleProvider", { useLocale: () => ({ messages: getMessages(locale) }) }],
] as const;
const originals = replacements.map(([name, exports]) => {
  const id = require.resolve(name);
  const previous = require.cache[id];
  require.cache[id] = { id, filename: id, loaded: true, exports } as NodeModule;
  return { id, previous };
});

let LoginPage: typeof import("../app/login/page").default;
try {
  LoginPage = require("../app/login/page").default;
} finally {
  for (const { id, previous } of originals) {
    if (previous) require.cache[id] = previous;
    else delete require.cache[id];
  }
}

for (const language of ["ja", "en"] as const) {
  test(`${language}: login renders a localized signup link outside the login form`, () => {
    locale = language;
    const html = renderToStaticMarkup(<LoginPage />);
    const label = language === "ja" ? "新規登録" : "Sign up";
    const prompt = language === "ja" ? "アカウントをお持ちでない方" : "Don&#x27;t have an account?";
    assert.ok(html.includes(prompt));
    const link = html.match(/<a\b[^>]*href="\/signup"[^>]*>(.*?)<\/a>/);
    assert.ok(link, "Signup link must target /signup");
    assert.equal(link[1], label);
    assert.ok(html.indexOf(link[0]) > html.indexOf("</form>"));
  });
}
