import GoogleAnalytics from "@/components/GoogleAnalytics";
import Navbar from "../components/Navbar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://your-domain.vercel.app"),

  title: {
    default: "Japan Travel Buddy",
    template: "%s | Japan Travel Buddy",
  },

  description:
    "AI-powered Japan travel planner. Create personalized itineraries, discover Kyoto attractions, explore interactive maps, and plan unforgettable trips.",

  keywords: [
    "Japan Travel",
    "Kyoto",
    "AI Travel Planner",
    "Japan Trip",
    "Travel Itinerary",
    "Japan Travel Buddy",
  ],

  authors: [
    {
      name: "Japan Travel Buddy",
    },
  ],

  creator: "Japan Travel Buddy",
  publisher: "Japan Travel Buddy",

  openGraph: {
    title: "Japan Travel Buddy",
    description:
      "Plan your perfect Japan trip with AI-powered travel planning.",
    url: "https://your-domain.vercel.app",
    siteName: "Japan Travel Buddy",
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Japan Travel Buddy",
    description:
      "AI-powered travel planner for exploring Japan.",
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />

        {children}

        <GoogleAnalytics
          measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""}
        />
      </body>
    </html>
  );
}