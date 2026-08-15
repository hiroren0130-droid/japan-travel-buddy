"use client";

import Link from "next/link";

import { useLocale } from "@/components/LocaleProvider";

export default function Footer() {
  const { messages } = useLocale();

  return (
    <footer className="mt-20 border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10">

        <div className="grid gap-8 md:grid-cols-2">

          <div>
            <h2 className="text-lg font-semibold">
              {messages.appName}
            </h2>

            <p className="mt-3 text-sm text-gray-600 leading-7">
              {messages.footer.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 text-sm">

            <Link href="/about" className="hover:underline">
              {messages.footer.links.about}
            </Link>

            <Link href="/contact" className="hover:underline">
              {messages.footer.links.contact}
            </Link>

            <Link href="/privacy" className="hover:underline">
              {messages.footer.links.privacyPolicy}
            </Link>

            <Link href="/terms" className="hover:underline">
              {messages.footer.links.termsOfService}
            </Link>

          </div>

        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {messages.appName}.{" "}
          {messages.footer.rightsReserved}
        </div>

      </div>
    </footer>
  );
}
