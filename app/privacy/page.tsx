import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const messages = getMessages(DEFAULT_LOCALE).privacyPage;

export const metadata = {
  title: messages.metadata.title,
  description: messages.metadata.description,
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 text-4xl font-bold">
        {messages.title}
      </h1>

      <div className="space-y-10">

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.informationTitle}
          </h2>

          <p className="text-gray-700 leading-8">
            {messages.informationDescription}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.useTitle}
          </h2>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-8">
            <li>{messages.uses[0]}</li>
            <li>{messages.uses[1]}</li>
            <li>{messages.uses[2]}</li>
            <li>{messages.uses[3]}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.thirdPartyTitle}
          </h2>

          <p className="text-gray-700 leading-8">
            {messages.thirdPartyDescription}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.securityTitle}
          </h2>

          <p className="text-gray-700 leading-8">
            {messages.securityDescription}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.changesTitle}
          </h2>

          <p className="text-gray-700 leading-8">
            {messages.changesDescription}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.contactTitle}
          </h2>

          <p className="text-gray-700 leading-8">
            {messages.contactDescription}
          </p>
        </section>

      </div>
    </main>
  );
}
