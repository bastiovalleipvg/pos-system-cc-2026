/** @type {import('next').NextConfig} */
const nextConfig = {
  // TODO: Configurar dominio de imágenes cuando se migre a S3/CDN
  // images: {
  //   remotePatterns: [{ protocol: 'https', hostname: 'tu-bucket.s3.amazonaws.com' }],
  // },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://app-backend-core.ambitiouscliff-28478ba7.canadacentral.azurecontainerapps.io/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
