import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hoa Lang Thang — Gift Platform",
  description: "Gửi yêu thương, không lo quên. Nền tảng quản lý quà tặng tự động cho cá nhân và doanh nghiệp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-background text-foreground font-body antialiased">
        {children}
      </body>
    </html>
  );
}
