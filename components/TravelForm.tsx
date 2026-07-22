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
  const interestOptions = [
  "🏯 神社・お寺",
  "🍣 グルメ",
  "☕ カフェ",
  "🌿 自然",
  "♨️ 温泉",
  "🛍️ ショッピング",
  "🎌 アニメ・ゲーム",
  "🌃 夜景",
  "👨‍👩‍👧‍👦 家族向け",
  "💎 穴場スポット",
];

const dayOptions = Array.from({ length: 14 }, (_, i) => i + 1);

const travelerOptions = Array.from({ length: 10 }, (_, i) => i + 1);

const budgetOptions = [
  "指定なし",
  "10,000円",
  "30,000円",
  "50,000円",
  "100,000円",
  "150,000円",
  "200,000円以上",
];

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

          <select
  value={days}
  onChange={(e) => setDays(e.target.value)}
  className={inputClass}
  disabled={loading}
>
  <option value="">選択してください</option>

  {dayOptions.map((day) => (
    <option key={day} value={day}>
      {day}日
    </option>
  ))}
</select>
        </div>

        <div>
          <label className={labelClass}>
            👥 人数
          </label>

          <select
  value={travelers}
  onChange={(e) => setTravelers(e.target.value)}
  className={inputClass}
  disabled={loading}
>
  <option value="">選択してください</option>

  {travelerOptions.map((person) => (
    <option key={person} value={person}>
      {person}人
    </option>
  ))}
</select>
        </div>

        <div>
          <label className={labelClass}>
            💴 予算
          </label>

          <select
  value={budget}
  onChange={(e) => setBudget(e.target.value)}
  className={inputClass}
  disabled={loading}
>
  {budgetOptions.map((option) => (
    <option key={option} value={option}>
      {option}
    </option>
  ))}
</select>
        </div>

        <div className="md:col-span-3">
          <label className={labelClass}>
            🎯 興味
          </label>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
  {interestOptions.map((item) => {
    const checked = interests
      .split(",")
      .filter(Boolean)
      .includes(item);

    return (
      <label
        key={item}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 p-3 hover:bg-blue-50"
      >
        <input
          type="checkbox"
          checked={checked}
          disabled={loading}
          onChange={(e) => {
            const current = interests
              .split(",")
              .filter(Boolean);

            const updated = e.target.checked
              ? [...current, item]
              : current.filter((i) => i !== item);

            setInterests(updated.join(","));
          }}
        />

        <span className="text-sm">{item}</span>
      </label>
    );
  })}
</div>
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

      {loading && (
  <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-center">
    <div className="animate-pulse text-4xl">🤖</div>

    <p className="mt-3 font-semibold text-blue-700">
      AIが旅行プランを作成中...
    </p>

    <p className="mt-2 text-sm text-gray-600">
      最適なスポット・移動ルート・スケジュールを考えています。
    </p>
  </div>
)}
    </Card>
  );
}