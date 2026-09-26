"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function ContactContent() {
  const { messages: appMessages } = useLocale();
  const messages = appMessages.contactPage;
  return (
    <main className="mx-auto max-w-4xl bg-background px-6 py-16 text-foreground">
      <h1 className="mb-8 text-4xl font-bold">
        {messages.title}
      </h1>

      <div className="space-y-10">

        <section>
          <p className="leading-8 text-gray-700 dark:text-gray-300">
            {messages.introduction}
          </p>

          <p className="leading-8 text-gray-700 dark:text-gray-300">
            {messages.invitation}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.supportTitle}
          </h2>

          <p className="leading-8 text-gray-700 dark:text-gray-300">
            {messages.supportDescription}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.contactMethodTitle}
          </h2>

          <p className="leading-8 text-gray-700 dark:text-gray-300">
            {messages.contactMethodDescription}
          </p>

          <p className="mt-4 leading-8">
            <a
              href="mailto:japantravelbuddy.support@gmail.com"
              className="break-all text-blue-600 underline underline-offset-4 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              japantravelbuddy.support@gmail.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.responseTimeTitle}
          </h2>

          <p className="leading-8 text-gray-700 dark:text-gray-300">
            {messages.responseTimeDescription}
          </p>
        </section>

      </div>
    </main>
  );
}
