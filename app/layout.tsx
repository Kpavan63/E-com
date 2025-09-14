import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import { NotificationProvider } from "./components/NotificationSystem";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
   title: "i1Fashion - Premium Clothing E-Commerce",
  description: "Discover premium clothing at i1Fashion. Shop the latest trends in fashion with cash on delivery. Quality clothing for every style.",
  keywords: "fashion, clothing, e-commerce, online shopping, premium fashion, i1Fashion",
  authors: [{ name: "i1Agency CEO" }],
  openGraph: {
    title: "i1Fashion - Premium Clothing E-Commerce",
    description: "Discover premium clothing at i1Fashion. Shop the latest trends in fashion with cash on delivery.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NotificationProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
