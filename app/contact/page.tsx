import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const messages = getMessages(DEFAULT_LOCALE).contactPage;

export const metadata = {
  title: messages.metadata.title,
  description: messages.metadata.description,
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 text-4xl font-bold">
        {messages.title}
      </h1>

      <div className="space-y-10">

        <section>
          <p className="leading-8 text-gray-700">
            {messages.introduction}
          </p>

          <p className="leading-8 text-gray-700">
            {messages.invitation}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.supportTitle}
          </h2>

          <p className="leading-8 text-gray-700">
            {messages.supportDescription}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.contactMethodTitle}
          </h2>

          <p className="leading-8 text-gray-700">
            {messages.contactMethodDescription}
          </p>

          {/*
          Example

          support@yourdomain.com

          or

          Contact Form
          */}
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.responseTimeTitle}
          </h2>

          <p className="leading-8 text-gray-700">
            {messages.responseTimeDescription}
          </p>
        </section>

      </div>
    </main>
  );
}
