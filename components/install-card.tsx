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
  // ღილაკზე დაჭერის შემდეგ ტექსტს თავად ვმართავთ: Chrome-ის ფანჯარაში
  // Install-ზე დაჭერიდან 10 წამში იცვლება, Cancel-ზე კი უცვლელი რჩება.
  const [mode, setMode] = useState<"auto" | "install" | "installed">("auto");
  const alreadyInstalled =
    mode === "installed" || (mode === "auto" && flag && !canPrompt);

  async function handleClick() {
    if (!canPrompt) {
      openInstall();
      return;
    }
    setMode("install");
    const result = await openInstall();
    if (result === "accepted") {
      setTimeout(() => setMode("installed"), 10000);
    }
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label="დააყენე აპლიკაცია"
        onClick={handleClick}
        className="group my-4 flex shrink-0 cursor-pointer flex-col items-center rounded-md border border-[#f8e7a8]/60 bg-[#fffbe9] px-6 py-6 shadow-sm"
      >
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

        <span
          aria-hidden="true"
          className="mt-4 flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-full bg-gold text-ink shadow-[0_2px_0_#f2c230] transition-colors group-hover:bg-gold-hover group-active:bg-gold-hover"
        >
          <svg
            width="33"
            height="33"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* ისარი მოძრაობს ზემოდან ქვემოთ (ქვედა ხაზი ადგილზე რჩება) */}
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 -3; 0 2; 0 -3"
                dur="1.2s"
                repeatCount="indefinite"
              />
              <path d="M12 3v12" />
              <path d="M7 11l5 5 5-5" />
            </g>
            <path d="M5 20h14" />
          </svg>
        </span>
      </div>

      {guideModal}
    </>
  );
}
