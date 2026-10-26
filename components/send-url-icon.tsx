import UiIcon from "@/components/ui-icon";

export default function SendUrlIcon({
  confirmed,
  durationMs = 5000,
}: {
  confirmed: boolean;
  durationMs?: number;
}) {
  return (
    <span
      className="sendurl-wrap"
      data-confirmed={confirmed ? "true" : "false"}
      style={{ "--d": `${durationMs}ms` } as React.CSSProperties}
    >
      <span
        className="sendurl-icon"
        style={{ opacity: confirmed ? 0 : undefined }}
      >
        <UiIcon name="send-url" />
      </span>

      <span className="sendurl-check">
        <UiIcon name="check-green" />
      </span>
    </span>
  );
}