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

// ყველა ხატულა წინასწარაა დამუშავებული scripts/build-icons.py-ით: შიგთავსი ზუსტად
// 20x20 ველის ცენტრშია (მთელ პიქსელზე) და სასურველ ზომაზეა. ამიტომ აქ არც
// გადიდებაა, არც გადაწევა: სურათი 1:1 ისახება და არ ბუნდდება.
// ფაილების შეცვლისას გაზარდეთ V, რომ ბრაუზერმა ძველი ქეში არ აჩვენოს.
const V = 4;

// ოპტიკური გასწორება მთელ CSS პიქსელზე (უარყოფითი = მარცხნივ)
const SHIFT_X: Partial<Record<IconName, number>> = {
  profile: -1.2,
  "red-button": -1.2,
  "log-out": -1.5,
};

export default function UiIcon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const base = `/icons/ui/${name}`;
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 align-middle ${className}`}
      style={{ width: 20, height: 20, lineHeight: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${base}.png?v=${V}`}
        srcSet={`${base}.png?v=${V} 1x, ${base}@2x.png?v=${V} 2x, ${base}@3x.png?v=${V} 3x`}
        alt=""
        draggable={false}
        width={20}
        height={20}
        style={{
          position: "absolute",
          left: SHIFT_X[name] ?? 0,
          top: 0,
          width: 20,
          height: 20,
          maxWidth: "none",
          display: "block",
        }}
      />
    </span>
  );
}
