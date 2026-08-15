import Link from "next/link";

import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const defaultMessages = getMessages(DEFAULT_LOCALE);

export default function Footer() {
  return (
    <footer className="mt-20 border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10">

        <div className="grid gap-8 md:grid-cols-2">

          <div>
            <h2 className="text-lg font-semibold">
              {defaultMessages.appName}
            </h2>

            <p className="mt-3 text-sm text-gray-600 leading-7">
              {defaultMessages.footer.description}
            </p>
          </div>

          <div className="flex flex-col gap-3 text-sm">

            <Link href="/about" className="hover:underline">
              {defaultMessages.footer.links.about}
            </Link>

            <Link href="/contact" className="hover:underline">
              {defaultMessages.footer.links.contact}
            </Link>

            <Link href="/privacy" className="hover:underline">
              {defaultMessages.footer.links.privacyPolicy}
            </Link>

            <Link href="/terms" className="hover:underline">
              {defaultMessages.footer.links.termsOfService}
            </Link>

          </div>

        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {defaultMessages.appName}.{" "}
          {defaultMessages.footer.rightsReserved}
        </div>

      </div>
    </footer>
  );
}
