// ბრაუზერის/მოწყობილობის ამოცნობა "Add to HOME" ღილაკისთვის.
// სუფთა ფუნქციაა (ua + touch points), რომ ადვილად შემოწმდეს.

export type InstallEnv =
  | "inapp-ios"
  | "inapp-android"
  | "ios-safari"
  | "ios-other"
  | "android-firefox"
  | "android-other"
  | "desktop-firefox"
  | "desktop-other";

export type EnvSignals = { ua: string; maxTouchPoints: number };

// ჩაშენებული (in-app) ბრაუზერები: Messenger, Facebook, Instagram, TikTok,
// WhatsApp, Telegram... და Android WebView ("; wv)"). აქ ეკრანზე დამატება
// ტექნიკურად შეუძლებელია — ჯერ რეალურ ბრაუზერში უნდა გაიხსნას.
const IN_APP_RE =
  /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|WhatsApp|Snapchat|TikTok|musical_ly|BytedanceWebview|\bLine\/|LinkedInApp|Pinterest|Twitter|Viber|Telegram|; wv\)/i;

export function detectInstallEnv({ ua, maxTouchPoints }: EnvSignals): InstallEnv {
  // iPadOS 13+ თავს Mac-ად ასაღებს, ამიტომ touch points-ითაც ვამოწმებთ.
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const inApp = IN_APP_RE.test(ua);

  if (isIOS) {
    if (inApp) return "inapp-ios";
    if (/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA\//.test(ua)) return "ios-other";
    // რეალურ Safari-ს UA-ში "Safari/" აქვს, WebView-ებს — არა.
    if (/Safari\//.test(ua)) return "ios-safari";
    return "inapp-ios";
  }

  if (isAndroid) {
    if (inApp) return "inapp-android";
    if (/Firefox/i.test(ua)) return "android-firefox";
    return "android-other";
  }

  return /Firefox/i.test(ua) ? "desktop-firefox" : "desktop-other";
}

export function getEnvSignals(): EnvSignals {
  return { ua: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints ?? 0 };
}

// უკვე აპლიკაციის რეჟიმში ვართ (ეკრანიდან გახსნილი)?
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

// Android-ზე ჩაშენებული ბრაუზერიდან Chrome-ის გასახსნელი intent ბმული.
export function chromeIntentUrl(): string {
  const { host, protocol } = window.location;
  return `intent://${host}/#Intent;scheme=${protocol.replace(":", "")};package=com.android.chrome;end`;
}

// clipboard API ჩაშენებულ ბრაუზერებში ხშირად დაბლოკილია — fallback-იანი კოპირება.
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback ქვემოთ
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
