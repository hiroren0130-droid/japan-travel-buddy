export const metadata = {
  title: "Terms of Service | Japan Travel Buddy",
  description: "Terms of Service for Japan Travel Buddy",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 text-4xl font-bold">
        Terms of Service
      </h1>

      <div className="space-y-10">

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            1. Acceptance of Terms
          </h2>

          <p className="leading-8 text-gray-700">
            By using Japan Travel Buddy, you agree to these Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            2. Service Description
          </h2>

          <p className="leading-8 text-gray-700">
            Japan Travel Buddy provides AI-powered travel planning tools,
            destination information, maps, and related features to assist
            users in planning trips within Japan.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            3. User Responsibilities
          </h2>

          <ul className="list-disc pl-6 space-y-2 leading-8 text-gray-700">
            <li>Provide accurate account information.</li>
            <li>Use the service lawfully.</li>
            <li>Do not interfere with the operation of the service.</li>
            <li>Do not attempt unauthorized access.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            4. AI-Generated Content
          </h2>

          <p className="leading-8 text-gray-700">
            Travel plans are generated using AI and may contain inaccuracies.
            Users are responsible for verifying information such as opening
            hours, prices, transportation schedules, and reservation
            requirements before traveling.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            5. Intellectual Property
          </h2>

          <p className="leading-8 text-gray-700">
            The content, design, and software of Japan Travel Buddy are
            protected by applicable intellectual property laws unless
            otherwise stated.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            6. Disclaimer
          </h2>

          <p className="leading-8 text-gray-700">
            We do not guarantee that the service will always be uninterrupted,
            error-free, or suitable for every purpose. Use of the service is
            at your own discretion.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            7. Changes to the Service
          </h2>

          <p className="leading-8 text-gray-700">
            We may modify, suspend, or discontinue parts of the service at any
            time without prior notice.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            8. Changes to These Terms
          </h2>

          <p className="leading-8 text-gray-700">
            These Terms of Service may be updated from time to time. The latest
            version will always be available on this page.
          </p>
        </section>

      </div>
    </main>
  );
}