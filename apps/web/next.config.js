/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@deploysense/scanner-core"],
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined
};

module.exports = nextConfig;
