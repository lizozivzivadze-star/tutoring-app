export default function Greeting({ name }: { name?: string | null }) {
  return (
    <span className="font-display text-ink text-lg truncate min-w-0">
      გამარჯობა{name ? ` ${name}` : ""}
    </span>
  );
}