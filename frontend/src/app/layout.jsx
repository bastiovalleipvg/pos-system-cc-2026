import './globals.css';

export const metadata = {
  title: 'Sistema POS',
  description: 'Punto de Venta para Pymes Chilenas',
};

import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
