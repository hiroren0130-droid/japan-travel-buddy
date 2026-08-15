import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const messages = getMessages(DEFAULT_LOCALE).siteMetadata;

export const metadata: Metadata = {
  metadataBase: new URL("https://japantravelbuddy.com"),

  title: {
    default: messages.defaultTitle,
    template: messages.titleTemplate,
  },

  description: messages.description,

  keywords: messages.keywords,

  authors: [
    {
      name: messages.authorName,
    },
  ],

  creator: messages.creator,

  applicationName: messages.applicationName,

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://japantravelbuddy.com",
    siteName: messages.openGraphSiteName,
    title: messages.openGraphTitle,
    description: messages.openGraphDescription,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: messages.openGraphImageAlt,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: messages.twitterTitle,
    description: messages.twitterDescription,
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
