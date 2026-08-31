import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  createInitialState,
  createRunDirectory,
  getGitHead,
  loadState,
  markBlockedByHttp429,
  saveState,
  validateResume,
} from "./checkpoint";
import { CommonsClient, Http429Error } from "./commonsClient";
import {
  buildInventory,
  getKyotoPipelineSpot,
  getKyotoSpotRecord,
  getSpotDbFingerprint,
  isMissingLocalImage,
} from "./inventory";
import { writeRunArtifacts } from "./report";

function optionValue(args: string[], option: string): string | undefined {
  const index = args.indexOf(option);
  return index >= 0 ? args[index + 1] : undefined;
}

function printUsage(): void {
  console.log("Usage:");
  console.log("  npx tsx scripts/spot-image-pipeline/cli.ts inventory");
  console.log("  npx tsx scripts/spot-image-pipeline/cli.ts search --spot <spotId>");
  console.log("  npx tsx scripts/spot-image-pipeline/cli.ts report --resume <run-dir>");
}

function runInventory(): void {
  const inventory = buildInventory();
  console.log(`京都Spot総数: ${inventory.total}`);
  console.log(`local image整備済み件数: ${inventory.ready}`);
  console.log(`未整備件数: ${inventory.missing}`);
  console.log("未整備spotId一覧:");
  for (const spotId of inventory.missingSpotIds) console.log(`- ${spotId}`);
}

async function runSearch(spotId: string): Promise<void> {
  const spot = getKyotoPipelineSpot(spotId);
  const spotRecord = getKyotoSpotRecord(spotId);
  if (!spot || !spotRecord) throw new Error(`spot-not-found-in-data-kyoto:${spotId}`);
  if (!isMissingLocalImage(spotRecord)) {
    throw new Error(`spot-local-image-already-exists:${spotId}`);
  }

  const { runId, runDirectory } = createRunDirectory(spotId);
  const state = createInitialState({
    runId,
    runDirectory,
    spot,
    gitHead: getGitHead(),
    spotDbFingerprint: getSpotDbFingerprint(),
  });
  const client = new CommonsClient();
  saveState(state);
  writeRunArtifacts(state);

  try {
    state.stage = "searching";
    saveState(state);
    state.candidates = await client.searchCandidates(spot);
    state.httpRequestCount = client.requestCount;
    if (state.candidates.length === 0) throw new Error("commons-candidates-empty");

    state.stage = "downloading-previews";
    saveState(state);
    writeRunArtifacts(state);
    await client.downloadPreviews(
      state.candidates,
      path.join(runDirectory, "previews")
    );

    state.httpRequestCount = client.requestCount;
    state.stage = "ready-for-human-selection";
    saveState(state);
    writeRunArtifacts(state);
    console.log(`Run directory: ${runDirectory}`);
    console.log(`Candidates: ${state.candidates.length}`);
    console.log("Edit selected.json manually. No candidate was auto-selected.");
  } catch (error) {
    state.httpRequestCount = client.requestCount;
    if (error instanceof Http429Error) {
      markBlockedByHttp429(state, error.retryAfter);
    } else {
      state.stage = "blocked-validation";
      state.blockedReason = error instanceof Error ? error.message : String(error);
      saveState(state);
    }
    writeRunArtifacts(state);
    console.error(`Pipeline stopped: ${state.blockedReason}`);
    console.error(`Run directory: ${runDirectory}`);
    process.exitCode = 1;
  }
}

function runReport(runDirectory: string): void {
  const state = loadState(runDirectory);
  const validation = validateResume({
    state,
    gitHead: getGitHead(),
    spotDbFingerprint: getSpotDbFingerprint(),
    spot: getKyotoPipelineSpot(state.spotId),
  });
  writeRunArtifacts(state, validation);
  console.log(`Report: ${path.join(runDirectory, "report.md")}`);
  if (!validation.valid) {
    console.error(`Resume validation warnings: ${validation.warnings.join(", ")}`);
    console.error("No external communication or automatic continuation was performed.");
    process.exitCode = 1;
  }
}

export async function runCli(args: string[]): Promise<void> {
  const command = args[0];
  if (command === "inventory") {
    runInventory();
    return;
  }
  if (command === "search") {
    const spotId = optionValue(args, "--spot");
    if (!spotId) throw new Error("--spot is required");
    await runSearch(spotId);
    return;
  }
  if (command === "report") {
    const runDirectory = optionValue(args, "--resume");
    if (!runDirectory) throw new Error("--resume is required");
    runReport(runDirectory);
    return;
  }
  printUsage();
  process.exitCode = 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  runCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
