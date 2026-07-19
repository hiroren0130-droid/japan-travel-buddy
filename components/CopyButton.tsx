"use client";

type Props = {
  text: string;
};

export default function CopyButton({ text }: Props) {
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    alert("旅行プランをコピーしました！");
  };

  return (
    <button
      onClick={copy}
      className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition"
    >
      📋 プランをコピー
    </button>
  );
}