import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Pre-render every page at build time → produces ./out/ as a tree
  // of HTML, JS, and CSS that nginx serves verbatim. No Node runtime,
  // no headers() at request time, no middleware. All identity + data
  // fetching happens client-side.
  output: "export",
  // Emit route/index.html so the same build works on GitHub Pages and
  // static nginx hosting without rewrite rules.
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
