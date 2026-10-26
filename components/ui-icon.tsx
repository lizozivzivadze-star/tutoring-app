type IconName =
  | "x"
  | "edit"
  | "plus"
  | "send-url"
  | "results"
  | "check"
  | "check-green"
  | "profile"
  | "red-button"
  | "log-out"
  | "feedback";

// ხატულების ორიგინალი სურათები (PNG) უცვლელია. თითოეული ხატულა ერთნაირ 20x20
// ველშია: s = მასშტაბი (ყველას ერთნაირი სიდიდე), ox/oy = გადაწევა (ცენტრში).
// მნიშვნელობები გამოთვლილია თითოეული სურათის ზუსტი საზღვრებიდან.
const FIT: Partial<Record<IconName, { s: number; ox: number; oy: number }>> = {
  x: { s: 1.222, ox: -2.02, oy: -2.22 },
  plus: { s: 0.917, ox: 0.83, oy: 0.83 },
  edit: { s: 0.952, ox: 0.48, oy: 0.48 },
  "send-url": { s: 0.946, ox: 0.69, oy: -0.73 },
  results: { s: 0.901, ox: 1.74, oy: 1.14 },
  profile: { s: 1.088, ox: -0.88, oy: -1.06 },
  "log-out": { s: 0.935, ox: 0.65, oy: 0.65 },
  "red-button": { s: 1.213, ox: -2.33, oy: -4.35 },
  feedback: { s: 0.925, ox: 1.06, oy: 0.28 },
  "check-green": { s: 1.031, ox: 0.03, oy: -0.31 },
  check: { s: 1.031, ox: 0.03, oy: -0.31 },
};

export default function UiIcon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  // მწვანე თოლიას 1x და @3x ორიგინალი სხვადასხვა ფორმისაა: ყველგან @3x (წრე) ჩანს
  const f = FIT[name] ?? { s: 1, ox: 0, oy: 0 };
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 align-middle ${className}`}
      style={{ width: 20, height: 20 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={name === "check-green" ? "/icons/ui/check-green@3x.png" : `/icons/ui/${name}.png`}
        srcSet={
          name === "check-green"
            ? undefined
            : `/icons/ui/${name}.png 1x, /icons/ui/${name}@2x.png 2x, /icons/ui/${name}@3x.png 3x`
        }
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          left: f.ox,
          top: f.oy,
          width: 20 * f.s,
          height: 20 * f.s,
          maxWidth: "none",
        }}
      />
    </span>
  );
}
