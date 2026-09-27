/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pdfkit'],
    outputFileTracingIncludes: {
      '/**': ['./node_modules/pdfkit/**/*'],
    },
  },
};

export default nextConfig;



