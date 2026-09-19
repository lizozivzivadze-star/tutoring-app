"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isStandalone } from "@/lib/install-env";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    // layout.tsx-ის <head>-ში ჩაშენებული სკრიპტი აქ ინახავს ივენთს,
    // React-ის ჩატვირთვამდე რომ არ დაიკარგოს.
    __bip?: BeforeInstallPromptEvent | null;
  }
}

type InstallContextValue = {
  canPrompt: boolean;
  installed: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

const InstallContext = createContext<InstallContextValue>({
  canPrompt: false,
  installed: false,
  promptInstall: async () => "unavailable",
});

export function useInstall() {
  return useContext(InstallContext);
}

export default function InstallProvider({ children }: { children: ReactNode }) {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setCanPrompt(!!window.__bip);

    function onBip(e: Event) {
      e.preventDefault();
      window.__bip = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    }
    function onInstalled() {
      window.__bip = null;
      setCanPrompt(false);
      setInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const ev = window.__bip;
    if (!ev) return "unavailable" as const;
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    // ერთ ივენთზე prompt() მხოლოდ ერთხელ გამოიძახება.
    window.__bip = null;
    setCanPrompt(false);
    return outcome;
  }, []);

  return (
    <InstallContext.Provider value={{ canPrompt, installed, promptInstall }}>
      {children}
    </InstallContext.Provider>
  );
}
