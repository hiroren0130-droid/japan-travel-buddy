import type { LicenseStatus } from "./types";

export class LicensePolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LicensePolicyError";
  }
}

export type LicensePolicyInput = {
  licenseName: string | undefined;
  licenseUrl: string | undefined;
  photographerRaw: string | undefined;
};

export type LicensePolicyResult = {
  photographerRaw: string;
  photographerDraft: string;
  licenseName: string;
  licenseUrl: string;
  attributionRequired: boolean;
  shareAlike: boolean;
  licenseStatus: LicenseStatus;
  warnings: string[];
};

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    );
}

function createPhotographerDraft(raw: string): {
  draft: string;
  containsHtml: boolean;
} {
  const containsHtml = /<[^>]+>/.test(raw);
  const draft = decodeHtmlEntities(raw.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

  return { draft, containsHtml };
}

export function evaluateLicense(input: LicensePolicyInput): LicensePolicyResult {
  const rawLicenseName = input.licenseName?.trim() ?? "";
  const licenseUrl = input.licenseUrl?.trim() ?? "";
  const photographerRaw = input.photographerRaw?.trim() ?? "";

  if (!rawLicenseName) {
    throw new LicensePolicyError("license-unknown");
  }
  if (!licenseUrl) {
    throw new LicensePolicyError("license-url-missing");
  }
  if (!photographerRaw) {
    throw new LicensePolicyError("photographer-missing");
  }
  if (/[,;]|\s(?:or|and)\s/i.test(rawLicenseName)) {
    throw new LicensePolicyError("multiple-licenses-ambiguous");
  }

  const normalized = rawLicenseName.replace(/\s+/g, " ").trim().toUpperCase();
  const isCc0 = /^CC0 1\.0$/.test(normalized);
  const isCcBy = /^CC BY [1-4]\.0$/.test(normalized);
  const isCcBySa = /^CC BY-SA [1-4]\.0$/.test(normalized);

  if (/PUBLIC DOMAIN/i.test(rawLicenseName) && !isCc0) {
    throw new LicensePolicyError("public-domain-ambiguous");
  }
  if (!isCc0 && !isCcBy && !isCcBySa) {
    throw new LicensePolicyError(`license-not-whitelisted:${rawLicenseName}`);
  }

  const photographer = createPhotographerDraft(photographerRaw);
  if (!photographer.draft) {
    throw new LicensePolicyError("photographer-missing-after-normalization");
  }

  const warnings = photographer.containsHtml ? ["human-review-required"] : [];

  return {
    photographerRaw,
    photographerDraft: photographer.draft,
    licenseName: isCc0 ? "CC0 1.0" : rawLicenseName.replace(/\s+/g, " ").trim(),
    licenseUrl,
    attributionRequired: !isCc0,
    shareAlike: isCcBySa,
    licenseStatus: warnings.length ? "human-review-required" : "accepted",
    warnings,
  };
}
