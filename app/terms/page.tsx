export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-4xl font-bold">
        Terms of Service
      </h1>

      <div className="space-y-8 text-gray-700 leading-8">
        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            1. Acceptance of Terms
          </h2>
          <p>
            By using Japan Travel Buddy, you agree to these Terms of
            Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            2. Service Description
          </h2>
          <p>
            Japan Travel Buddy provides AI-powered travel planning
            assistance for visitors traveling in Japan.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            3. User Responsibilities
          </h2>
          <p>
            Users are responsible for ensuring that travel plans,
            reservations, and schedules meet their individual needs.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            4. Limitation of Liability
          </h2>
          <p>
            We are not liable for losses resulting from travel delays,
            schedule changes, weather conditions, or third-party
            services.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            5. Changes
          </h2>
          <p>
            These Terms may be updated from time to time without prior
            notice.
          </p>
        </section>
      </div>
    </main>
  );
}