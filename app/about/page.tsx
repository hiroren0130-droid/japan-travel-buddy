export const metadata = {
  title: "About | Japan Travel Buddy",
  description: "Learn more about Japan Travel Buddy",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-8 text-4xl font-bold">
        About Japan Travel Buddy
      </h1>

      <div className="space-y-10">

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            Our Mission
          </h2>

          <p className="leading-8 text-gray-700">
            Japan Travel Buddy was created to make traveling in Japan easier,
            more enjoyable, and more personal through the power of AI.
          </p>

          <p className="mt-4 leading-8 text-gray-700">
            Instead of spending hours researching destinations, transportation,
            and itineraries, travelers can receive personalized travel plans in
            seconds.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            What We Offer
          </h2>

          <ul className="list-disc pl-6 space-y-2 leading-8 text-gray-700">
            <li>AI-powered travel itinerary generation</li>
            <li>Curated sightseeing spot database</li>
            <li>Interactive maps</li>
            <li>Favorite travel plans</li>
            <li>PDF export</li>
            <li>Responsive experience across devices</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            Our Vision
          </h2>

          <p className="leading-8 text-gray-700">
            We aim to become the most trusted AI travel companion for visitors
            exploring Japan.
          </p>

          <p className="mt-4 leading-8 text-gray-700">
            Our goal is to continuously improve the service by expanding
            destination coverage, enhancing AI recommendations, and delivering
            a better travel experience for every user.
          </p>
        </section>

      </div>
    </main>
  );
}