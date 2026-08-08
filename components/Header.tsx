"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Heart,
  Home,
  Map,
  Plane,
  UserRound,
} from "lucide-react";

const menus = [
  {
    href: "/",
    label: "ホーム",
    icon: Home,
  },
  {
    href: "/chat",
    label: "AI旅行",
    icon: Plane,
  },
  {
    href: "/favorites",
    label: "お気に入り",
    icon: Heart,
  },
  {
    href: "/dashboard",
    label: "マイページ",
    icon: UserRound,
  },
];

export default function Header() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          aria-label="Japan Travel Buddy ホーム"
          className="
            group
            flex
            shrink-0
            items-center
            gap-3
            rounded-2xl
            focus:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue-500
            focus-visible:ring-offset-2
          "
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-emerald-100">
            <Map
              size={27}
              strokeWidth={2.2}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p className="whitespace-nowrap text-xl font-black tracking-tight text-blue-600 transition-colors duration-300 group-hover:text-blue-700 sm:text-2xl lg:text-[28px]">
              Japan Travel Buddy
            </p>

            <p className="mt-0.5 hidden text-sm font-medium text-slate-500 sm:block">
              AIで日本を旅しよう
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav
          aria-label="メインナビゲーション"
          className="
            flex
            min-w-0
            items-center
            gap-2
            overflow-x-auto
            pb-1
            sm:gap-3
            sm:pb-0
          "
        >
          {menus.map((menu) => {
            const Icon = menu.icon;
            const active = isActive(menu.href);

            return (
              <Link
                key={menu.href}
                href={menu.href}
                aria-current={active ? "page" : undefined}
                className={`
                  inline-flex
                  min-h-11
                  shrink-0
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  border
                  px-4
                  text-sm
                  font-bold
                  transition-all
                  duration-300
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-blue-500
                  focus-visible:ring-offset-2
                  ${
                    active
                      ? `
                        border-blue-600
                        bg-blue-600
                        text-white
                        shadow-md
                        shadow-blue-600/20
                      `
                      : `
                        border-transparent
                        bg-slate-100
                        text-slate-700
                        hover:-translate-y-0.5
                        hover:border-blue-100
                        hover:bg-blue-50
                        hover:text-blue-600
                        hover:shadow-sm
                      `
                  }
                `}
              >
                <Icon
                  size={17}
                  strokeWidth={2.2}
                  className={
                    active
                      ? "text-white"
                      : menu.href === "/favorites"
                        ? "text-rose-500"
                        : ""
                  }
                  aria-hidden="true"
                />

                <span>{menu.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}