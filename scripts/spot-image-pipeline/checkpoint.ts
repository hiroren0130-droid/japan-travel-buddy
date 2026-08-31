import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import type {
  PipelineSpot,
  PipelineState,
  SelectedCandidate,
} from "./types";

export function getGitHead(): string {
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
}

export function assertOutsideRepository(targetPath: string): void {
  const repository = path.resolve(process.cwd()).toLowerCase();
  const target = path.resolve(targetPath).toLowerCase();
  const relative = path.relative(repository, target);

  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    throw new Error(`pipeline-output-must-be-outside-repository:${targetPath}`);
  }
}

export function createRunDirectory(spotId: string, now = new Date()): {
  runId: string;
  runDirectory: string;
} {
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const runId = `${timestamp}-${spotId}`;
  const runDirectory = path.join(os.tmpdir(), "jtb-spot-image-pipeline", runId);
  assertOutsideRepository(runDirectory);
  mkdirSync(path.join(runDirectory, "previews"), { recursive: true });
  return { runId, runDirectory };
}

export function writeJsonAtomic(filePath: string, value: unknown): void {
  assertOutsideRepository(filePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporaryPath, filePath);
}

export function createSelectedCandidate(spotId: string): SelectedCandidate {
  return {
    spotId,
    selectedCandidateId: null,
    approvedByHuman: false,
    notes: "",
  };
}

export function createInitialState(input: {
  runId: string;
  runDirectory: string;
  spot: PipelineSpot;
  gitHead: string;
  spotDbFingerprint: string;
  now?: Date;
}): PipelineState {
  const timestamp = (input.now ?? new Date()).toISOString();
  return {
    runId: input.runId,
    runDirectory: input.runDirectory,
    spotId: input.spot.id,
    spot: input.spot,
    gitHead: input.gitHead,
    spotDbFingerprint: input.spotDbFingerprint,
    stage: "initialized",
    httpRequestCount: 0,
    candidates: [],
    selected: createSelectedCandidate(input.spot.id),
    blockedReason: null,
    retryAfter: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function saveState(state: PipelineState, now = new Date()): void {
  state.updatedAt = now.toISOString();
  writeJsonAtomic(path.join(state.runDirectory, "state.json"), state);
}

export function markBlockedByHttp429(
  state: PipelineState,
  retryAfter: string | null,
  now = new Date()
): void {
  state.stage = "blocked-http-429";
  state.blockedReason = "blocked-http-429";
  state.retryAfter = retryAfter;
  saveState(state, now);
}

export function loadState(runDirectory: string): PipelineState {
  assertOutsideRepository(runDirectory);
  return JSON.parse(
    readFileSync(path.join(runDirectory, "state.json"), "utf8")
  ) as PipelineState;
}

export type ResumeValidation = {
  valid: boolean;
  warnings: string[];
};

export function validateResume(input: {
  state: PipelineState;
  gitHead: string;
  spotDbFingerprint: string;
  spot: PipelineSpot | undefined;
}): ResumeValidation {
  const warnings: string[] = [];

  if (input.state.gitHead !== input.gitHead) warnings.push("git-head-mismatch");
  if (input.state.spotDbFingerprint !== input.spotDbFingerprint) {
    warnings.push("spot-db-fingerprint-mismatch");
  }
  if (!input.spot) {
    warnings.push("spot-missing-from-ssot");
  } else if (
    input.spot.id !== input.state.spot.id ||
    input.spot.nameJa !== input.state.spot.nameJa ||
    input.spot.nameEn !== input.state.spot.nameEn ||
    input.spot.image !== input.state.spot.image
  ) {
    warnings.push("spot-information-mismatch");
  }

  return { valid: warnings.length === 0, warnings };
}
