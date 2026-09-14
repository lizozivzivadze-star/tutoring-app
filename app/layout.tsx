import type { Metadata } from "next";
import "./globals.css";
import { getSettings } from "@/lib/settings";

// Title/description are admin-editable (Settings.siteTitle /
// siteDescription, set from /dashboard/admin), so metadata has to be
// generated per-request instead of the static export this started as.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.siteTitle,
    description: settings.siteDescription,
  };
}

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
