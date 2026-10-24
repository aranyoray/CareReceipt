import type { NextConfig } from "next";

const config: NextConfig = {
  // The shared packages ship TypeScript source, not a build artefact.
  transpilePackages: ["@receipt/core", "@receipt/ui"],
};

export default config;
