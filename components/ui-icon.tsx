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
  x: { s: 1.2, ox: -1.8, oy: -1.8 },
  plus: { s: 0.944, ox: 0.71, oy: 0.56 },
  edit: { s: 1.02, ox: -0.2, oy: -0.2 },
  "send-url": { s: 0.927, ox: 0.88, oy: -0.51 },
  results: { s: 0.911, ox: 1.5, oy: 0.89 },
  profile: { s: 1.133, ox: -1.14, oy: -1.52 },
  "log-out": { s: 0.911, ox: 1.04, oy: 0.89 },
  "red-button": { s: 1.109, ox: -1.09, oy: -3.12 },
  feedback: { s: 0.944, ox: 0.87, oy: 0.24 },
  check: { s: 1.062, ox: -0.09, oy: -0.62 },
};

export default function UiIcon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const f = FIT[name] ?? { s: 1, ox: 0, oy: 0 };
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 align-middle ${className}`}
      style={{ width: 20, height: 20 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/icons/ui/${name}.png`}
        srcSet={`/icons/ui/${name}.png 1x, /icons/ui/${name}@2x.png 2x, /icons/ui/${name}@3x.png 3x`}
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
