import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Giá xăng dầu Việt Nam",
  description: "Theo dõi giá xăng dầu RON95, RON92, E5, E10, Diesel tại Việt Nam",
};

export const viewport = { width: "device-width", initialScale: 1 } as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-900 text-white">
        {children}
      </body>
    </html>
  );
}
