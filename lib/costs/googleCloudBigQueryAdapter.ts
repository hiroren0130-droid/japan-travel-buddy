import "server-only";

import { BigQuery } from "@google-cloud/bigquery";

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

/** Inject an SDK-style query function; no query runs until explicitly called.
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

export type BigQueryClientConfig = {
  projectId: string;
  location: string;
  credentials: { client_email: string; private_key: string };
};

/** Pure configuration reader. Never loads ADC or a JSON credential file. */
export function readBigQueryClientConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): BigQueryClientConfig | undefined {
  const billing = readBigQueryBillingConfig(env);
  const clientEmail = env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY?.trim().replace(/\\n/g, "\n");
  if (!billing ||
      !clientEmail || !/^[^@\s]+@[^@\s]+\.iam\.gserviceaccount\.com$/i.test(clientEmail) ||
      !privateKey || !privateKey.includes("-----BEGIN PRIVATE KEY-----") ||
      !privateKey.includes("-----END PRIVATE KEY-----")) return undefined;
  // The query project is explicit; FIREBASE_ADMIN_PROJECT_ID is not required.
  return {
    projectId: billing.projectId,
    location: billing.location,
    credentials: { client_email: clientEmail, private_key: privateKey },
  };
}

/** Creates a client only when explicitly requested; construction does not query.
 * Pass the result as the provider's client option (undefined means fallback).
 * createClient can be replaced in tests without loading real credentials.
 */
export function createGoogleCloudBigQueryClient(
  options: {
    env?: Readonly<Record<string, string | undefined>>;
    createClient?: (config: BigQueryClientConfig) => GoogleCloudBillingClient;
  } = {},
): GoogleCloudBillingClient | undefined {
  const config = readBigQueryClientConfig(options.env);
  if (!config) return undefined;
  try {
    const client = (options.createClient ?? ((settings) => new BigQuery(settings)))(config);
    return createGoogleCloudBigQueryAdapter((request) => client.query(request));
  } catch {
    // Constructor errors may contain credentials. Expose only a fixed message.
    throw new Error("BigQuery billing client creation failed");
  }
}
