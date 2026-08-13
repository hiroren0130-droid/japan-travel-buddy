import { NextRequest, NextResponse } from "next/server";

const PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

type PlacesSearchResponse = {
  places?: Array<{
    photos?: Array<{
      name?: string;
    }>;
  }>;
};

const PHOTO_CACHE_CONTROL =
  "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "GOOGLE_PLACES_API_KEY が .env.local に設定されていません。",
      },
      {
        status: 500,
      }
    );
  }

  const query =
    request.nextUrl.searchParams.get("query")?.trim() ||
    "清水寺 京都";

  try {
    const searchResponse = await fetch(
      PLACES_TEXT_SEARCH_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.photos",
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: "ja",
          regionCode: "JP",
          maxResultCount: 1,
        }),
        cache: "no-store",
      }
    );

    const searchData =
      (await searchResponse.json()) as PlacesSearchResponse;

    if (!searchResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "スポット検索に失敗しました。",
        },
        {
          status: 502,
        }
      );
    }

    const resourceName =
      searchData.places?.[0]?.photos?.[0]?.name;

    if (!resourceName) {
      return NextResponse.json(
        {
          success: false,
          error: `「${query}」の写真が見つかりませんでした。`,
        },
        {
          status: 404,
        }
      );
    }

    const photoUrl =
      `https://places.googleapis.com/v1/${resourceName}/media` +
      `?maxWidthPx=1200` +
      `&skipHttpRedirect=false`;

    const photoResponse = await fetch(photoUrl, {
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
      cache: "no-store",
      redirect: "follow",
    });

    if (!photoResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "写真の取得に失敗しました。",
        },
        {
          status: 502,
        }
      );
    }

    const contentType =
      photoResponse.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json(
        {
          success: false,
          error: "写真の取得に失敗しました。",
        },
        {
          status: 502,
        }
      );
    }

    const photoData = await photoResponse.arrayBuffer();

    return new NextResponse(photoData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": PHOTO_CACHE_CONTROL,
      },
    });
  } catch {
    console.error("Place Photo API request failed.");

    return NextResponse.json(
      {
        success: false,
        error: "写真の取得中にエラーが発生しました。",
      },
      {
        status: 500,
      }
    );
  }
}
