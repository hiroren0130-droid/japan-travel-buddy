export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-4xl font-bold">
        Privacy Policy
      </h1>

      <div className="space-y-8 text-gray-700 leading-8">
        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            1. Information We Collect
          </h2>

          <p>
            We may collect information you provide, including travel
            preferences, saved travel plans, and account information.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            2. How We Use Information
          </h2>

          <p>
            Your information is used to improve travel planning,
            personalize recommendations, and enhance our services.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            3. Data Storage
          </h2>

          <p>
            Data may be securely stored using trusted cloud services
            such as Firebase.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            4. Third-Party Services
          </h2>

          <p>
            Japan Travel Buddy may use third-party services such as
            Google Maps and OpenAI to provide travel-related features.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            5. Your Rights
          </h2>

          <p>
            You may request access, correction, or deletion of your
            personal information where applicable.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            6. Updates
          </h2>

          <p>
            This Privacy Policy may be updated from time to time.
          </p>
        </section>
      </div>
    </main>
  );
}