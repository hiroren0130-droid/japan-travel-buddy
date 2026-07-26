export const metadata = {
  title: "Privacy Policy | Japan Travel Buddy",
  description: "Privacy Policy for Japan Travel Buddy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 text-4xl font-bold">
        Privacy Policy
      </h1>

      <div className="space-y-10">

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            1. Information We Collect
          </h2>

          <p className="text-gray-700 leading-8">
            Japan Travel Buddy may collect information necessary to provide
            travel planning services, including your account information,
            travel preferences, and usage data.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            2. How We Use Your Information
          </h2>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-8">
            <li>Generate AI travel plans</li>
            <li>Save your favorite plans</li>
            <li>Improve the quality of our service</li>
            <li>Provide customer support</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            3. Third-Party Services
          </h2>

          <p className="text-gray-700 leading-8">
            This service uses third-party services including Firebase,
            OpenAI, and Google Maps Platform. These services may process
            information in accordance with their own privacy policies.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            4. Data Security
          </h2>

          <p className="text-gray-700 leading-8">
            We take reasonable measures to protect your information from
            unauthorized access, disclosure, alteration, or destruction.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            5. Changes to This Policy
          </h2>

          <p className="text-gray-700 leading-8">
            This Privacy Policy may be updated from time to time.
            The latest version will always be available on this page.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            6. Contact
          </h2>

          <p className="text-gray-700 leading-8">
            If you have any questions regarding this Privacy Policy,
            please contact us through the Contact page.
          </p>
        </section>

      </div>
    </main>
  );
}