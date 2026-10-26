import UiIcon from "@/components/ui-icon";

// SendURL ხატულა. როცა confirmed=true, ზუსტად იმავე ადგილას ის
// შეუმჩნევლად ქრება (fade out), მის ადგილას მწვანე თოლია ჩნდება (fade in),
// durationMs-ის ბოლოს თოლია ქრება და ხატულა ისევ ბრუნდება.
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
      <UiIcon name="send-url" className="sendurl-icon" />
      <UiIcon name="check-green" className="sendurl-check" />
    </span>
  );
}
