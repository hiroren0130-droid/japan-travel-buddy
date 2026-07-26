"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { href: "/", label: "🏠 ホーム" },
  { href: "/chat", label: "✈️ AI旅行" },
  { href: "/favorites", label: "❤️ お気に入り" },
  { href: "/dashboard", label: "👤 マイページ" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div>
          <h1 className="text-xl font-bold text-blue-600">
            🗾 Japan Travel Buddy
          </h1>

          <p className="text-sm text-gray-500">
            Discover Japan with AI
          </p>
        </div>

        <nav
          className="flex gap-2 overflow-x-auto"
          aria-label="メインナビゲーション"
        >
          {menus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              aria-current={pathname === menu.href ? "page" : undefined}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                pathname === menu.href
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {menu.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}