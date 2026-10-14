import Link from "next/link";
export default async function Page() {
  return (
    <div className="av-landing">
      <main className="av-landing-main">
        <section className="av-final-cta" style={{ marginTop: 100 }}>
          <img src="/avelis-logo.png" alt="AgentRouter" />
          <h2>Let’s reconnect.</h2>
          <p>Sign-in could not be completed. Start a fresh wallet session.</p>
          <Link className="av-button" href="/app">
            Return to your workspace →
          </Link>
        </section>
      </main>
    </div>
  );
}
