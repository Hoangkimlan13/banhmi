import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dvivqgxnm/image/upload/**",
      },
    ],

    // Next.js ưu tiên AVIF, sau đó WebP tùy browser
    formats: ["image/avif", "image/webp"],

    // Cache ảnh đã optimize tối thiểu 30 ngày
    minimumCacheTTL: 60 * 60 * 24 * 30,

    // Các kích thước responsive mà Next.js có thể tạo
    deviceSizes: [
      320,
      480,
      640,
      750,
      828,
      1080,
      1200,
      1440,
      1920,
    ],

    imageSizes: [
      16,
      32,
      48,
      64,
      96,
      128,
      256,
      384,
    ],
  },
};

export default nextConfig;

