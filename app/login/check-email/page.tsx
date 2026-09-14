import { Suspense } from "react";
import { getSettings } from "@/lib/settings";
import CheckEmailContent from "./check-email-content";

export default async function CheckEmailPage() {
  const settings = await getSettings();
  return (
    <Suspense fallback={null}>
      <CheckEmailContent template={settings.checkEmailText} />
    </Suspense>
  );
}