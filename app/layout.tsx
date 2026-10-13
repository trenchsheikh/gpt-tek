import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Avelis — Build your trading intelligence.",
  description:
    "Build multi-model Solana agents, test your strategy, and rent trading intelligence by the hour.",
  icons: { icon: "/avelis.svg", apple: "/avelis.svg" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
