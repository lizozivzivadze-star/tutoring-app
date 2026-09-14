"use client";

import { useEffect, useState } from "react";
import SettingsField from "../settings-field";

type Settings = {
  defaultTestInstruction: string | null;
  notFoundEmailText: string;
  magicLinkSubject: string;
  magicLinkBodyText: string;
  checkEmailText: string;
  themeDeleteConfirmText: string;
  groupDeleteConfirmText: string;
  studentDeleteConfirmText: string;
};

export default function AdminTextsTab() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data.settings));
  }, []);

  if (!settings) {
    return (
      <p className="text-ink-soft text-sm text-center py-12">იტვირთება...</p>
    );
  }

  return (
    <div>
      <h2 className="font-display text-lg text-ink border-b border-paper-line pb-2 mb-5">
        ტესტის ინსტრუქცია
      </h2>
      <SettingsField
        fieldKey="defaultTestInstruction"
        label="საერთო ინსტრუქცია"
        hint="ეს ტექსტი წინასწარ ივსება ყველა ახალი ტესტის ინსტრუქციის ველში — მასწავლებელს შეუძლია იქვე გადაწეროს."
        initialValue={settings.defaultTestInstruction ?? ""}
        multiline
      />

      <h2 className="font-display text-lg text-ink border-b border-paper-line pb-2 mb-5 mt-2">
        შეტყობინებები
      </h2>

      <SettingsField
        fieldKey="notFoundEmailText"
        label="უცხო მეილით შესვლის მცდელობა"
        hint="ჩანს, როცა login-გვერდზე შეყვანილი მეილი სისტემაში ვერ მოიძებნა."
        initialValue={settings.notFoundEmailText}
      />
      <SettingsField
        fieldKey="checkEmailText"
        label="URL გამოგზავნის ტექსტი"
        hint="{email} შეიცვლება შეყვანილი მეილით."
        initialValue={settings.checkEmailText}
      />
      <SettingsField
        fieldKey="magicLinkSubject"
        label="URL მეილის თემა"
        initialValue={settings.magicLinkSubject}
      />
      <SettingsField
        fieldKey="magicLinkBodyText"
        label="მეილზე URL-ის თანხლები ტექსტი"
        hint="{roleLabel} და {url} შეიცვლება რეალური მნიშვნელობებით."
        initialValue={settings.magicLinkBodyText}
        multiline
      />
      <SettingsField
        fieldKey="themeDeleteConfirmText"
        label="თემის წაშლის დადასტურება"
        hint="{name} შეიცვლება თემის სახელით."
        initialValue={settings.themeDeleteConfirmText}
      />
      <SettingsField
        fieldKey="groupDeleteConfirmText"
        label="ჯგუფის წაშლის დადასტურება"
        hint="{name} შეიცვლება ჯგუფის სახელით."
        initialValue={settings.groupDeleteConfirmText}
      />
      <SettingsField
        fieldKey="studentDeleteConfirmText"
        label="მოსწავლის წაშლის დადასტურება"
        initialValue={settings.studentDeleteConfirmText}
      />
    </div>
  );
}
