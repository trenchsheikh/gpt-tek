import PoweredBy from "./powered-by";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Layers,
  FlaskConical,
  Wallet,
  BrainCircuit,
  Check,
  ShieldCheck,
} from "lucide-react";
import ModelStrip from "./model-strip";
import PixelPlayground from "./pixel-playground";
export default function Page() {
  return (
    <div className="av-landing">
      <header className="av-nav">
        <Link href="/" className="av-brand">
          <img src="/avelis-logo.png" alt="AgentRouter" />
          AgentRouter
        </Link>
        <nav>
          <a href="#intelligence">Intelligence</a>
          <a href="#process">How it works</a>
          <Link href="/app?view=market">Marketplace</Link>
        </nav>
        <Link className="av-button" href="/app">
          Launch app <ArrowUpRight size={16} />
        </Link>
      </header>
      <main className="av-landing-main">
        <section className="av-hero">
          <div className="av-hero-copy">
            <div className="av-eyebrow">
              <span /> YOUR STRATEGY. YOUR AGENT.
            </div>
            <h1>
              <span>BUILD. TRAIN.</span>
              <em>TRADE. EARN.</em>
            </h1>
            <p>
              Create your own autonomous AI trader using simple prompts. Develop
              its strategy, let it trade on Solana, and earn when others rent
              your agent.
            </p>
            <div className="av-actions">
              <Link href="/app" className="av-button">
                Build your agent <ArrowUpRight size={17} />
              </Link>
              <Link href="/app?view=market" className="av-link">
                Explore agents <ArrowRight size={16} />
              </Link>
            </div>
            <div className="av-hero-note">
              <PoweredBy />
            </div>
          </div>
          <div className="av-orchestration">
            <div className="av-pixel-scene">
              <PixelPlayground />
            </div>
            <div className="av-visual-top">
              <span>
                <span className="av-live-dot" /> INTELLIGENCE IN FORMATION
              </span>
              <span>01 / 04</span>
            </div>
            <div className="av-core">
              <img src="/avelis-logo.png" alt="" />
              <div>
                <strong>Your strategy</strong>
                <small>One coordinated agent</small>
              </div>
              <Layers size={19} />
            </div>
            <div className="av-flow-line" />
            <div className="av-visual-grid">
              {[
                { p: "anthropic", t: "Research", d: "Find the signal." },
                { p: "openai", t: "Reasoning", d: "Build conviction." },
                { p: "google", t: "Decision", d: "Pressure-test the move." },
                {
                  p: "deepseek",
                  t: "Execution planning",
                  d: "Stay inside the limits.",
                },
              ].map((s, i) => (
                <div className={"av-stage s" + i} key={s.t}>
                  <div>
                    <img src={`/providers/${s.p}.svg`} alt="" />
                    <span>0{i + 1}</span>
                  </div>
                  <h3>{s.t}</h3>
                  <p>{s.d}</p>
                </div>
              ))}
            </div>
            <div className="av-visual-bottom">
              <span>
                <Check size={13} /> Model roles are yours to choose
              </span>
              <span>Solana ↗</span>
            </div>
          </div>
        </section>
        <section id="intelligence" className="av-intelligence">
          <div className="av-section-line">
            <span className="av-eyebrow">
              CHOOSE THE MINDS BEHIND THE MACHINE
            </span>
            <span>Live model catalogue</span>
          </div>
          <h2>
            No single model.
            <br />
            No single way to think.
          </h2>
          <p>
            Mix leading models across research, reasoning, decisions, and
            execution planning.
            <br />
            Your AI architect helps you choose. You keep the final say.
          </p>
          <ModelStrip />
        </section>
        <section id="process" className="av-process">
          <div className="av-section-line">
            <span className="av-eyebrow">
              FROM A CONVERSATION TO A MARKETPLACE
            </span>
            <span>Built around you</span>
          </div>
          <h2>
            Build it. Test it.
            <br />
            Put your edge to work.
          </h2>
          <div className="av-process-grid">
            {[
              {
                n: "01",
                icon: BrainCircuit,
                t: "Talk it into existence.",
                d: "Describe your goals to your AI architect. Shape the strategy and choose a model for every role.",
              },
              {
                n: "02",
                icon: FlaskConical,
                t: "Test before you trust.",
                d: "Run forward paper tests using live market prices. Inspect decisions and a recorded performance history.",
              },
              {
                n: "03",
                icon: Layers,
                t: "List your intelligence.",
                d: "Set an hourly $AGENT price. Publish your tested agent for others to discover and rent.",
              },
              {
                n: "04",
                icon: Wallet,
                t: "Rent. Connect. Trade.",
                d: "Choose your rental time, connect your wallet, and review agent-generated swaps before you approve execution.",
              },
            ].map(({ n, icon: Icon, t, d }) => (
              <article key={n}>
                <div>
                  <Icon size={22} />
                  <span>{n}</span>
                </div>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="ar-rental-section" id="rent">
          <div className="ar-rental-intro">
            <span className="av-eyebrow">RENT AN AGENT</span>
            <h2>
              Find your next trader.
              <br />
              <em>Make it work for you.</em>
            </h2>
            <p>
              Choose a strategy, compare its model lineup and recorded tests,
              then rent access for the hours you need. Keep your trading funds
              in your own wallet.
            </p>
            <Link href="/app?view=market" className="av-button">
              Explore the marketplace <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="ar-rental-steps">
            {[
              {
                n: "01",
                t: "Choose your intelligence",
                d: "Review the strategy, model roles, trade limits and test history. Review the creator’s configuration before you rent.",
              },
              {
                n: "02",
                t: "Set your time and budget",
                d: "Choose 1–168 hours. See the hourly price and total in $AGENT before you sign.",
              },
              {
                n: "03",
                t: "Pay the creator in $AGENT",
                d: "Rental payments go directly to the agent creator. SOL covers network fees. Token checkout opens after launch.",
              },
              {
                n: "04",
                t: "Connect. Review. Execute.",
                d: "Access starts once payment is verified and ends automatically. Review each proposed swap before approving it in your wallet.",
              },
            ].map((x) => (
              <article key={x.n}>
                <span>{x.n}</span>
                <div>
                  <h3>{x.t}</h3>
                  <p>{x.d}</p>
                </div>
              </article>
            ))}
            <div className="ar-solana-label">
              <img src="/terminals/solana.png" alt="Solana" />
              Built on Solana · Paid in $AGENT
            </div>
          </div>
        </section>
        <section className="ar-terminal-section">
          <span className="av-eyebrow">YOUR AGENT. YOUR TRADING SETUP.</span>
          <h2>
            A home for your intelligence.
            <br />A choice of trading platforms.
          </h2>
          <p>
            We’re building toward connections with the platforms you already
            use. Explore Axiom, GMGN, Pump.fun’s terminal and Fomo today. Direct
            agent integrations are planned.
          </p>
          <div className="ar-terminal-grid">
            {[
              { name: "Axiom", logo: "axiom.svg", url: "https://axiom.trade" },
              { name: "GMGN", logo: "gmgn.ico", url: "https://gmgn.ai" },
              {
                name: "Pump Terminal",
                logo: "pump.svg",
                url: "https://trade.padre.gg",
              },
              { name: "Fomo", logo: "fomo.svg", url: "https://fomo.family" },
              {
                name: "Polymarket",
                logo: "polymarket.svg",
                url: "https://polymarket.com",
              },
              { name: "Kalshi", logo: "kalshi.png", url: "https://kalshi.com" },
            ].map((t) => (
              <a href={t.url} key={t.name} target="_blank" rel="noreferrer">
                <img src={`/terminals/${t.logo}`} alt="" />
                <strong>{t.name}</strong>
                <small>
                  Open platform <ArrowUpRight size={12} />
                </small>
              </a>
            ))}
          </div>
          <small className="at-footnote">
            Platform links do not grant AgentRouter access to your terminal
            account or wallet.
          </small>
        </section>
        <section className="av-split">
          <div>
            <span className="av-eyebrow">
              INTELLIGENCE WITHOUT THE BLACK BOX
            </span>
            <h2>
              Every role has
              <br />a reason to exist.
            </h2>
            <p>
              One model can find evidence. Another can question it. Your
              decision model weighs the trade, while execution stays governed by
              your wallet and configured limits.
            </p>
            <Link href="/app" className="av-link">
              Meet your AI architect <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="av-principles">
            <article>
              <span>01</span>
              <div>
                <h3>Your wallet stays yours.</h3>
                <p>
                  No seed phrases. No private keys. Live swaps require your
                  signature.
                </p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <h3>Evidence comes first.</h3>
                <p>
                  Paper results are recorded from forward tests, with simulation
                  assumptions shown.
                </p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <h3>Your agent. Your economics.</h3>
                <p>
                  You choose the rental price. Payments go directly to your
                  Solana wallet.
                </p>
              </div>
            </article>
          </div>
        </section>
        <section className="av-final-cta">
          <img src="/avelis-logo.png" alt="" />
          <h2>Bring your own edge.</h2>
          <p>We’ll help you build the intelligence around it.</p>
          <Link className="av-button" href="/app">
            Start building <ArrowUpRight size={16} />
          </Link>
        </section>
      </main>
      <footer className="av-footer">
        <Link href="/" className="av-brand">
          <img src="/avelis-logo.png" alt="" />
          AgentRouter
        </Link>
        <span>Independent intelligence. Connected by Solana.</span>
        <small>AI decisions and paper results do not guarantee returns.</small>
      </footer>
    </div>
  );
}
