const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mui/material', '@mui/icons-material'],
  outputFileTracingRoot: path.join(__dirname, '../'),
}

module.exports = nextConfig
