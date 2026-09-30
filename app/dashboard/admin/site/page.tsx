"use client";

import { useEffect, useState } from "react";
import SettingsField from "../settings-field";
import LoadingBar from "@/components/loading-bar"

type Settings = { siteTitle: string; siteDescription: string };

export default function AdminSiteTab() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
  }, []);

  if (!settings) {
    return (
      <LoadingBar />
    );
  }

  return (
    <div>
      <h2 className="font-display text-lg text-ink border-b border-paper-line pb-2 mb-5">
        საიტის ტექსტები
      </h2>

      <SettingsField
        fieldKey="siteTitle"
        label="სათაური"
        initialValue={settings.siteTitle}
      />
      <SettingsField
        fieldKey="siteDescription"
        label="აღწერა"
        initialValue={settings.siteDescription}
        multiline
      />

      <div className="pt-2">
        <label className="text-sm text-ink-soft block mb-2">URL</label>
        <p className="text-ink font-body text-sm break-all">
          https://tutoring-app-dusky.vercel.app/
        </p>
      </div>
    </div>
  );
}
