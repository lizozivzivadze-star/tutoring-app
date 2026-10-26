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

// ვექტორული (SVG) ხატულები: ყველა ეკრანზე ერთნაირად მკვეთრია
const SVG_ICONS = new Set<IconName>([
  "x",
  "plus",
  "send-url",
  "results",
  "check",
  "check-green",
]);

export default function UiIcon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const isSvg = SVG_ICONS.has(name);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={isSvg ? `/icons/ui/${name}.svg` : `/icons/ui/${name}.png`}
      srcSet={
        isSvg
          ? undefined
          : `/icons/ui/${name}.png 1x, /icons/ui/${name}@2x.png 2x, /icons/ui/${name}@3x.png 3x`
      }
      alt=""
      aria-hidden="true"
      width={20}
      height={20}
      draggable={false}
      className={`inline-block shrink-0 align-middle ${className}`}
      style={{ width: 20, height: 20 }}
    />
  );
}
