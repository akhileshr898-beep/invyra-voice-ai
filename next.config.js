/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@google/generative-ai", "@deepgram/sdk", "googleapis"],
  },
};

module.exports = nextConfig;
