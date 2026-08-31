import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { evaluateLicense } from "./licensePolicy";
import type { CandidateMetadata, PipelineSpot } from "./types";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
export const MINIMUM_REQUEST_INTERVAL_MS = 3_000;

type FetchLike = typeof fetch;
type Sleep = (milliseconds: number) => Promise<void>;

export class Http429Error extends Error {
  readonly retryAfter: string | null;

  constructor(retryAfter: string | null) {
    super("blocked-http-429");
    this.name = "Http429Error";
    this.retryAfter = retryAfter;
  }
}

type CommonsExtMetadata = Record<string, { value?: string } | undefined>;

type CommonsPage = {
  title?: string;
  imageinfo?: Array<{
    url?: string;
    thumburl?: string;
    descriptionurl?: string;
    width?: number;
    height?: number;
    sha1?: string;
    mime?: string;
    extmetadata?: CommonsExtMetadata;
  }>;
  revisions?: Array<{
    revid?: number;
    timestamp?: string;
  }>;
};

type CommonsSearchResponse = {
  query?: { pages?: CommonsPage[] };
};

function metadataValue(
  metadata: CommonsExtMetadata | undefined,
  key: string
): string | undefined {
  const value = metadata?.[key]?.value?.trim();
  return value || undefined;
}

function required<T>(value: T | null | undefined, field: string): T {
  if (value === undefined || value === null || value === "") {
    throw new Error(`commons-metadata-missing:${field}`);
  }
  return value;
}

function previewExtension(contentType: string | null): string {
  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  return ".jpg";
}

export class CommonsClient {
  private readonly fetchFn: FetchLike;
  private readonly sleep: Sleep;
  private readonly now: () => number;
  private lastRequestStartedAt: number | null = null;
  private requests = 0;

  constructor(options: {
    fetchFn?: FetchLike;
    sleep?: Sleep;
    now?: () => number;
  } = {}) {
    this.fetchFn = options.fetchFn ?? fetch;
    this.sleep =
      options.sleep ??
      ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    this.now = options.now ?? Date.now;
  }

  get requestCount(): number {
    return this.requests;
  }

  private async request(url: string): Promise<Response> {
    if (this.lastRequestStartedAt !== null) {
      const elapsed = this.now() - this.lastRequestStartedAt;
      if (elapsed < MINIMUM_REQUEST_INTERVAL_MS) {
        await this.sleep(MINIMUM_REQUEST_INTERVAL_MS - elapsed);
      }
    }

    this.lastRequestStartedAt = this.now();
    this.requests += 1;
    const response = await this.fetchFn(url, {
      headers: {
        "User-Agent":
          "JapanTravelBuddySpotImagePipeline/1.0 (dry-run candidate research)",
      },
    });

    if (response.status === 429) {
      throw new Http429Error(response.headers.get("retry-after"));
    }
    if (!response.ok) {
      throw new Error(`http-error:${response.status}`);
    }
    return response;
  }

  async searchCandidates(spot: PipelineSpot): Promise<CandidateMetadata[]> {
    const url = new URL(COMMONS_API);
    url.search = new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      generator: "search",
      gsrsearch: `${spot.nameJa} filetype:bitmap`,
      gsrnamespace: "6",
      gsrlimit: "3",
      prop: "imageinfo|revisions",
      iiprop: "url|size|sha1|mime|extmetadata",
      iiurlwidth: "640",
      rvprop: "ids|timestamp",
      rvlimit: "1",
      origin: "*",
    }).toString();

    const response = await this.request(url.toString());
    const body = (await response.json()) as CommonsSearchResponse;
    const pages = body.query?.pages ?? [];

    return pages.slice(0, 3).map((page, index) => {
      const image = required(page.imageinfo?.[0], "imageinfo");
      const revision = required(page.revisions?.[0], "revision");
      const sourceTitle = required(page.title, "title").replace(/^File:/, "");
      const license = evaluateLicense({
        licenseName: metadataValue(image.extmetadata, "LicenseShortName"),
        licenseUrl: metadataValue(image.extmetadata, "LicenseUrl"),
        photographerRaw:
          metadataValue(image.extmetadata, "Artist") ??
          metadataValue(image.extmetadata, "Credit"),
      });

      return {
        candidateId: `candidate-${index + 1}`,
        spotId: spot.id,
        sourceTitle,
        sourcePageUrl: required(image.descriptionurl, "descriptionurl"),
        previewUrl: required(image.thumburl, "thumburl"),
        previewPath: null,
        originalUrl: required(image.url, "url"),
        photographerRaw: license.photographerRaw,
        photographerDraft: license.photographerDraft,
        licenseName: license.licenseName,
        licenseUrl: license.licenseUrl,
        attributionRequired: license.attributionRequired,
        shareAlike: license.shareAlike,
        width: required(image.width, "width"),
        height: required(image.height, "height"),
        commonsSha1: required(image.sha1, "sha1").toLowerCase(),
        revisionOldId: required(revision.revid, "revisionOldId"),
        revisionTimestamp: required(revision.timestamp, "revisionTimestamp"),
        licenseStatus: license.licenseStatus,
        warnings: [...license.warnings],
      };
    });
  }

  async downloadPreviews(
    candidates: CandidateMetadata[],
    previewDirectory: string
  ): Promise<void> {
    mkdirSync(previewDirectory, { recursive: true });

    for (const candidate of candidates) {
      const response = await this.request(candidate.previewUrl);
      const contentType = response.headers.get("content-type");
      if (!contentType?.toLowerCase().startsWith("image/")) {
        throw new Error(`preview-not-image:${candidate.candidateId}`);
      }

      const extension = previewExtension(contentType);
      const previewPath = path.join(
        previewDirectory,
        `${candidate.candidateId}${extension}`
      );
      writeFileSync(previewPath, Buffer.from(await response.arrayBuffer()));
      candidate.previewPath = previewPath;
    }
  }
}
