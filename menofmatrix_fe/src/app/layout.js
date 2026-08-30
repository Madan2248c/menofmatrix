import { Urbanist } from "next/font/google";
import Footer from "@/components/Footer";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
});

export const metadata = {
  title: "MenOfMatrix",
  description: "The official home of the MenOfMatrix community.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${urbanist.variable} antialiased`}>
      <body
        className="flex min-h-dvh flex-col overflow-x-hidden"
        suppressHydrationWarning
      >
        <SessionProvider>{children}</SessionProvider>
        <Footer />
      </body>
    </html>
  );
}
