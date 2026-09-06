import type {
  CostCurrency,
  CostDataSource,
  CostFetchStatus,
  ServiceCostSnapshot,
} from "@/types/cost";

type Props = {
  snapshot: ServiceCostSnapshot;
};

const dataSourceLabels: Record<CostDataSource, string> = {
  manual: "手入力",
  "api-ready": "API連携準備済み",
  "future-api": "将来API連携",
};

const fetchStatusLabels: Record<CostFetchStatus, string> = {
  success: "取得成功",
  fallback: "固定データ表示",
  error: "取得エラー",
};

const fetchStatusClasses: Record<CostFetchStatus, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  fallback: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-800",
};

function formatCost(value: number, currency: CostCurrency): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(value);
}

type UpdatedAtDisplay = {
  label: string;
  dateTime: string | null;
};

export function formatUpdatedAt(value: string): UpdatedAtDisplay {
  const date = new Date(value);

  if (value.trim() === "" || Number.isNaN(date.getTime())) {
    return {
      label: "更新日時不明",
      dateTime: null,
    };
  }

  return {
    label: new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(date),
    dateTime: value,
  };
}

export default function ServiceCostCard({ snapshot }: Props) {
  const formattedUpdatedAt = formatUpdatedAt(snapshot.updatedAt);
  const fetchStatus =
    snapshot.service === "openai"
      ? (snapshot.fetchStatus ?? "fallback")
      : null;
  const hasActualCost = fetchStatus === null || fetchStatus === "success";

  const fetchStatusMessage =
    fetchStatus === "success"
      ? snapshot.currentMonthCost === 0
        ? "OpenAI Admin APIから取得済みです。実額は0円です。"
        : "OpenAI Admin APIから実額を取得済みです。"
      : fetchStatus === "error"
        ? "OpenAI Admin APIから取得できなかったため、固定データを表示しています。表示額は実際の請求額ではありません。"
        : "OpenAI Admin APIの設定が未完了のため、固定データを表示しています。表示額は実際の請求額ではありません。";

  return (
    <article
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      data-service={snapshot.service}
      data-fetch-status={fetchStatus ?? undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Service
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            {snapshot.displayName}
          </h2>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          {dataSourceLabels[snapshot.dataSource]}
        </span>
      </div>

      {fetchStatus ? (
        <div
          role={fetchStatus === "error" ? "alert" : "status"}
          className={`mt-5 rounded-xl border px-4 py-3 ${fetchStatusClasses[fetchStatus]}`}
        >
          <p className="text-sm font-bold">
            OpenAI取得状態: {fetchStatusLabels[fetchStatus]}
          </p>
          <p className="mt-1 text-xs leading-5">{fetchStatusMessage}</p>
        </div>
      ) : null}

      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Current Cost
          </dt>
          <dd className="mt-1 text-2xl font-extrabold text-slate-950">
            {hasActualCost
              ? formatCost(snapshot.currentMonthCost, snapshot.currency)
              : "取得値なし"}
            {!hasActualCost ? (
              <span className="mt-1 block text-xs font-semibold text-slate-500">
                固定データ: {formatCost(snapshot.currentMonthCost, snapshot.currency)}
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Estimated Cost
          </dt>
          <dd className="mt-1 text-base font-bold text-slate-800">
            {snapshot.estimatedCost === null
              ? "未入力"
              : formatCost(snapshot.estimatedCost, snapshot.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Usage
          </dt>
          <dd className="mt-2 space-y-1 text-sm text-slate-700">
            {snapshot.usageSummary.map((metric) => (
              <p key={metric.label}>
                <span className="font-semibold">{metric.label}:</span>{" "}
                {metric.unit === "未入力"
                  ? metric.unit
                  : `${metric.value.toLocaleString("ja-JP")} ${metric.unit}`}
              </p>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Free Tier
          </dt>
          <dd className="mt-2 text-sm leading-6 text-slate-700">
            {snapshot.freeTierSummary}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Last Updated
          </dt>
          <dd className="mt-2 text-sm text-slate-700">
            {formattedUpdatedAt.dateTime ? (
              <time dateTime={formattedUpdatedAt.dateTime}>
                {formattedUpdatedAt.label}
              </time>
            ) : (
              formattedUpdatedAt.label
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total
          </dt>
          <dd className="mt-2 text-sm font-semibold text-slate-700">
            {snapshot.includedInTotal ? "今月合計に含む" : "今月合計から除外"}
          </dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Notes
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {snapshot.notes}
        </p>
      </div>
    </article>
  );
}
