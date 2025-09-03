/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for face-api.js / tfjs issues
    config.resolve.alias = {
      ...config.resolve.alias,
      "bufferutil": false,
      "utf-8-validate": false,
      "supports-color": false,
    };

    // Handle node.js modules in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "fs": false,
      "net": false,
      "tls": false,
    };

    return config;
  },
}

export default nextConfig