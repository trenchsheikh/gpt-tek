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
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('agentrouter-theme');document.documentElement.dataset.theme=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}catch(e){}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
