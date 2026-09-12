import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "რეპეტიტორის პლატფორმა",
  description: "ჯგუფების, ტესტებისა და მოსწავლეების მართვის პლატფორმა",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka">
      <head>
        {/* Noto Serif/Sans Georgian: the only two families in the
            product, one for display, one for interface text. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@500;700&family=Noto+Sans+Georgian:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#b33f2e" />
      </head>
      <body>{children}</body>
    </html>
  );
}
