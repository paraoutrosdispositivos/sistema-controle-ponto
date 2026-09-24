import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Controle de Ponto",
  description: "Sistema para registro e gestão de jornada de trabalho",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full bg-white">
      <body className={`${inter.className} min-h-full flex flex-col bg-white text-zinc-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
