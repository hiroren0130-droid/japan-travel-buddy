import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.japantravelbuddy.com"),

  title: {
    default: "Japan Travel Buddy",
    template: "%s | Japan Travel Buddy",
  },

  description:
    "AI-powered travel planner for Japan. Create personalized itineraries, discover attractions, explore maps, and save your favorite travel plans.",

  keywords: [
    "Japan",
    "Travel",
    "Kyoto",
    "AI",
    "Travel Planner",
    "Japan Trip",
    "Itinerary",
    "Tourism",
    "OpenAI",
  ],

  authors: [
    {
      name: "Japan Travel Buddy",
    },
  ],

  creator: "Japan Travel Buddy",

  applicationName: "Japan Travel Buddy",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://japantravelbuddy.com",
    siteName: "Japan Travel Buddy",
    title: "Japan Travel Buddy",
    description:
      "Create personalized Japan travel plans with AI.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Japan Travel Buddy",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Japan Travel Buddy",
    description:
      "Create personalized Japan travel plans with AI.",
    images: ["/og-image.jpg"],
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {children}
        <Footer />
      </body>
    </html>
  );
}