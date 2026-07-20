import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type Props = {
  destination: string;
  setDestination: (value: string) => void;

  days: string;
  setDays: (value: string) => void;

  travelers: string;
  setTravelers: (value: string) => void;

  budget: string;
  setBudget: (value: string) => void;

  interests: string;
  setInterests: (value: string) => void;

  onSubmit: () => void;
  loading: boolean;
};

export default function TravelForm({
  destination,
  setDestination,
  days,
  setDays,
  travelers,
  setTravelers,
  budget,
  setBudget,
  interests,
  setInterests,
  onSubmit,
  loading,
}: Props) {
  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:text-gray-400";

  const labelClass =
    "mb-1 block text-sm font-medium text-gray-700";

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          ✈️ AI旅行プラン作成
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          条件を入力するとAIが旅行プランを作成します。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-3">
          <label className={labelClass}>
            📍 行き先
          </label>

          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="例：京都"
            className={inputClass}
            disabled={loading}
          />
        </div>

        <div>
          <label className={labelClass}>
            📅 日数
          </label>

          <input
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="3"
            className={inputClass}
            disabled={loading}
          />
        </div>

        <div>
          <label className={labelClass}>
            👥 人数
          </label>

          <input
            type="number"
            min={1}
            max={20}
            value={travelers}
            onChange={(e) => setTravelers(e.target.value)}
            placeholder="2"
            className={inputClass}
            disabled={loading}
          />
        </div>

        <div>
          <label className={labelClass}>
            💴 予算
          </label>

          <input
            type="text"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="50,000円"
            className={inputClass}
            disabled={loading}
          />
        </div>

        <div className="md:col-span-3">
          <label className={labelClass}>
            🎯 興味
          </label>

          <input
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="グルメ・寺社・自然・温泉"
            className={inputClass}
            disabled={loading}
          />
        </div>
      </div>

      <Button
        type="button"
        onClick={onSubmit}
        loading={loading}
        className="mt-8 w-full"
      >
        ✨ AIで旅行プランを作成
      </Button>
    </Card>
  );
}