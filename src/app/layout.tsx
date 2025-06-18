import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/layout/AppLayout";
import { SolarProvider } from "@/components/providers/SolarProvider";
import { DatabaseInitializer } from "@/components/DatabaseInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solar Panel Calculator - Advanced Power Analysis",
  description: "Calculate solar panel power outputs in different configurations with Pakistani pricing support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <SolarProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </SolarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
