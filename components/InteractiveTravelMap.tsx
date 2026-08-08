"use client";

import { useMemo, useState } from "react";

import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map,
  Pin,
} from "@vis.gl/react-google-maps";

import {
  ExternalLink,
  MapPin,
} from "lucide-react";

type Spot = {
  name: string;
  latitude: number;
  longitude: number;
};

type Props = {
  spots: Spot[];
};

export default function InteractiveTravelMap({
  spots,
}: Props) {
  const [selected, setSelected] =
    useState<Spot | null>(null);

  const center = useMemo(() => {
    const total = spots.reduce(
      (result, spot) => ({
        lat: result.lat + spot.latitude,
        lng: result.lng + spot.longitude,
      }),
      {
        lat: 0,
        lng: 0,
      }
    );

    const spotCount = Math.max(
      spots.length,
      1
    );

    return {
      lat: total.lat / spotCount,
      lng: total.lng / spotCount,
    };
  }, [spots]);

  if (spots.length === 0) {
    return null;
  }

  const apiKey =
    process.env
      .NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div
        role="status"
        className="flex min-h-[280px] items-center justify-center bg-slate-50 px-6 py-10 text-center"
      >
        <div className="max-w-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
            <MapPin
              size={23}
              aria-hidden="true"
            />
          </div>

          <p className="mt-4 text-sm font-bold text-slate-700">
            地図を表示できません
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Google Maps API Keyが設定されていません。
          </p>
        </div>
      </div>
    );
  }

  function openGoogleMaps(spot: Spot) {
    const query = encodeURIComponent(
      `${spot.name} ${spot.latitude},${spot.longitude}`
    );

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div
        aria-label="旅行スポットのルートマップ"
        className="relative h-[360px] w-full overflow-hidden bg-slate-100 sm:h-[440px] lg:h-[520px]"
      >
        <Map
          className="h-full w-full"
          defaultCenter={center}
          defaultZoom={11}
          mapId="travel-map"
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl
          onClick={() => setSelected(null)}
        >
          {spots.map((spot, index) => (
  <AdvancedMarker
    key={`${spot.name}-${spot.latitude}-${spot.longitude}-${index}`}
    position={{
      lat: spot.latitude,
      lng: spot.longitude,
    }}
              title={`${index + 1}. ${spot.name}`}
              onClick={() =>
                setSelected(spot)
              }
            >
              <Pin
                glyph={`${index + 1}`}
                background="#2563eb"
                borderColor="#ffffff"
                glyphColor="#ffffff"
                scale={1.1}
              />
            </AdvancedMarker>
          ))}

          {selected && (
            <InfoWindow
              position={{
                lat: selected.latitude,
                lng: selected.longitude,
              }}
              pixelOffset={[0, -38]}
              onCloseClick={() =>
                setSelected(null)
              }
            >
              <div className="min-w-[190px] max-w-[240px] px-1 py-1">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <MapPin
                      size={17}
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-bold leading-5 text-slate-900">
                      {selected.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Japan Travel Buddy
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openGoogleMaps(selected)
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Google Mapsで開く

                  <ExternalLink
                    size={14}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* スポット数 */}
        <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow-md backdrop-blur-md sm:left-5 sm:top-5">
          <span className="flex items-center gap-1.5">
            <MapPin
              size={14}
              className="text-blue-600"
              aria-hidden="true"
            />

            {spots.length}スポット
          </span>
        </div>
      </div>
    </APIProvider>
  );
}