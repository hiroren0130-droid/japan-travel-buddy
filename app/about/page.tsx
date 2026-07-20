export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-4xl font-bold">
        About Japan Travel Buddy
      </h1>

      <div className="space-y-10 text-gray-700 leading-8">
        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            Our Mission
          </h2>

          <p>
            Japan Travel Buddy helps travelers discover Japan more
            easily through AI-powered travel planning.
          </p>

          <p className="mt-4">
            From famous landmarks to hidden local gems, our goal is to
            make every journey simple, personalized, and unforgettable.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            What We Offer
          </h2>

          <ul className="list-disc space-y-2 pl-6">
            <li>AI-generated personalized travel itineraries</li>
            <li>Interactive travel maps</li>
            <li>Kyoto attractions database</li>
            <li>Google Maps integration</li>
            <li>Save and manage travel plans</li>
            <li>PDF itinerary export</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            Why Japan Travel Buddy?
          </h2>

          <p>
            Planning a trip to Japan can be overwhelming.
            Japan Travel Buddy simplifies the process by combining AI,
            local travel information, and interactive tools into one
            easy-to-use platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            Our Vision
          </h2>

          <p>
            We aim to become the most trusted AI travel companion for
            visitors exploring Japan.
          </p>
        </section>
      </div>
    </main>
  );
}