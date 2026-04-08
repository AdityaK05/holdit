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
    <html lang="en" className="dark">
      <body className={inter.className}>
        {/* Cosmos animated background */}
        <div className="cosmos-bg" aria-hidden="true" />
        <div className="cosmos-particles" aria-hidden="true">
          <div className="cosmos-particle" />
          <div className="cosmos-particle" />
          <div className="cosmos-particle" />
          <div className="cosmos-particle" />
          <div className="cosmos-particle" />
          <div className="cosmos-particle" />
          <div className="cosmos-particle" />
          <div className="cosmos-particle" />
        </div>

        <div className="relative min-h-screen">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
