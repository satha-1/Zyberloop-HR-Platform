const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/icons-material'],
  outputFileTracingRoot: path.join(__dirname, '../'),
  webpack: (config) => {
    // Required for react-pdf / pdfjs-dist canvas usage
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // pdfjs-dist ships .mjs files. Without this rule webpack may treat them
    // as strict ES modules and fail when the UMD/IIFE wrapper inside the file
    // tries to do `Object.defineProperty(exports, "__esModule", …)` —
    // `exports` is not defined in strict ES-module scope, causing the
    // "Object.defineProperty called on non-object" runtime crash.
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
      resolve: { fullySpecified: false },
    });

    return config;
  },
};

module.exports = nextConfig;
