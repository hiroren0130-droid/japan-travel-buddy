import Image from "next/image";
import Card from "@/components/ui/Card";
import TravelMap from "./TravelMap";
import {
  MapPin,
  Tag,
  Info,
  Star,
  Clock3,
  Wallet,
  Globe,
} from "lucide-react";

type Spot = {
  name: string;
  category?: string;
  area?: string;
  description?: string;
  image?: string;
  address?: string;
  hours?: string;
  price?: string;
  rating?: number;
  website?: string;
  latitude: number;
  longitude: number;
};

type Props = {
  spot: Spot;
};

export default function SpotCard({ spot }: Props) {
  return (
    <Card className="mt-6 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* 画像 */}
      {spot.image && (
        <div className="relative h-64 w-full overflow-hidden">
          <Image
            src={spot.image}
            alt={spot.name}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      )}

      <div className="space-y-6 p-6">
        {/* タイトル */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow">
              <MapPin size={24} />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {spot.name}
              </h3>

              {spot.category && (
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <Tag size={15} />
                  <span>{spot.category}</span>
                </div>
              )}
            </div>
          </div>

          {spot.rating && (
            <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-2">
              <Star
                size={16}
                className="fill-yellow-400 text-yellow-400"
              />

              <span className="font-semibold text-yellow-700">
                {spot.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* 情報カード */}
        <div className="space-y-3 rounded-2xl bg-gray-50 p-5">
          {spot.area && (
            <div className="flex items-center gap-3 text-gray-700">
              <MapPin
                size={18}
                className="text-blue-600"
              />
              <span>{spot.area}</span>
            </div>
          )}

          {spot.address && (
            <div className="flex items-center gap-3 text-gray-700">
              <MapPin
                size={18}
                className="text-blue-600"
              />
              <span>{spot.address}</span>
            </div>
          )}

          {spot.hours && (
            <div className="flex items-center gap-3 text-gray-700">
              <Clock3
                size={18}
                className="text-blue-600"
              />
              <span>{spot.hours}</span>
            </div>
          )}

          {spot.price && (
            <div className="flex items-center gap-3 text-gray-700">
              <Wallet
                size={18}
                className="text-blue-600"
              />
              <span>{spot.price}</span>
            </div>
          )}
        </div>

        {/* 説明 */}
        {spot.description && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Info
                size={18}
                className="text-blue-600"
              />

              <span className="font-semibold text-blue-700">
                Spot Information
              </span>
            </div>

            <p className="leading-8 text-gray-700">
              {spot.description}
            </p>
          </div>
        )}

        {/* ボタン */}
        {spot.website && (
          <a
            href={spot.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-lg"
          >
            <Globe size={18} />
            公式サイトを見る
          </a>
        )}

        {/* 地図 */}
        <TravelMap
          latitude={spot.latitude}
          longitude={spot.longitude}
          name={spot.name}
        />
      </div>
    </Card>
  );
}