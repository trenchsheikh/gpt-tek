import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Command,
  Clock,
  Wallet,
  Plus,
} from "lucide-react";
import "./landing.css";
export default function Page() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link href="/" className="landing-brand">
          <img src="/logo.png" alt="GPT Tek logo" />
          GPT Tek
        </Link>
        <nav>
          <a href="#how-it-works">How it works</a>
          <a href="#built-for-you">Why GPT Tek</a>
        </nav>
        <Link href="/app" className="landing-button">
          Open app <ArrowUpRight size={15} />
        </Link>
      </header>
      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-kicker">INTELLIGENCE, BUILT ON SOLANA</div>
          <h1>
            Your strategy.
            <br />A new kind of edge.
          </h1>
          <p>
            The decentralized intelligence core for Solana.
            <br />
            Build an agent that thinks your way.
            <br className="mobile-break" /> Share it. Rent it. Earn in SOL.
          </p>
          <div className="landing-actions">
            <Link href="/app?create=1" className="landing-button">
              Build your agent <Plus size={16} />
            </Link>
            <Link href="/app" className="landing-secondary">
              Explore the network <ArrowRight size={16} />
            </Link>
          </div>
          <div className="landing-caption">
            Your ideas, connected to opportunity.
          </div>
          <div className="landing-preview">
            <div className="preview-top">
              <span>
                <img src="/logo.png" alt="" /> Your intelligence, at work
              </span>
              <span className="preview-mode">Research workspace</span>
            </div>
            <div className="preview-content">
              <div className="preview-orbit">
                <img src="/logo.png" alt="" />
              </div>
              <h2>What’s your next move?</h2>
              <p>A clearer thesis. A sharper strategy. An agent of your own.</p>
              <div className="preview-pills">
                <span>↗ Momentum</span>
                <span>◈ DeFi research</span>
                <span>◎ Portfolio risk</span>
              </div>
              <Link href="/app?create=1" className="preview-composer">
                <span>Describe the agent you want to build…</span>
                <span className="preview-arrow">↑</span>
              </Link>
            </div>
          </div>
        </section>
        <section id="how-it-works" className="landing-section">
          <div className="landing-section-title">
            <span className="landing-kicker">A SIMPLE WAY TO START</span>
            <h2>
              From an idea
              <br />
              to something useful.
            </h2>
            <p>One workspace. Three steps. Your own edge.</p>
          </div>
          <div className="landing-steps">
            {[
              {
                n: "01",
                icon: Command,
                title: "Make it yours.",
                text: "Give your agent a strategy, a purpose, and clear rules. Start from a template or your own idea.",
              },
              {
                n: "02",
                icon: Clock,
                title: "Share your thinking.",
                text: "Publish your agent and set an hourly price. Others can rent access when they need your approach.",
              },
              {
                n: "03",
                icon: Wallet,
                title: "Earn in SOL.",
                text: "Rental payments go directly to your wallet. Access opens after on-chain confirmation.",
              },
            ].map(({ n, icon: Icon, title, text }) => (
              <article key={n}>
                <div>
                  <Icon size={22} />
                  <span>{n}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="built-for-you" className="landing-feature">
          <div>
            <span className="landing-kicker">
              THINK CLEARER. BUILD TOGETHER.
            </span>
            <h2>
              Intelligence should
              <br />
              feel like yours.
            </h2>
            <p>
              A familiar, quiet workspace for a new kind of network. Create
              research agents, explore independent strategies, and rent the
              perspective you need.
            </p>
            <Link href="/app" className="landing-secondary">
              Find your next edge <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="landing-principles">
            <article>
              <h3>Built around your strategy</h3>
              <p>
                Your instructions define the approach. You decide what to
                publish.
              </p>
            </article>
            <article>
              <h3>Access on your schedule</h3>
              <p>
                Rent for the hours you need, with a clear price before you pay.
              </p>
            </article>
            <article>
              <h3>Your identity. Your AI access.</h3>
              <p>
                Connect a Solana wallet. ChatGPT sign-in becomes available when
                the OpenAI integration is approved.
              </p>
            </article>
          </div>
        </section>
        <section className="landing-cta">
          <h2>Bring your next idea.</h2>
          <p>Build an agent. Put your thinking to work.</p>
          <Link href="/app?create=1" className="landing-button">
            Get started <ArrowUpRight size={16} />
          </Link>
        </section>
        <footer className="landing-footer">
          <Link href="/" className="landing-brand">
            <img src="/logo.png" alt="" />
            GPT Tek
          </Link>
          <p>Independent intelligence. Built for Solana.</p>
          <span>Research agents · Devnet test SOL · No guaranteed returns</span>
        </footer>
      </main>
    </div>
  );
}
