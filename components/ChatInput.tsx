import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const messages = getMessages(DEFAULT_LOCALE).chatInput;

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
  const canSend = message.trim().length > 0 && !loading;

  return (
    <div className="sticky bottom-0 flex gap-3 border-t bg-white p-4">
      <label htmlFor="chat-message" className="sr-only">
        {messages.inputLabel}
      </label>

      <input
        id="chat-message"
        type="text"
        className="flex-1 rounded-lg border p-3 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={messages.placeholder}
        autoComplete="off"
        disabled={loading}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && canSend) {
            e.preventDefault();
            sendMessage();
          }
        }}
      />

      <button
        type="button"
        onClick={sendMessage}
        disabled={!canSend}
        aria-busy={loading}
        className="rounded-lg bg-blue-600 px-6 text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {loading ? messages.sendingLabel : messages.sendLabel}
      </button>
    </div>
  );
}
