import { writeFileSync } from "node:fs";
import path from "node:path";

import { assertOutsideRepository, writeJsonAtomic } from "./checkpoint";
import type { ResumeValidation } from "./checkpoint";
import type { PipelineState } from "./types";

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}

export function renderReport(
  state: PipelineState,
  resumeValidation?: ResumeValidation
): string {
  const lines = [
    "# Spot image candidate report",
    "",
    `- Run ID: ${state.runId}`,
    `- Stage: ${state.stage}`,
    `- Spot ID: ${state.spot.id}`,
    `- Japanese name: ${state.spot.nameJa}`,
    `- English name: ${state.spot.nameEn}`,
    `- Git HEAD: ${state.gitHead}`,
    `- HTTP request count: ${state.httpRequestCount}`,
    "",
  ];

  if (state.blockedReason) {
    lines.push(`- Blocked reason: ${state.blockedReason}`);
    lines.push(`- Retry-After: ${state.retryAfter ?? "not provided"}`, "");
  }

  if (resumeValidation) {
    lines.push("## Resume validation", "");
    lines.push(`- Valid: ${yesNo(resumeValidation.valid)}`);
    lines.push(
      `- Warnings: ${resumeValidation.warnings.length ? resumeValidation.warnings.join(", ") : "none"}`,
      ""
    );
  }

  lines.push("## Candidates", "");
  if (state.candidates.length === 0) {
    lines.push("No candidates were recorded.", "");
  }

  for (const candidate of state.candidates) {
    lines.push(`### ${candidate.candidateId}: ${candidate.sourceTitle}`, "");
    lines.push(`- Photographer draft: ${candidate.photographerDraft}`);
    lines.push(`- License: ${candidate.licenseName}`);
    lines.push(`- Dimensions: ${candidate.width} × ${candidate.height}`);
    lines.push(`- Source page: ${candidate.sourcePageUrl}`);
    lines.push(`- Preview local path: ${candidate.previewPath ?? "not downloaded"}`);
    lines.push(`- Attribution required: ${yesNo(candidate.attributionRequired)}`);
    lines.push(`- ShareAlike: ${yesNo(candidate.shareAlike)}`);
    lines.push(
      `- Warnings: ${candidate.warnings.length ? candidate.warnings.join(", ") : "none"}`,
      ""
    );
  }

  lines.push("## Human action required", "");
  lines.push("Edit selected.json and choose a candidate manually.");
  lines.push("This script has not selected a representative image automatically.");
  lines.push("Final crop approval is also a human decision.", "");
  return `${lines.join("\n")}\n`;
}

export function writeRunArtifacts(
  state: PipelineState,
  resumeValidation?: ResumeValidation
): void {
  assertOutsideRepository(state.runDirectory);
  writeJsonAtomic(path.join(state.runDirectory, "candidates.json"), state.candidates);
  writeJsonAtomic(path.join(state.runDirectory, "selected.json"), state.selected);
  writeFileSync(
    path.join(state.runDirectory, "report.md"),
    renderReport(state, resumeValidation),
    "utf8"
  );
}
