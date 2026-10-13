import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "GPT Tek — Intelligence, on your terms.",
  description:
    "Create Solana trading research agents. Publish strategies, rent access by the hour, and earn SOL.",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
