import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";
const repoName = process.env.GITHUB_REPO_NAME ?? "";
const basePath = isStaticExport && repoName ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: isStaticExport,
  basePath,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
