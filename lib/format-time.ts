// One place for every date / time / duration shown in the UI.
// Fixed en-US locale so the format is identical on every device:
//   formatDateTime -> "9/27/2026, 4:45:04 PM"
//   formatDate     -> "9/27/2026"
//   formatDuration -> "00:05:32"  (სთ:წთ:წმ)

export function formatDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined) return "—";
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}
