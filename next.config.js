/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Routes are English (owner decision 2026-11-12). The old Vietnamese
  // routes redirect, so shared links and search results keep working; the
  // #hash (words, characters) is kept by the browser across the redirect.
  async redirects() {
    const moved = [
      ["/soan-bai", "/lesson"],
      ["/giay-phep", "/licenses"],
      ["/tools/lo-trinh", "/tools/path"],
      ["/tools/tra-tu", "/tools/lookup"],
      ["/tools/anki/huong-dan", "/tools/anki/guide"],
    ];
    return moved.flatMap(([from, to]) => [
      { source: from, destination: to, permanent: true },
      { source: `/en${from}`, destination: `/en${to}`, permanent: true },
    ]);
  },
  webpack: (config, { isServer }) => {
    // sql.js (Anki .apkg export) only requires these under Node; the browser build never uses them.
    if (!isServer) config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, crypto: false };
    return config;
  },
};

module.exports = nextConfig;
