"use client";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { useMemo, useState } from "react";

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
  const [selected, setSelected] = useState<Spot | null>(null);

  if (spots.length === 0) return null;

  const center = useMemo(() => {
    return {
      lat:
        spots.reduce((sum, s) => sum + s.latitude, 0) /
        spots.length,
      lng:
        spots.reduce((sum, s) => sum + s.longitude, 0) /
        spots.length,
    };
  }, [spots]);

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
    >
      <div className="overflow-hidden rounded-3xl border bg-white shadow-lg">

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
          <h2 className="text-xl font-bold">
            🗺️ Interactive Travel Map
          </h2>

          <p className="text-sm text-blue-100">
            Explore every destination.
          </p>
        </div>

        <div className="h-[600px]">
          <Map
  center={center}
  defaultZoom={11}
  mapId="travel-map"
  gestureHandling="greedy"
>
            {spots.map((spot, index) => (
              <AdvancedMarker
                key={spot.name}
                position={{
                  lat: spot.latitude,
                  lng: spot.longitude,
                }}
                onClick={() => setSelected(spot)}
              >
                <Pin
                  glyph={`${index + 1}`}
                  background="#2563eb"
                  borderColor="#1d4ed8"
                  glyphColor="#fff"
                />
              </AdvancedMarker>
            ))}

            {selected && (
              <InfoWindow
                position={{
                  lat: selected.latitude,
                  lng: selected.longitude,
                }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="font-bold">
                  {selected.name}
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
      </div>
    </APIProvider>
  );
}