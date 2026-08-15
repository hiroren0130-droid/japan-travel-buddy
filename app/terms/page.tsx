import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const messages = getMessages(DEFAULT_LOCALE).termsPage;

export const metadata = {
  title: messages.metadata.title,
  description: messages.metadata.description,
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 text-4xl font-bold">
        {messages.title}
      </h1>

      <div className="space-y-10">

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.acceptanceTitle}
          </h2>

          <p className="leading-8 text-gray-700">
            {messages.acceptanceDescription}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.serviceTitle}
          </h2>

          <p className="leading-8 text-gray-700">
            {messages.serviceDescription}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.responsibilitiesTitle}
          </h2>

          <ul className="list-disc pl-6 space-y-2 leading-8 text-gray-700">
            <li>{messages.responsibilities[0]}</li>
            <li>{messages.responsibilities[1]}</li>
            <li>{messages.responsibilities[2]}</li>
            <li>{messages.responsibilities[3]}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.aiContentTitle}
          </h2>

          <p className="leading-8 text-gray-700">
            {messages.aiContentDescription}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.intellectualPropertyTitle}
          </h2>

          <p className="leading-8 text-gray-700">
            {messages.intellectualPropertyDescription}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.disclaimerTitle}
          </h2>

          <p className="leading-8 text-gray-700">
            {messages.disclaimerDescription}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.serviceChangesTitle}
          </h2>

          <p className="leading-8 text-gray-700">
            {messages.serviceChangesDescription}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.termsChangesTitle}
          </h2>

          <p className="leading-8 text-gray-700">
            {messages.termsChangesDescription}
          </p>
        </section>

      </div>
    </main>
  );
}
