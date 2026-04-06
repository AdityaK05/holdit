import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import Navbar from "@/components/Navbar";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HoldIt | Reserve Nearby Pickup",
  description: "Reserve products at nearby stores and pick them up with confidence.",
  keywords: ["HoldIt", "store pickup", "reservation", "inventory"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} theme-azure-night`}>
        <div className="min-h-screen">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
