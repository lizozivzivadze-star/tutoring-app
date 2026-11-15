import AppOnlyGuard from "@/components/app-only-guard";

// ყველა დაფა (მასწავლებელი, ტესტერი, მოსწავლე, ადმინი) — მხოლოდ აპში.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppOnlyGuard>{children}</AppOnlyGuard>;
}
