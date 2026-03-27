import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Black_Ops_One } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const blackOps = Black_Ops_One({
  variable: "--font-black-ops",
  weight: "400",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Central do Conteúdo - Dashboard de Marketing",
  description:
    "Plataforma estratégica de marketing para distribuição de energia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${blackOps.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <TooltipProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 min-w-0 px-3 py-4 pt-14 md:pt-6 md:px-6 md:py-6">{children}</main>
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
