import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// IBM Plex, subconjunto latin, servido desde el repo (licencia en ./fonts/OFL.txt)
// para que el build no dependa de fonts.googleapis.com. Son los mismos archivos
// que embebía next/font/google; Sans es variable y se declara una vez por peso
// igual que antes.
const plexSans = localFont({
  variable: "--font-plex-sans",
  src: [
    { path: "./fonts/IBMPlexSans-latin-var.woff2", weight: "400" },
    { path: "./fonts/IBMPlexSans-latin-var.woff2", weight: "500" },
    { path: "./fonts/IBMPlexSans-latin-var.woff2", weight: "600" },
    { path: "./fonts/IBMPlexSans-latin-var.woff2", weight: "700" },
  ],
});

const plexMono = localFont({
  variable: "--font-plex-mono",
  src: [
    { path: "./fonts/IBMPlexMono-latin-400.woff2", weight: "400" },
    { path: "./fonts/IBMPlexMono-latin-500.woff2", weight: "500" },
    { path: "./fonts/IBMPlexMono-latin-600.woff2", weight: "600" },
  ],
});

export const metadata: Metadata = {
  title: "Servicios AGE",
  description: "Herramienta interna de gestión de maquinaria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
