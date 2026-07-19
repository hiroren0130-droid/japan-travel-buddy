import { useEffect, useRef } from "react";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto bg-gray-50 p-6">
      {messages.map((msg, index) => (
        <MessageBubble
          key={index}
          role={msg.role}
          content={msg.content}
          plan={msg.travelPlan}
        />
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}