export default function Greeting({ name }: { name?: string | null }) {
  return (
    <span className="font-display text-ink-soft text-[17.5px] truncate min-w-0">
      გამარჯობა{name ? ` ${name},` : ""}
    </span>
  );
}