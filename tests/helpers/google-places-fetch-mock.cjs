const MOCK_SENTINEL = "jtb-google-places-playwright-v1";
const GOOGLE_PLACES_HOSTNAME = "places.googleapis.com";

if (
  process.env.PLAYWRIGHT_GOOGLE_PLACES_MOCKS === "1" &&
  process.env.PLAYWRIGHT_GOOGLE_PLACES_MOCK_SENTINEL === MOCK_SENTINEL
) {
  const originalFetch = globalThis.fetch.bind(globalThis);

  const places = [
    {
      match: "伏見稲荷大社",
      id: "fushimi-inari",
      name: "伏見稲荷大社",
      address: "京都府京都市伏見区深草藪之内町68",
      latitude: 34.9671,
      longitude: 135.7727,
      color: "#ef4444",
    },
    {
      match: "八坂神社",
      id: "yasaka-shrine",
      name: "八坂神社",
      address: "京都府京都市東山区祇園町北側625",
      latitude: 35.0037,
      longitude: 135.7788,
      color: "#f59e0b",
    },
    {
      match: "平安神宮",
      id: "heian-shrine",
      name: "平安神宮",
      address: "京都府京都市左京区岡崎西天王町97",
      latitude: 35.0159,
      longitude: 135.7823,
      color: "#2563eb",
    },
  ];

  function searchResponse(init) {
    const body = typeof init?.body === "string" ? init.body : "";
    const place = places.find((candidate) => body.includes(candidate.match));

    return Response.json({
      places: place
        ? [
            {
              id: `mock-${place.id}`,
              displayName: { text: place.name },
              formattedAddress: place.address,
              location: {
                latitude: place.latitude,
                longitude: place.longitude,
              },
              photos: [
                {
                  name: `places/mock-${place.id}/photos/photo-${place.id}`,
                },
              ],
            },
          ]
        : [],
    });
  }

  function photoResponse(url) {
    const place = places.find((candidate) => url.pathname.includes(candidate.id));

    if (!place) {
      return new Response("Unexpected mocked Google Places photo URL.", {
        status: 599,
      });
    }

    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">` +
      `<rect width="16" height="16" fill="${place.color}"/>` +
      `</svg>`;

    return new Response(svg, {
      status: 200,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }

  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));

    if (url.hostname !== GOOGLE_PLACES_HOSTNAME) {
      return originalFetch(input, init);
    }

    process.stderr.write(
      `[google-places-fetch-mock] ${init?.method ?? "GET"} ${url.pathname}\n`
    );

    if (url.pathname === "/v1/places:searchText") {
      return searchResponse(init);
    }

    if (url.pathname.endsWith("/media")) {
      return photoResponse(url);
    }

    return new Response("Unexpected mocked Google Places URL.", {
      status: 599,
    });
  };
}
