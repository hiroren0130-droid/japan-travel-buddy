import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type { Spot } from "../data/types";
import {
  createInitialState,
  createSelectedCandidate,
  markBlockedByHttp429,
  validateResume,
  writeJsonAtomic,
} from "../scripts/spot-image-pipeline/checkpoint";
import {
  CommonsClient,
  Http429Error,
  MINIMUM_REQUEST_INTERVAL_MS,
} from "../scripts/spot-image-pipeline/commonsClient";
import { buildInventory } from "../scripts/spot-image-pipeline/inventory";
import {
  evaluateLicense,
  LicensePolicyError,
} from "../scripts/spot-image-pipeline/licensePolicy";
import { renderReport } from "../scripts/spot-image-pipeline/report";
import type { PipelineSpot } from "../scripts/spot-image-pipeline/types";

const temporaryDirectories: string[] = [];

function temporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(path.join(os.tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

test.afterEach(() => {
  while (temporaryDirectories.length) {
    const directory = temporaryDirectories.pop();
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
});

function fakeSpot(id: string, image = `/spots/${id}.jpg`): Spot {
  return {
    id,
    regionId: "kansai",
    prefectureId: "kyoto",
    cityId: "kyoto-city",
    name: id,
    area: "test",
    category: "test",
    description: "test",
    image,
    latitude: 0,
    longitude: 0,
  } as Spot;
}

function pipelineSpot(id = "kitano-tenmangu"): PipelineSpot {
  return {
    id,
    nameJa: "北野天満宮",
    nameEn: "Kitano Tenmangu Shrine",
    image: `/spots/${id}.jpg`,
  };
}

test("inventory dynamically finds missing SSOT local images", () => {
  const spots = [
    fakeSpot("ready"),
    fakeSpot("missing"),
    fakeSpot("placeholder", "/spots/placeholder.jpg"),
  ];
  const inventory = buildInventory(
    spots,
    "C:/virtual/public",
    (filePath) => filePath.endsWith("ready.jpg")
  );

  assert.deepEqual(inventory, {
    total: 3,
    ready: 2,
    missing: 1,
    missingSpotIds: ["missing"],
  });
});

test("license policy normalizes CC0, CC BY, and CC BY-SA", () => {
  const cc0 = evaluateLicense({
    licenseName: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    photographerRaw: "Example",
  });
  const ccBy = evaluateLicense({
    licenseName: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    photographerRaw: "Example",
  });
  const ccBySa = evaluateLicense({
    licenseName: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    photographerRaw: "Example",
  });

  assert.equal(cc0.attributionRequired, false);
  assert.equal(cc0.shareAlike, false);
  assert.equal(ccBy.attributionRequired, true);
  assert.equal(ccBy.shareAlike, false);
  assert.equal(ccBySa.attributionRequired, true);
  assert.equal(ccBySa.shareAlike, true);
});

test("unknown licenses stop the pipeline", () => {
  assert.throws(
    () =>
      evaluateLicense({
        licenseName: "Unknown",
        licenseUrl: "https://example.invalid/license",
        photographerRaw: "Example",
      }),
    LicensePolicyError
  );
});

test("HTML Artist values retain raw data and require human review", () => {
  const result = evaluateLicense({
    licenseName: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    photographerRaw: '<a href="https://example.invalid">Jane &amp; John</a>',
  });

  assert.match(result.photographerRaw, /<a href=/);
  assert.equal(result.photographerDraft, "Jane & John");
  assert.equal(result.licenseStatus, "human-review-required");
  assert.deepEqual(result.warnings, ["human-review-required"]);
});

test("checkpoint JSON uses an atomic temporary file and rename", () => {
  const directory = temporaryDirectory("jtb-phase6f1-atomic-");
  const filePath = path.join(directory, "state.json");
  writeJsonAtomic(filePath, { ok: true });
  writeJsonAtomic(filePath, { ok: false, revision: 2 });

  assert.equal(existsSync(filePath), true);
  assert.equal(existsSync(`${filePath}.tmp`), false);
  assert.deepEqual(JSON.parse(readFileSync(filePath, "utf8")), {
    ok: false,
    revision: 2,
  });
});

test("resume validation detects HEAD, fingerprint, and Spot mismatches", () => {
  const directory = temporaryDirectory("jtb-phase6f1-resume-");
  const spot = pipelineSpot();
  const state = createInitialState({
    runId: "run",
    runDirectory: directory,
    spot,
    gitHead: "old-head",
    spotDbFingerprint: "old-fingerprint",
  });
  const validation = validateResume({
    state,
    gitHead: "new-head",
    spotDbFingerprint: "new-fingerprint",
    spot: { ...spot, nameJa: "変更後" },
  });

  assert.equal(validation.valid, false);
  assert.deepEqual(validation.warnings, [
    "git-head-mismatch",
    "spot-db-fingerprint-mismatch",
    "spot-information-mismatch",
  ]);
});

test("selected.json template is always unselected and unapproved", () => {
  assert.deepEqual(createSelectedCandidate("kitano-tenmangu"), {
    spotId: "kitano-tenmangu",
    selectedCandidateId: null,
    approvedByHuman: false,
    notes: "",
  });
});

test("report requires human selection and states that no candidate was auto-selected", () => {
  const directory = temporaryDirectory("jtb-phase6f1-report-");
  const state = createInitialState({
    runId: "run",
    runDirectory: directory,
    spot: pipelineSpot(),
    gitHead: "head",
    spotDbFingerprint: "fingerprint",
  });
  const report = renderReport(state);

  assert.match(report, /Edit selected\.json and choose a candidate manually\./);
  assert.match(report, /has not selected a representative image automatically/);
  assert.match(report, /Final crop approval is also a human decision/);
});

test("HTTP 429 state is saved as blocked without automatic resume", () => {
  const directory = temporaryDirectory("jtb-phase6f1-429-");
  const state = createInitialState({
    runId: "run",
    runDirectory: directory,
    spot: pipelineSpot(),
    gitHead: "head",
    spotDbFingerprint: "fingerprint",
  });
  markBlockedByHttp429(state, "120");

  const saved = JSON.parse(
    readFileSync(path.join(directory, "state.json"), "utf8")
  ) as { stage: string; blockedReason: string; retryAfter: string };
  assert.equal(saved.stage, "blocked-http-429");
  assert.equal(saved.blockedReason, "blocked-http-429");
  assert.equal(saved.retryAfter, "120");
});

test("Commons client is sequential, enforces three seconds, and stops on 429", async () => {
  let clock = 0;
  const requestStarts: number[] = [];
  const sleeps: number[] = [];
  const apiResponse = {
    query: {
      pages: [1, 2].map((number) => ({
        title: `File:Candidate ${number}.jpg`,
        imageinfo: [
          {
            url: `https://upload.wikimedia.org/original-${number}.jpg`,
            thumburl: `https://upload.wikimedia.org/preview-${number}.jpg`,
            descriptionurl: `https://commons.wikimedia.org/wiki/File:Candidate_${number}.jpg`,
            width: 3000,
            height: 2000,
            sha1: `sha1-${number}`,
            mime: "image/jpeg",
            extmetadata: {
              Artist: { value: "Example" },
              LicenseShortName: { value: "CC BY 4.0" },
              LicenseUrl: { value: "https://creativecommons.org/licenses/by/4.0/" },
            },
          },
        ],
        revisions: [{ revid: number, timestamp: "2026-01-01T00:00:00Z" }],
      })),
    },
  };
  const fetchFn = (async (input: RequestInfo | URL) => {
    requestStarts.push(clock);
    const url = String(input);
    if (url.includes("w/api.php")) {
      return new Response(JSON.stringify(apiResponse), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("preview-1")) {
      return new Response(new Uint8Array([0xff, 0xd8, 0xff]), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      });
    }
    return new Response("rate limited", {
      status: 429,
      headers: { "retry-after": "60" },
    });
  }) as typeof fetch;
  const client = new CommonsClient({
    fetchFn,
    now: () => clock,
    sleep: async (milliseconds) => {
      sleeps.push(milliseconds);
      clock += milliseconds;
    },
  });
  const candidates = await client.searchCandidates(pipelineSpot());
  const previewDirectory = temporaryDirectory("jtb-phase6f1-previews-");

  await assert.rejects(
    () => client.downloadPreviews(candidates, previewDirectory),
    (error: unknown) => error instanceof Http429Error && error.retryAfter === "60"
  );
  assert.deepEqual(requestStarts, [0, 3_000, 6_000]);
  assert.deepEqual(sleeps, [MINIMUM_REQUEST_INTERVAL_MS, MINIMUM_REQUEST_INTERVAL_MS]);
  assert.equal(client.requestCount, 3);
  assert.equal(candidates[0].previewPath !== null, true);
  assert.equal(candidates[1].previewPath, null);
});
