import type { Metadata } from "next";
import "../styles/index.css";
import { Toaster } from "./components/ui/sonner";

export const metadata: Metadata = {
  title: "ZyberHR - HR Management Platform",
  description: "ZyberHR HR Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
