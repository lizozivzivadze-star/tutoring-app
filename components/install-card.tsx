"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useInstall } from "@/components/install-provider";
import { useInstallGuide } from "@/components/install-guide";

// ლოგინის გვერდზე, ბრაუზერში (ტელეფონი/ტაბლეტი) ფორმის ადგილას ჩანს.
// ღილაკი იგივე ინსტალაციის ლოგიკას იყენებს, რასაც დაფის ზედა ბანერი
// (Android: პირდაპირ დაყენება; iOS/სხვა: შესაბამისი ინსტრუქცია).
export default function InstallCard() {
  const { openInstall, guideModal } = useInstallGuide();
  const { canPrompt } = useInstall();

  // Android: აპის დაყენების/გახსნის შემდეგ install-provider ინახავს ნიშანს.
  // თუ ბრაუზერი მაინც სთავაზობს დაყენებას (canPrompt), ე.ი. აპი წაშლილია
  // და ჩვეულებრივ ტექსტს ვაჩვენებთ.
  const [flag, setFlag] = useState(false);
  useEffect(() => {
    try {
      setFlag(localStorage.getItem("tvinion-installed") === "1");
    } catch {}
  }, []);
  const alreadyInstalled = flag && !canPrompt;

  return (
    <>
      <div className="my-4 flex shrink-0 flex-col items-center rounded-md border border-[#f8e7a8]/60 bg-[#fffbe9] px-6 py-6 shadow-sm">
        <Image
          src="/icons/mascot-nobg.png"
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 object-contain"
        />

        {alreadyInstalled ? (
          <p className="mt-3 text-center text-base text-marker">
            <span className="font-bold">Tvinion</span> უკვე დაყენებულია
            <br />
            გახსენი ხატულიდან
          </p>
        ) : (
          <p className="mt-3 text-center text-base text-marker">
            დააყენე <span className="font-bold">Tvinion</span> აპლიკაცია
          </p>
        )}

        <button
          type="button"
          aria-label="დააყენე აპლიკაცია"
          onClick={openInstall}
          className="mt-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-ink shadow-[0_2px_0_#f2c230] transition-colors hover:bg-gold-hover"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3v12" />
            <path d="M7 11l5 5 5-5" />
            <path d="M5 20h14" />
          </svg>
        </button>
      </div>

      {guideModal}
    </>
  );
}
