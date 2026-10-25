import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /favicon.ico-ს ეძებს ბევრი ბრაუზერი და გაფართოება: ისიც ერთსა და
  // იმავე thumbnail-ზე მივუთითოთ (იხ. THUMBNAIL app/layout.tsx-ში).
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icons/icon-512.png",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
