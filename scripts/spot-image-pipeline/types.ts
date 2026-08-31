export const PIPELINE_STAGES = [
  "initialized",
  "searching",
  "downloading-previews",
  "ready-for-human-selection",
  "blocked-http-429",
  "blocked-validation",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type PipelineSpot = {
  id: string;
  nameJa: string;
  nameEn: string;
  image: string;
};

export type LicenseStatus = "accepted" | "human-review-required";

export type CandidateMetadata = {
  candidateId: string;
  spotId: string;
  sourceTitle: string;
  sourcePageUrl: string;
  previewUrl: string;
  previewPath: string | null;
  originalUrl: string;
  photographerRaw: string;
  photographerDraft: string;
  licenseName: string;
  licenseUrl: string;
  attributionRequired: boolean;
  shareAlike: boolean;
  width: number;
  height: number;
  commonsSha1: string;
  revisionOldId: number;
  revisionTimestamp: string;
  licenseStatus: LicenseStatus;
  warnings: string[];
};

export type SelectedCandidate = {
  spotId: string;
  selectedCandidateId: null;
  approvedByHuman: false;
  notes: string;
};

export type PipelineState = {
  runId: string;
  runDirectory: string;
  spotId: string;
  spot: PipelineSpot;
  gitHead: string;
  spotDbFingerprint: string;
  stage: PipelineStage;
  httpRequestCount: number;
  candidates: CandidateMetadata[];
  selected: SelectedCandidate;
  blockedReason: string | null;
  retryAfter: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InventoryResult = {
  total: number;
  ready: number;
  missing: number;
  missingSpotIds: string[];
};
