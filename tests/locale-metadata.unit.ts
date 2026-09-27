import assert from "node:assert/strict";
import test from "node:test";
import { getLocalizedPageMetadata, translateMetadataText } from "../lib/localeMetadata";
import { getMessages } from "../lib/messages";

const fields = ["title", "description", "og:title", "og:description", "twitter:title", "twitter:description"] as const;

test("unknown routes preserve every bespoke server field in both languages", () => {
  for (const path of ["/spots/kiyomizudera", "/chat", "/admin/costs", "/new-page", "/discover/invalid"]) {
    assert.equal(getLocalizedPageMetadata(path, "ja"), null);
    for (const field of fields) {
      for (const locale of ["ja", "en"] as const) {
        assert.equal(translateMetadataText(path, locale, field, `Unique ${field}`), `Unique ${field}`);
      }
    }
  }
});

test("known routes preserve independent custom social and search text", () => {
  for (const path of ["/", "/contact", "/discover/kyoto"]) {
    for (const field of fields) {
      assert.equal(translateMetadataText(path, "en", field, `Custom ${field}`), `Custom ${field}`);
    }
  }
});

test("page-specific text translates back and forth without losing page identity", () => {
  for (const path of ["/", "/about", "/contact", "/privacy", "/terms", "/discover/kyoto", "/discover/osaka"]) {
    const ja = getLocalizedPageMetadata(path, "ja")!;
    const en = getLocalizedPageMetadata(path, "en")!;
    assert.match(ja.description, /[ぁ-んァ-ヶ一-龠]/);
    for (const field of fields) {
      const key = field.endsWith("description") ? "description" : "title";
      assert.equal(translateMetadataText(path, "en", field, ja[key]), en[key]);
      assert.equal(translateMetadataText(path, "ja", field, en[key]), ja[key]);
    }
  }
});

test("existing title templates and inherited social descriptions stay translatable", () => {
  const ja = getMessages("ja");
  const en = getMessages("en");
  const title = ja.siteMetadata.titleTemplate.replace("%s", ja.contactPage.metadata.title);
  assert.equal(translateMetadataText("/contact", "en", "title", title),
    en.siteMetadata.titleTemplate.replace("%s", en.contactPage.metadata.title));
  assert.equal(translateMetadataText("/contact", "en", "og:description", ja.siteMetadata.openGraphDescription),
    en.siteMetadata.openGraphDescription);
});
