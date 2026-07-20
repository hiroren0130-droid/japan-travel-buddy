export const metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-8 text-4xl font-bold">
        Contact
      </h1>

      <div className="space-y-8 text-gray-700 leading-8">
        <section>
          <p>
            Thank you for using Japan Travel Buddy.
          </p>

          <p>
            If you have any questions, suggestions, or feedback,
            please feel free to contact us.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            Email
          </h2>

          <p>
            support@japantravelbuddy.com
          </p>

          <p className="text-sm text-gray-500">
            ※ Replace this address with your official support email before launch.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            Response Time
          </h2>

          <p>
            We aim to respond to all inquiries within 2–3 business days.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-semibold">
            Feedback
          </h2>

          <p>
            Your feedback helps us improve Japan Travel Buddy and create
            a better travel experience for everyone.
          </p>
        </section>
      </div>
    </main>
  );
}