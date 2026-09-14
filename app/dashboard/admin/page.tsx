"use client";

import { useEffect, useState } from "react";
import SettingsField from "./settings-field";

type Settings = { teacherInviteCode: string };

export default function AdminAccessTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
  }, []);

  async function regenerate() {
    setRegenerating(true);
    setRegenError("");
    const res = await fetch("/api/admin/invite-code", { method: "POST" });
    if (!res.ok) {
      setRegenError("ვერ გენერირდა");
      setRegenerating(false);
      return;
    }
    const data = await res.json();
    setSettings(data.settings);
    setRegenerating(false);
  }

  if (!settings) {
    return (
      <p className="text-ink-soft text-sm text-center py-12">იტვირთება...</p>
    );
  }

  return (
    <div>
      <h2 className="font-display text-lg text-ink border-b border-paper-line pb-2 mb-5">
        მასწავლებლის კოდი
      </h2>

      {/* key forces a remount when the code changes via "generate a
          new one", so the field's local draft state stays in sync
          with the freshly generated value instead of showing stale
          text until the next page load. */}
      <SettingsField
        key={settings.teacherInviteCode}
        fieldKey="teacherInviteCode"
        label="მოწვევის კოდი"
        hint="ეს კოდი სჭირდება ახალ მასწავლებელს რეგისტრაციისას /register გვერდზე."
        initialValue={settings.teacherInviteCode}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={regenerate}
          disabled={regenerating}
          className="rounded-full border-2 border-marker text-marker font-body font-medium text-sm
                     px-4 py-2 transition-colors hover:bg-marker hover:text-white
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {regenerating ? "გენერირდება..." : "ახალი შემთხვევითი კოდის გენერირება"}
        </button>
        {regenError && (
          <span className="text-sm text-marker-dark">{regenError}</span>
        )}
      </div>
      <p className="text-xs text-ink-soft/70 mt-2">
        ახალი კოდის გენერირების შემდეგ ძველი კოდი აღარ იმუშავებს.
      </p>
    </div>
  );
}
