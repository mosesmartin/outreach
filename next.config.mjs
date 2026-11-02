/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pdfkit'],
    outputFileTracingIncludes: {
      '/**': ['./node_modules/pdfkit/**/*'],
      '/api/website-requests/setup': ['./supabase/website_requests.sql'],
    },
  },
};

export default nextConfig;



