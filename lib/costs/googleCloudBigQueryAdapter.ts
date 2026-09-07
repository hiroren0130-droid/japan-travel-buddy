import "server-only";

export type BillingQuery = {
  query: string;
  location: string;
  useLegacySql: false;
  params: { projectId: string; startTime: string; endTime: string };
  types: { projectId: "STRING"; startTime: "TIMESTAMP"; endTime: "TIMESTAMP" };
};

/** Returns rows only. No client or credentials are loaded automatically. */
export interface GoogleCloudBillingClient {
  query(request: BillingQuery): Promise<unknown>;
}

type BillingConfig = {
  projectId: string;
  dataset: string;
  table: string;
  location: string;
};

export function readBigQueryBillingConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): BillingConfig | null {
  const projectId = env.GOOGLE_CLOUD_PROJECT_ID?.trim();
  const dataset = env.GOOGLE_CLOUD_BILLING_BIGQUERY_DATASET?.trim();
  const table = env.GOOGLE_CLOUD_BILLING_BIGQUERY_TABLE?.trim();
  const location = env.GOOGLE_CLOUD_BILLING_BIGQUERY_LOCATION?.trim();
  if (!projectId || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId) ||
      !dataset || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(dataset) ||
      !table || !/^gcp_billing_export_v1_[A-Za-z0-9_]+$/.test(table) ||
      !location || !/^[a-zA-Z0-9-]+$/.test(location)) return null;
  return { projectId, dataset, table, location };
}

export function buildBigQueryBillingQuery(
  config: BillingConfig,
  period: { startTime: string; endTime: string },
): BillingQuery {
  // Table identifiers cannot use parameters. Revalidate even direct callers.
  const validated = readBigQueryBillingConfig({
    GOOGLE_CLOUD_PROJECT_ID: config.projectId,
    GOOGLE_CLOUD_BILLING_BIGQUERY_DATASET: config.dataset,
    GOOGLE_CLOUD_BILLING_BIGQUERY_TABLE: config.table,
    GOOGLE_CLOUD_BILLING_BIGQUERY_LOCATION: config.location,
  });
  if (!validated) throw new TypeError("Invalid billing configuration");
  const { projectId, dataset, table, location } = validated;
  return {
    query: `SELECT
  project.id AS project_id,
  currency,
  COUNT(*) AS source_row_count,
  CAST(SUM(CAST(cost AS NUMERIC)) +
    SUM(IFNULL((SELECT SUM(CAST(credit.amount AS NUMERIC))
      FROM UNNEST(credits) AS credit), 0)) AS STRING) AS amount
FROM \`${projectId}.${dataset}.${table}\`
WHERE project.id = @projectId
  AND usage_start_time >= @startTime
  AND usage_start_time < @endTime
GROUP BY project.id, currency`,
    location,
    useLegacySql: false,
    params: { projectId, startTime: period.startTime, endTime: period.endTime },
    types: { projectId: "STRING", startTime: "TIMESTAMP", endTime: "TIMESTAMP" },
  };
}

/** Inject an SDK-style query function later; this module has no network transport.
 * The function must return the BigQuery response tuple [rows, ...metadata].
 * Wrap an SDK method in a closure to preserve its receiver.
 */
export function createGoogleCloudBigQueryAdapter(
  executeQuery: (request: BillingQuery) => Promise<unknown>,
): GoogleCloudBillingClient {
  return {
    async query(request) {
      try {
        const response = await executeQuery(request);
        if (!Array.isArray(response) || !Array.isArray(response[0])) {
          throw new TypeError("Invalid query response");
        }
        return response[0];
      } catch {
        // Do not expose raw SDK errors, response metadata or credentials.
        throw new Error("BigQuery billing query failed");
      }
    },
  };
}
