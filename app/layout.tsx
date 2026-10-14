import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AgentRouter | Build. Train. Trade. Earn.",
  description:
    "Build multi-model Solana agents, test your strategy, and rent trading intelligence by the hour.",
  icons: { icon: "/avelis-logo.png", apple: "/avelis-logo.png" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
