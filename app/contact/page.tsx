export const metadata = {
  title: "Contact | Japan Travel Buddy",
  description: "Contact Japan Travel Buddy",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 text-4xl font-bold">
        Contact
      </h1>

      <div className="space-y-10">

        <section>
          <p className="leading-8 text-gray-700">
            Thank you for using Japan Travel Buddy.
          </p>

          <p className="leading-8 text-gray-700">
            If you have any questions, feedback, or suggestions,
            please feel free to contact us.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            Support
          </h2>

          <p className="leading-8 text-gray-700">
            We welcome bug reports, feature requests, and general inquiries.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            Contact Method
          </h2>

          <p className="leading-8 text-gray-700">
            Contact information will be available here before the official release.
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
            Response Time
          </h2>

          <p className="leading-8 text-gray-700">
            We aim to respond to inquiries as quickly as possible.
            Response times may vary depending on the volume of requests.
          </p>
        </section>

      </div>
    </main>
  );
}