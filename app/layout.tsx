import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "CyberSkope - Managed SOC/SIEM Services | Enterprise Security for SMBs",
  description:
    "24/7 threat detection and SIEM services starting at €1,800/month. Expert-managed security monitoring for growing businesses. GDPR compliant, Berlin-based.",
  generator: "v0.app",
  openGraph: {
    title: "CyberSkope - Managed SOC/SIEM Services",
    description: "24/7 threat detection without the enterprise cost. Starting at €1,800/month.",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
