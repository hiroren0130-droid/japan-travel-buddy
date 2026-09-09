import ServiceCostCard from "@/components/admin/ServiceCostCard";
import { calculateCurrentMonthTotal } from "@/lib/costs/costCalculations";
import type { MonthlyCostOverview } from "@/types/cost";

type Props = {
  overview: MonthlyCostOverview;
};

function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-");
  return `${year}年${Number(monthNumber)}月`;
}

export default function CostOverview({ overview }: Props) {
  const currentMonthTotal = calculateCurrentMonthTotal(overview);
  const googleCloud = overview.services.find((service) => service.service === "google-cloud");
  const openAIFetchStatus = overview.services.find(
    (service) => service.service === "openai"
  )?.fetchStatus;
  const usesOpenAIFixture =
    openAIFetchStatus === "fallback" || openAIFetchStatus === "error";
  const googleCloudUnavailable =
    googleCloud?.fetchStatus === "fallback" || googleCloud?.fetchStatus === "error";
  const formattedTotal = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: overview.reportingCurrency,
    maximumFractionDigits: overview.reportingCurrency === "JPY" ? 0 : 2,
  }).format(currentMonthTotal);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header>
          <p className="text-sm font-bold tracking-wide text-blue-700">
            ADMIN COST CONTROL
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            コスト管理
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            OpenAIはAdmin APIの取得状態を明示し、取得できない場合はrepository内の固定データへ切り替えます。
            Google CloudはBilling Exportの取得状態と通貨別実績を表示します。
            その他サービスの金額と使用量は管理用の初期値（参考値）です。
          </p>
        </header>

        <section
          aria-labelledby="monthly-total-heading"
          className="mt-8 rounded-2xl bg-slate-950 p-6 text-white shadow-sm sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-300">
                対象月: {formatMonth(overview.month)}
              </p>
              <h2
                id="monthly-total-heading"
                className="mt-2 text-sm font-bold uppercase tracking-wider text-slate-300"
              >
                今月の合計費用
              </h2>
              <p className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
                {formattedTotal}
              </p>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-300">
              合計対象に設定されたサービスだけを集計しています。
              Firebaseの請求額はGoogle Cloud側に含め、二重加算しません。
            </p>
          </div>

          {usesOpenAIFixture ? (
            <p
              role={openAIFetchStatus === "error" ? "alert" : "status"}
              className="mt-5 rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm font-semibold leading-6 text-amber-100"
            >
              {openAIFetchStatus === "error"
                ? "OpenAIの取得に失敗したため、今月の合計は固定データを含む参考値です。"
                : "OpenAI APIが未設定のため、今月の合計は固定データを含む参考値です。"}
            </p>
          ) : null}
          {googleCloudUnavailable ? (
            <p
              role={googleCloud.fetchStatus === "error" ? "alert" : "status"}
              className="mt-5 rounded-xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm font-semibold leading-6 text-amber-100"
            >
              {googleCloud.fetchStatus === "error"
                ? "Google Cloudの取得に失敗しました。"
                : "Google Cloud Billingの取得設定が未完了です。"}
              実取得値は合計に含まれません。今月の合計は固定データを含む参考値です。
            </p>
          ) : null}
          {googleCloud ? (
            <p role="status" className="mt-5 rounded-xl border border-slate-500 px-4 py-3 text-sm leading-6 text-slate-200">
              {googleCloud.includedInTotal
                ? "Google Cloudは対象月のJPY実績のみ合計に含めています。"
                : googleCloud.billingMonth && googleCloud.billingMonth !== overview.month
                  ? "Google CloudのJST対象月が画面の対象月と異なるため、合計に含めていません。"
                  : "Google CloudのJPY実取得値がないため、合計に含めていません。Google Cloudの実額0円を示すものではありません。"}
              {" "}JPY以外は元の通貨で各カードに表示し、円換算・加算しません。
              {" "}全サービスの確定請求額ではありません。OpenAIの対象月はUTC、Google CloudはJSTです。
            </p>
          ) : null}
        </section>

        <section aria-label="サービス別コスト" className="mt-8">
          <div className="grid gap-5 lg:grid-cols-2">
            {overview.services.map((service) => (
              <ServiceCostCard key={service.service} snapshot={service} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
