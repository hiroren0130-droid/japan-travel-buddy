import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const messages = getMessages(DEFAULT_LOCALE).aboutPage;

export const metadata = {
  title: messages.metadata.title,
  description: messages.metadata.description,
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 text-4xl font-bold">
        {messages.title}
      </h1>

      <div className="space-y-10">

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.mission.title}
          </h2>

          <p className="leading-8 text-gray-700">
            {messages.mission.description}
          </p>

          <p className="mt-4 leading-8 text-gray-700">
            {messages.mission.benefit}
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.offer.title}
          </h2>

          <ul className="list-disc pl-6 space-y-2 leading-8 text-gray-700">
            <li>{messages.offer.features[0]}</li>
            <li>{messages.offer.features[1]}</li>
            <li>{messages.offer.features[2]}</li>
            <li>{messages.offer.features[3]}</li>
            <li>{messages.offer.features[4]}</li>
            <li>{messages.offer.features[5]}</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            {messages.vision.title}
          </h2>

          <p className="leading-8 text-gray-700">
            {messages.vision.description}
          </p>

          <p className="mt-4 leading-8 text-gray-700">
            {messages.vision.goal}
          </p>
        </section>

      </div>
    </main>
  );
}
