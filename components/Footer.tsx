import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10">

        <div className="grid gap-8 md:grid-cols-2">

          <div>
            <h2 className="text-lg font-semibold">
              Japan Travel Buddy
            </h2>

            <p className="mt-3 text-sm text-gray-600 leading-7">
              AI-powered travel planner for exploring Japan.
              Plan smarter, travel easier.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-sm">

            <Link href="/about" className="hover:underline">
              About
            </Link>

            <Link href="/contact" className="hover:underline">
              Contact
            </Link>

            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>

            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>

          </div>

        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Japan Travel Buddy. All rights reserved.
        </div>

      </div>
    </footer>
  );
}