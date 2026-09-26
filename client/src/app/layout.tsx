import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import HeaderComponent from "@/components/HeaderComponent";
import FooterComponent from "@/components/FooterComponent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Customized for your project
export const metadata: Metadata = {
  title: "Trading Control Center",
  description: "Live Execution Metrics & Terminal Logs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-900 text-slate-100 font-sans">
        <HeaderComponent/>

        {/* Dynamic Page Views (/engine-1, /engine-2) render here */}
        <main className="flex-1 py-6 px-3 max-w-7xl w-full mx-auto">
          {children}
        </main>
        <FooterComponent />
        
      </body>
    </html>
  );
}