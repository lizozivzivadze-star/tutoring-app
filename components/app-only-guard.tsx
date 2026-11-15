"use client";

import { useEffect, useState } from "react";
import { isStandalone } from "@/lib/install-env";

// დაფები მხოლოდ აპიდან (ეკრანის ხატულიდან) იხსნება — ტელეფონზეც და
// კომპიუტერზეც. ბრაუზერში გახსნილ დაფას აპის დაყენების გვერდზე
// (/login) ვაგდებთ. ეს საჭიროა, რადგან კომპიუტერზე (Chrome/Edge)
// დაყენებული აპი და ბრაუზერი ერთსა და იმავე cookie-ს იზიარებენ: აპში
// შესვლის შემდეგ ბრაუზერიც "შესულია" და ლოგინის გვერდს გვერდს უვლის.
export default function AppOnlyGuard({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isStandalone()) setAllowed(true);
    else window.location.replace("/login");
  }, []);

  // შემოწმებამდე არაფერს ვაჩვენებთ, რომ ბრაუზერში დაფა წამითაც არ გამოჩნდეს
  if (!allowed) return null;
  return <>{children}</>;
}
