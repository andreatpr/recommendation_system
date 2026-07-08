import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { HealthBadge } from "@/components/HealthBadge";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "City Discovery Engine",
  description: "Descubre tu próxima ciudad favorita con recomendaciones basadas en Yelp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black">
        <header className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
          <Link href="/" className="font-semibold text-zinc-900 dark:text-zinc-50">
            City Discovery Engine
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/catalog"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Catálogo
            </Link>
            <HealthBadge />
          </nav>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
