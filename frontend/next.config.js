/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera un servidor standalone optimizado para contenedores Docker.
  // Reduce el tamaño de la imagen al eliminar node_modules innecesarios.
  output: 'standalone',

  // Dominios autorizados para el componente <Image /> de Next.js.
  // Permite cargar las imágenes de productos desde Azure Blob Storage.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'stprodposcanada.blob.core.windows.net',
      },
    ],
  },

  /**
   * Proxy inverso (BFF Pattern).
   *
   * Todas las llamadas del frontend a /api/* son redirigidas al backend
   * de forma transparente. Esto garantiza:
   *   1. Las cookies son same-origin (no cross-site) → compatibilidad total.
   *   2. El tráfico pasa por el Application Gateway / WAF.
   *   3. Cero problemas de CORS en el navegador del cliente.
   *
   * En desarrollo:  redirige a http://localhost:3001
   * En producción:  redirige al FQDN interno del Container App del backend.
   */
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_INTERNAL_URL ||
      'https://app-backend-core.ambitiouscliff-28478ba7.canadacentral.azurecontainerapps.io';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
