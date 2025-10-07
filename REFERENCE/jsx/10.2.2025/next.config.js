const withMDX = require('@next/mdx')({ extension: /\.mdx?$/ });
/** @type {import('next').NextConfig} */
const nextConfig = withMDX({
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'md', 'mdx']
});
module.exports = nextConfig;
