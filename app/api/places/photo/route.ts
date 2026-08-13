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

const CACHE_CONTROL = "no-store";
const MAX_QUERY_LENGTH = 120;
const GOOGLE_API_TIMEOUT_MS = 10_000;

const CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u001f\u007f-\u009f]/;

const PHOTO_RESOURCE_NAME_PATTERN =
  /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

class GoogleApiTimeoutError extends Error {}

function jsonError(
  error: string,
  status: number
) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status,
      headers: {
        "Cache-Control": CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}

async function runWithTimeout<T>(
  operation: (
    signal: AbortSignal
  ) => Promise<T>
): Promise<T> {
  const controller = new AbortController();
  let didTimeout = false;

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, GOOGLE_API_TIMEOUT_MS);

  try {
    return await operation(controller.signal);
  } catch (error) {
    if (didTimeout) {
      throw new GoogleApiTimeoutError();
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request: NextRequest) {
  const rawQuery =
    request.nextUrl.searchParams.get("query");

  if (rawQuery === null) {
    return jsonError(
      "queryを指定してください。",
      400
    );
  }

  if (
    CONTROL_CHARACTER_PATTERN.test(
      rawQuery
    )
  ) {
    return jsonError(
      "queryに使用できない文字が含まれています。",
      400
    );
  }

  const query = rawQuery.trim();

  if (!query) {
    return jsonError(
      "queryを入力してください。",
      400
    );
  }

  if (
    Array.from(query).length >
    MAX_QUERY_LENGTH
  ) {
    return jsonError(
      `queryは${MAX_QUERY_LENGTH}文字以内で入力してください。`,
      400
    );
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return jsonError(
      "写真サービスを利用できません。",
      500
    );
  }

  try {
    const {
      response: searchResponse,
      data: searchData,
    } = await runWithTimeout(
      async (signal) => {
        const response = await fetch(
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
            signal,
          }
        );

        const data =
          (await response.json()) as PlacesSearchResponse;

        return {
          response,
          data,
        };
      }
    );

    if (!searchResponse.ok) {
      return jsonError(
        "スポット検索に失敗しました。",
        502
      );
    }

    const resourceName =
      searchData.places?.[0]?.photos?.[0]?.name;

    if (!resourceName) {
      return jsonError(
        `「${query}」の写真が見つかりませんでした。`,
        404
      );
    }

    if (
      !PHOTO_RESOURCE_NAME_PATTERN.test(
        resourceName
      )
    ) {
      return jsonError(
        "写真情報の形式が不正です。",
        502
      );
    }

    const photoUrl =
      `https://places.googleapis.com/v1/${resourceName}/media` +
      `?maxWidthPx=1200` +
      `&skipHttpRedirect=false`;

    const {
      response: photoResponse,
      contentType,
      data: photoData,
    } = await runWithTimeout(
      async (signal) => {
        const response = await fetch(
          photoUrl,
          {
            headers: {
              "X-Goog-Api-Key": apiKey,
            },
            cache: "no-store",
            redirect: "follow",
            signal,
          }
        );

        const responseContentType =
          response.headers.get(
            "content-type"
          ) ?? "";

        const data = response.ok
          ? await response.arrayBuffer()
          : null;

        return {
          response,
          contentType:
            responseContentType,
          data,
        };
      }
    );

    if (!photoResponse.ok) {
      return jsonError(
        "写真の取得に失敗しました。",
        502
      );
    }

    if (
      !contentType
        .toLowerCase()
        .startsWith("image/") ||
      photoData === null
    ) {
      return jsonError(
        "写真の取得に失敗しました。",
        502
      );
    }

    return new NextResponse(photoData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (error) {
    if (
      error instanceof
      GoogleApiTimeoutError
    ) {
      return jsonError(
        "写真サービスからの応答がタイムアウトしました。",
        504
      );
    }

    console.error("Place Photo API request failed.");

    return jsonError(
      "写真の取得中にエラーが発生しました。",
      502
    );
  }
}
