
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import InstallCard from "@/components/install-card";
import Modal from "@/components/modal";
import { isStandalone } from "@/lib/install-env";
import { useState, useEffect, FormEvent, CSSProperties } from "react";

type Status = "idle" | "sending" | "sent" | "error";

// "checking" — ჯერ არ ვიცით (პირველი ჩატვირთვა), "form" — ლოგინის ფორმა,
// "install" — ბრაუზერში (ყველა მოწყობილობა): ფორმის ნაცვლად აპის დაყენება
type Mode = "checking" | "form" | "install";

type RegisterRole = "teacher" | "student";

// ღია რეგისტრაციის სტატუსის არჩევის ფანჯრის ბარათები
const ROLE_OPTIONS: { role: RegisterRole; title: string; points: string[] }[] = [
  {
    role: "teacher",
    title: "ისტორიის მასწავლებელი",
    points: ["ქმნით ჯგუფებს", "ამატებთ აბიტურიენტებს", "ატარებთ ტესტებს"],
  },
  {
    role: "student",
    title: "აბიტურიენტი",
    points: ["აკეთებთ ტესტებს", "ნახულობთ შეფასებებს", "აუმჯობესებთ შედეგებს"],
  },
];

type Stats = {
  subjects: number;
  tests: number;
  questions: number;
  teachers: number;
  sentTests: number;
  attempts: number;
  students: number;
};

const fmt = (n?: number) =>
  n === undefined ? "–" : String(n);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [mode, setMode] = useState<Mode>("checking");
  // ღია რეგისტრაცია: უცნობ მეილზე სტატუსის არჩევის ფანჯარა
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [pickedRole, setPickedRole] = useState<RegisterRole | null>(null);

  const router = useRouter();

  // ლოგინი მხოლოდ აპშია (standalone), ტელეფონზეც და კომპიუტერზეც.
  // ბრაუზერში აპის დაყენებას ვთავაზობთ.
  useEffect(() => {
    setMode(isStandalone() ? "form" : "install");

    // კომპიუტერზე (Chrome/Edge) დაყენებისას ბრაუზერი იმავე გვერდს
    // გადატვირთვის გარეშე აპის ფანჯარაში გადაიტანს — ამ დროს ფორმაზე გადავდივართ
    const mq = window.matchMedia("(display-mode: standalone)");
    const onChange = () => {
      if (isStandalone()) setMode("form");
    };
    mq.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  const [appH, setAppH] = useState<number | null>(null);

useEffect(() => {
  const measure = () => {
    const h = Math.min(
      window.innerHeight,
      document.documentElement.clientHeight
    );
    if (h > 0) setAppH(Math.round(h));
  };
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("orientationchange", measure);
  return () => {
    window.removeEventListener("resize", measure);
    window.removeEventListener("orientationchange", measure);
  };
}, []);

  useEffect(() => {
    fetch("/api/public-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lastEmail");
      if (saved) setEmail(saved);
    } catch {}
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    await sendLink();
  }

  // role: მხოლოდ ღია რეგისტრაციისას, სტატუსის არჩევის შემდეგ
  async function sendLink(role?: RegisterRole) {
    setStatus("sending");

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(role ? { email, role } : { email }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setShowRolePicker(false);
        setErrorMessage(
          data?.error ?? "ვერ გაიგზავნა. სცადეთ ხელახლა."
        );
        setStatus("error");
        return;
      }

      // მეილი არ არის რეგისტრირებული, ღია რეგისტრაცია ჩართულია
      if (data?.needsRole) {
        setPickedRole(null);
        setShowRolePicker(true);
        setStatus("idle");
        return;
      }

      setShowRolePicker(false);

      setStatus("sent");

      try {
        localStorage.setItem("lastEmail", email.trim());
      } catch {}

      if (data?.pollId && data?.pollSecret) {
        try {
          sessionStorage.setItem(
            `pollSecret:${data.pollId}`,
            data.pollSecret
          );
        } catch {}
      }

      const poll = data?.pollId
        ? `&poll=${encodeURIComponent(data.pollId)}`
        : "";

      router.push(
        `/login/check-email?email=${encodeURIComponent(email)}${poll}`
      );
    } catch {
      setErrorMessage("ვერ გაიგზავნა. სცადეთ ხელახლა.");
      setStatus("error");
    }
  }

  return (
    <main
      data-no-ptr
      style={
        { "--app-h": appH ? `${appH}px` : "100dvh" } as CSSProperties
      }
      className="
        flex h-[var(--app-h)] flex-col items-center
        overflow-y-auto overflow-x-hidden px-6
        lg:h-auto lg:min-h-dvh lg:overflow-visible
      "
    >
      <div
className="
  flex min-h-full w-full max-w-sm flex-col
  lg:h-auto lg:flex-1
"
      >
        {/* ზედა სივრცე */}
        <div
          className="
            h-[clamp(20px,calc(var(--app-h)*0.06625),53px)]
            shrink-0 lg:h-[53px]
          "
        />

        {/* ლოგო */}
        <div className="flex shrink-0 flex-col items-center text-center text-sm text-ink-soft">
          <a href="/" aria-label="Tvinion">
            <Image
              src="/tvinion-logo.png"
              alt="Tvinion"
              width={900}
              height={224}
              priority
              className="h-auto w-56"
            />
          </a>

          <p className="mt-3">ერთი, ორი, სამი</p>
        </div>

        {/* მეორე ზედა სივრცე */}
        <div
          className="
            h-[clamp(20px,calc(var(--app-h)*0.06625),53px)]
            shrink-0 lg:h-[53px]
          "
        />

        {/* სტატისტიკა */}
        <p className="shrink-0 text-center text-sm text-ink-soft">
          {fmt(stats?.subjects)} საგანი (ისტორია),{" "}
          {fmt(stats?.tests)} ტესტი,{" "}
          {fmt(stats?.questions)} შეკითხვა
        </p>

        {/* შესვლის ფორმა (აპში/კომპიუტერზე) ან აპის დაყენება (ბრაუზერში) */}
        {mode === "install" && <InstallCard />}
        {mode === "checking" && <div className="my-4 min-h-48 shrink-0" />}
        {mode === "form" && (
          <form
            onSubmit={handleSubmit}
            className="
              my-4 shrink-0 rounded-md border
              border-paper-line bg-white
              px-6 py-6 shadow-sm
            "
          >
            <label
              htmlFor="email"
              className="mb-2 block text-center text-sm text-ink-soft"
            >
              შეიყვანეთ Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="
                mb-5 w-full min-w-0 rounded-sm
                border border-paper-line
                px-3 py-2.5
                text-center font-body text-ink
                placeholder:text-ink-soft/50
                focus:border-marker
                focus:outline-none
                focus:ring-2 focus:ring-marker/40
              "
            />

            <button
              type="submit"
              disabled={status === "sending"}
              className="
                w-full rounded-full bg-gold text-ink
                font-medium py-3
                transition-colors
                hover:bg-gold-hover
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {status === "sending"
                ? "იგზავნება..."
                : "გამომიგზავნე შესვლის ბმული"}
            </button>

            {status === "error" && (
              <p className="mt-4 text-sm text-danger">
                {errorMessage}
              </p>
            )}
          </form>
        )}

        {showRolePicker && (
          <Modal title="მონიშნეთ" onClose={() => setShowRolePicker(false)}>
            <div className="flex items-start gap-2">
              {ROLE_OPTIONS.map((opt, i) => (
                <div key={opt.role} className="contents">
                  {i === 1 && (
                    <span className="self-center pt-1 text-sm text-ink-soft">ან</span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setPickedRole(opt.role)}
                      aria-pressed={pickedRole === opt.role}
                      className={`flex min-h-16 items-center justify-center rounded-md border-2
                                  px-2 py-3 text-center text-sm font-medium text-ink transition-colors ${
                                    pickedRole === opt.role
                                      ? "border-marker bg-gold/30"
                                      : "border-paper-line bg-white"
                                  }`}
                    >
                      {opt.title}
                    </button>
                    <ul className="flex flex-col gap-1.5 text-xs text-ink-soft">
                      {opt.points.map((pt) => (
                        <li key={pt} className="flex gap-1">
                          <span className="text-ledger">✓</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => pickedRole && sendLink(pickedRole)}
              disabled={!pickedRole || status === "sending"}
              className="
                mt-6 w-full rounded-full bg-gold text-ink
                font-medium py-3
                transition-colors
                hover:bg-gold-hover
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {status === "sending" ? "იგზავნება..." : "გაგრძელება"}
            </button>

            <p className="mt-4 text-xs text-ink-soft">
              შენიშვნა: ამ ეტაპზე Tvinion-ის გამოყენება შეუძლიათ მხოლოდ ისტორიის
              მასწავლებლებს და ისტორიის შესწავლით დაინტერესებულ აბიტურიენტებს
            </p>
          </Modal>
        )}

        {/* გამოყენების სტატისტიკა */}
        <p className="shrink-0 text-center text-sm text-ink-soft">
          სულ {fmt(stats?.teachers)} მასწავლებელმა{" "}
          {fmt(stats?.sentTests)} ტესტი ჩაატარა, ხოლო{" "}
          {fmt(stats?.students)} აბიტურიენტმა{" "}
          {fmt(stats?.attempts)} ტესტი გააკეთა.
        </p>

        {/* მთავარი რეგულირებადი სივრცე */}
        <div className="min-h-0 flex-1 lg:flex-[2_1_0%]" />

        {/* ქვედა ტექსტი */}
        <p
className="
  w-full shrink-0 pb-5
  text-center text-[11px] leading-4
  text-ink-soft
  lg:pb-4
"
        >
          ყველა ტესტი/შეკითხვა უნიკალურია და არ მეორდება.
          მასალა მომზადებულია განათლების სამინისტროს
          მიერ გრიფირებული სახელმძღვანელოების მიხედვით
          <br />
          <span suppressHydrationWarning>
            © {new Date().getFullYear()}. Made by NI &amp; AI
          </span>
        </p>
      </div>
    </main>
  );
}
