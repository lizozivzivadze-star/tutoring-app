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

export default function UiIcon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/ui/${name}.png`}
      alt=""
      aria-hidden="true"
      width={20}
      height={20}
      draggable={false}
      className={`inline-block shrink-0 align-middle ${className}`}
      style={{ width: 20, height: 20, imageRendering: "pixelated" }}
    />
  );
}
