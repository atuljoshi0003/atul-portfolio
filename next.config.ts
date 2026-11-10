import type { NextConfig } from 'next';
const config: NextConfig = { output: process.env.VERCEL ? undefined : 'export', images: { unoptimized: true }, trailingSlash: false };
export default config;
