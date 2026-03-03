import type { Metadata } from "next";
import "../styles/index.css";
import { Toaster } from "./components/ui/sonner";

export const metadata: Metadata = {
  title: "ZyberJR - HR Management Platform",
  description: "ZyberJR HR Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
