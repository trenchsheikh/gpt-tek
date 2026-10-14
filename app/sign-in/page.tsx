import { appUrl, docsUrl, websiteUrl, docsLink } from "@/lib/site-urls";
import { SiteControls, XLink } from "../site-controls";
import Link from "next/link";
export default async function Page() {
  return (
    <div className="av-landing">
      <header className="av-nav">
        <Link href={websiteUrl} className="av-brand">
          AgentRouter
        </Link>
        <SiteControls />
      </header>
      <main className="av-landing-main">
        <section className="av-final-cta" style={{ marginTop: 100 }}>
          <img src="/avelis-logo.png" alt="AgentRouter" />
          <h2>Let’s reconnect.</h2>
          <p>Sign-in could not be completed. Start a fresh wallet session.</p>
          <Link className="av-button" href={appUrl}>
            Return to your workspace →
          </Link>
        </section>
      </main>
      <footer className="av-footer">
        <Link href={docsUrl}>Docs</Link>
        <XLink />
      </footer>
    </div>
  );
}
