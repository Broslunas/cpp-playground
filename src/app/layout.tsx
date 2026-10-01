import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SkipLink } from "@/components/ui/SkipLink";

export const viewport: Viewport = {
  themeColor: "#00ff88",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://playground.broslunas.com"),
  title: {
    default: "Broslunas Playground | Compilador & Runner Online Multi-Lenguaje",
    template: "%s | Broslunas Playground",
  },
  description:
    "Broslunas Playground: entorno de desarrollo web moderno para compilar y ejecutar C++, Python, JavaScript, TypeScript, Linux Bash y HTML en tiempo real con GCC, Clang, stdin y persistencia local.",
  keywords: [
    "Broslunas Playground",
    "Broslunas",
    "compilador online",
    "c++ playground",
    "python playground",
    "javascript runner",
    "typescript compiler",
    "linux bash terminal",
    "gcc online",
    "clang online",
    "programacion online",
    "online ide",
    "code runner",
  ],
  authors: [{ name: "Broslunas", url: "https://broslunas.com" }],
  creator: "Broslunas",
  publisher: "Broslunas",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Broslunas",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://playground.broslunas.com",
    siteName: "Broslunas Playground",
    title: "Broslunas Playground | Compilador & Runner Online",
    description:
      "Compila y ejecuta C++, Python, TypeScript, JavaScript, Bash y HTML en tu navegador con soporte para stdin, salida en vivo y plantillas.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Broslunas Playground Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Broslunas Playground | Compilador & Runner Online",
    description:
      "Compila y ejecuta C++, Python, TypeScript, JavaScript, Bash y HTML en tiempo real sin instalaciones.",
    creator: "@broslunas",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Broslunas Playground",
    "url": "https://playground.broslunas.com",
    "description":
      "Playground y compilador online multi-lenguaje de alto rendimiento con soporte para C++, Python, JavaScript, TypeScript, Linux Bash y HTML.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "All",
    "author": {
      "@type": "Person",
      "name": "Broslunas",
      "url": "https://broslunas.com",
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
    },
  };

  return (
    <html lang="es" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(e){console.warn('SW:',e);});});}`,
          }}
        />
      </head>
      <body className="bg-[#090a0f] text-zinc-200 antialiased selection:bg-neon-green/20 selection:text-neon-green font-sans">
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
