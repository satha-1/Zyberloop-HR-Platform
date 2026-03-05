const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/icons-material'],
  outputFileTracingRoot: path.join(__dirname, '../'),
  webpack: (config) => {
    // Required for pdfjs-dist / react-pdf to bundle correctly with Next.js
    config.resolve.alias['canvas'] = false;
    config.resolve.alias['encoding'] = false;
    return config;
  },
};

module.exports = nextConfig;
