import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}` : '');

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
