/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: {
    buildActivity: false,
  },
  images: {
    domains: [''], // Add the hostname here
  },
  future: {
    webpack5: true,
  },
  webpack(config) {
    config.optimization.minimize = true; // Temporarily disable CSS minification
    return config;
  },
  optimization: {
    scripts: true,
    styles: {
      minify: false,
      inlineCritical: false
    },
    "fonts": true
  },
};

export default nextConfig;
