import type { TravelPlan } from "@/types/travel";

import MessageBubble from "./MessageBubble";

type Message = {
  role: "user" | "assistant";
  content?: string;
  travelPlan?: TravelPlan;
};

type Props = {
  messages: Message[];
};

export default function ChatMessages({
  messages,
}: Props) {
  return (
    <div
      className="space-y-6 bg-gray-50 p-6"
      role="log"
      aria-live="polite"
      aria-label="チャットメッセージ"
    >
      {messages.map((msg, index) => (
        <MessageBubble
          key={`${msg.role}-${index}`}
          role={msg.role}
          content={msg.content}
          plan={msg.travelPlan}
        />
      ))}
    </div>
  );
}