import type { NextConfig } from "next";

const cors = [{ key: "Access-Control-Allow-Origin", value: "*" }];

const nextConfig: NextConfig = {
  // bookmark-ის გაფართოებები საიტის გვერდსა და ხატულებს ბრაუზერიდან
  // კითხულობენ, ამისთვის CORS ნებართვა სჭირდებათ (მხოლოდ საჯარო მისამართებზე).
  async headers() {
    return [
      { source: "/", headers: cors },
      { source: "/favicon.ico", headers: cors },
      { source: "/icons/:path*", headers: cors },
    ];
  },
};

export default nextConfig;