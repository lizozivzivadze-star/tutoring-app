import type { Metadata } from "next";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import InstallProvider from "@/components/install-provider";
import FeedbackButton from "@/components/feedback-button";
import PullToRefresh from "@/components/pull-to-refresh";
import BottomSpace from "@/components/bottom-space";
// ერთადერთი thumbnail-ის ფაილი მთელი საიტისთვის: bookmark-ი, ბრაუზერის
// ტაბი, ბმულის პრევიუ (Messenger, WhatsApp...). შეცვლა მხოლოდ აქ.
const THUMBNAIL = "/icons/mascot-512.png";

// Title/description are admin-editable (Settings.siteTitle /
// siteDescription, set from /dashboard/admin), so metadata has to be
// generated per-request instead of the static export this started as.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(
      process.env.NEXTAUTH_URL ?? "https://tutoring-app-dusky.vercel.app",
    ),
    title: settings.siteTitle,
    description: settings.siteDescription,
    openGraph: {
      title: settings.siteTitle,
      description: settings.siteDescription,
      type: "website",
      images: [{ url: THUMBNAIL, width: 512, height: 512 }],
    },
    twitter: {
      card: "summary",
      title: settings.siteTitle,
      description: settings.siteDescription,
      images: [THUMBNAIL],
    },
    appleWebApp: {
      capable: true,
      title: "Tvinion",
      statusBarStyle: "default",
    },
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
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" type="image/svg+xml" href="/icons/mascot.svg" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon-48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/favicon-96.png" />
        <link rel="icon" type="image/png" sizes="128x128" href="/icons/favicon-128.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/mascot-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href={THUMBNAIL} />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/mascot-180.png" />
        <meta name="theme-color" content="#564cbf" />
                <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bip=e;});",
          }}
        />
      </head>
            <body>
        <InstallProvider>
  <div id="page-shell">{children}</div>
</InstallProvider>
<FeedbackButton />
<PullToRefresh />
<BottomSpace />
      </body>
    </html>
  );
}
