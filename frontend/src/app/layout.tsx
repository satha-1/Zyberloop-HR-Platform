import type { Metadata } from "next";
import "../styles/index.css";
import { Toaster } from "./components/ui/sonner";

export const metadata: Metadata = {
  title: "HR Management Platform",
  description: "HR Management Platform",
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
