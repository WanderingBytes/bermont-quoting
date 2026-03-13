import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bermont Materials — Quote Management",
  description: "Internal quoting system for Bermont Materials. Manage email-based quote requests from contractors and suppliers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
