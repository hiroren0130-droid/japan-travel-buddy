"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLocale } from "@/components/LocaleProvider";

export default function Navbar() {
  const pathname = usePathname();
  const { messages } = useLocale();
  const navbarMessages = messages.navbar;
  const menus = [
    { href: "/", label: navbarMessages.home },
    { href: "/chat", label: navbarMessages.aiTravel },
    { href: "/history", label: navbarMessages.history },
    { href: "/favorites", label: navbarMessages.favorites },
    { href: "/dashboard", label: navbarMessages.myPage },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto p-4">
        {menus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            aria-current={pathname === menu.href ? "page" : undefined}
            className={`rounded-lg px-4 py-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
              pathname === menu.href
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {menu.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
