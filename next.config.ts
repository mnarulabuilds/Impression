import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  basePath: "/impression",
  assetPrefix: "/impression/",
  images: {
    unoptimized: true, // GitHub Pages doesn't support Next.js automatic image optimization
  },
};

export default nextConfig;
