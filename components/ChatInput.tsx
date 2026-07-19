type Props = {
  message: string;
  setMessage: (value: string) => void;
  loading: boolean;
  sendMessage: () => void;
};

export default function ChatInput({
  message,
  setMessage,
  loading,
  sendMessage,
}: Props) {
  return (
    <div className="sticky bottom-0 border-t bg-white p-4 flex gap-3">
      <input
        className="flex-1 rounded-lg border p-3"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !loading) {
            sendMessage();
          }
        }}
        placeholder="京都を3日旅行したい"
      />

      <button
        onClick={sendMessage}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-6 text-white disabled:bg-gray-400"
      >
        {loading ? "送信中..." : "送信"}
      </button>
    </div>
  );
}