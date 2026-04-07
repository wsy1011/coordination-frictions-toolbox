import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/locale";
import { AUTHOR_EMAIL, AUTHOR_NAME, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";

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
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
