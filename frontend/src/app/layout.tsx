import type { Metadata } from "next";
import { IBM_Plex_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AUTHOR_EMAIL, AUTHOR_NAME, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  authors: [{ name: AUTHOR_NAME }],
  creator: AUTHOR_NAME,
  keywords: [
    "lock coordination frictions",
    "policy demo",
    "inland waterway",
    "ship lock",
    "static demo",
  ],
  openGraph: {
    title: SITE_TITLE,
    description: `${SITE_DESCRIPTION} Author: ${AUTHOR_NAME} (${AUTHOR_EMAIL}).`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
