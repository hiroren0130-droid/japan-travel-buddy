"use client";

import Link from "next/link";

type Props = {
  name: string;
};

export default function PlaceLink({ name }: Props) {
  return (
    <Link
      href={`/spots/${encodeURIComponent(name)}`}
      className="text-blue-600 hover:text-blue-800 hover:underline"
    >
      {name}
    </Link>
  );
}