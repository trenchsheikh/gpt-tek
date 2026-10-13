"use client";
import { useState, useEffect, useRef } from "react";
import { signIn, signOut, getSession } from "next-auth/react";
import { Transaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import {
  ArrowUpRight,
  Plus,
  Search,
  Compass,
  Boxes,
  Clock,
  Settings,
  PanelLeftClose,
  ArrowUp,
  Wallet,
  ChevronRight,
  LoaderCircle,
  Command,
  Shield,
  Globe,
  X,
} from "lucide-react";
type Agent = {
  id: string;
  name: string;
  description: string;
  category: string;
  wallet: string;
  hourly_lamports: string;
  listed?: boolean;
  strategy?: string;
  mint_address?: string;
  mint_signature?: string;
};
type Rental = {
  id: string;
  agent_id: string;
  name: string;
  hours: number;
  status: string;
  expires_at: string;
  signature?: string;
};
type Provider = {
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signMessage: (m: Uint8Array, e: string) => Promise<{ signature: Uint8Array }>;
  signAndSendTransaction: (t: Transaction) => Promise<{ signature: string }>;
};
function provider(): Provider {
  const w = window as unknown as {
    phantom?: { solana: Provider };
    solana?: Provider;
  };
  const p = w.phantom?.solana || w.solana;
  if (!p) throw new Error("Install Phantom to connect a Solana wallet.");
  return p;
}
async function api(path: string, body?: unknown, method = "POST") {
  const r = await fetch(
    path,
    body
      ? {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}
const templates = [
  {
    name: "Momentum scout",
    category: "Momentum",
    description: "Spot momentum. Understand the move.",
    strategy:
      "Analyze Solana token momentum using data the user provides. Evaluate volume, liquidity, trend strength, concentration and downside scenarios. Explain entry hypotheses and invalidation levels. Never invent real-time market data.",
  },
  {
    name: "DeFi researcher",
    category: "DeFi",
    description: "Turn protocol complexity into clarity.",
    strategy:
      "Research Solana DeFi protocols from user-supplied sources. Evaluate liquidity, token economics, smart contract risk, yield sustainability and dependencies. Clearly separate evidence from assumptions and propose further diligence.",
  },
  {
    name: "Portfolio guardian",
    category: "Risk management",
    description: "A second opinion before your next move.",
    strategy:
      "Review a user-provided Solana portfolio. Assess concentration, liquidity, volatility, correlation and scenario risk. Provide a concise risk report, explain uncertainty, and ask for missing inputs. Do not claim to execute trades.",
  },
];
export default function Workspace() {
  const [view, setView] = useState("Discover");
  const [session, setSession] = useState<{
    user?: { name?: string | null };
  } | null>(null);
  const [status, setStatus] = useState({
    chatgpt: false,
    database: false,
    inference: false,
    network: "devnet",
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All agents");
  const [modal, setModal] = useState<"login" | "create" | "rent" | null>(null);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const [hours, setHours] = useState(4);
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [key, setKey] = useState("");
  const [dark, setDark] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    strategy: "",
    category: "Research",
    hourlySol: 0.01,
    listed: true,
  });
  async function refresh(v = view) {
    const request = ++requestId.current;
    setLoadError("");
    setLoading(true);
    try {
      const data = await api(
        v === "Rentals"
          ? "/api/rentals"
          : "/api/agents" + (v === "My agents" ? "?mine=1" : ""),
      );
      if (request !== requestId.current) return;
      if (v === "Rentals") setRentals(data);
      else setAgents(data);
    } catch (e) {
      if (request !== requestId.current) return;
      setAgents([]);
      setRentals([]);
      setLoadError((e as Error).message);
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }
  useEffect(() => {
    getSession()
      .then(setSession)
      .catch(() => setSession(null));
    api("/api/status")
      .then(setStatus)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (
      view === "Discover" ||
      (session && ["My agents", "Rentals"].includes(view))
    )
      refresh(view);
    else {
      requestId.current++;
      setAgents([]);
      setLoading(false);
    }
  }, [view, session]);
  useEffect(() => {
    function shortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        create();
      }
    }
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, [session]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.querySelector<HTMLElement>("button, input")?.focus();
    function keys(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) setModal(null);
      if (e.key !== "Tab") return;
      const nodes = Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, textarea, select, a[href]",
        ) || [],
      );
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [modal, busy]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function connect() {
    const p = provider();
    const result = await p.connect();
    const address = result.publicKey.toString();
    setWallet(address);
    return address;
  }
  async function walletLogin() {
    await action(async () => {
      const address = await connect();
      const c = await api("/api/challenge", {});
      const signed = await provider().signMessage(
        new TextEncoder().encode(c.message),
        "utf8",
      );
      const r = await signIn("wallet", {
        address,
        signature: bs58.encode(signed.signature),
        challenge: c.id,
        redirect: false,
      });
      if (r?.error)
        throw new Error(
          "Wallet sign-in failed. Request a new signature and retry.",
        );
      setSession(await getSession());
      setModal(null);
    });
  }
  function navigate(v: string) {
    setView(v);
    setSidebar(false);
    setSelected(null);
    setReply("");
  }
  function create(t?: (typeof templates)[number]) {
    if (!session) {
      setModal("login");
      return;
    }
    setForm({
      name: t?.name || "",
      description: t?.description || "",
      strategy: t?.strategy || "",
      category: t?.category || "Research",
      hourlySol: 0.01,
      listed: true,
    });
    setModal("create");
  }
  const filtered = agents.filter(
    (a) =>
      (category === "All agents" || a.category === category) &&
      (a.name + " " + a.description)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className={`app ${dark ? "dark" : ""}`}>
      <aside className={sidebar ? "open" : ""}>
        <a className="brand" href="/">
          {" "}
          <img src="/logo.png" alt="GPT Tek logo" />
          <span>
            GPT Tek<span className="brand-dot">.</span>
          </span>
        </a>
        <button className="create-nav" onClick={() => create()}>
          <Plus size={18} /> Create an agent <span>⌘ K</span>
        </button>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {[
            { name: "Discover", icon: Compass },
            { name: "My agents", icon: Boxes },
            { name: "Rentals", icon: Clock },
          ].map(({ name, icon: Icon }) => (
            <button
              className={view === name ? "active" : ""}
              key={name}
              onClick={() => navigate(name)}
            >
              <Icon size={18} />
              {name}
              {name === "Discover" && <span className="new">Explore</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="orb">
            <Command size={23} />
          </div>
          <strong>Your ideas. Your edge.</strong>
          <p>Build an agent that thinks your way. Share it with the network.</p>
          <button onClick={() => navigate("Guide")}>
            See how it works <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="aside-bottom">
          <button onClick={() => navigate("Settings")}>
            <Settings size={17} /> Settings
          </button>
          <button onClick={() => navigate("Guide")}>
            <Globe size={17} /> Documentation <ArrowUpRight size={14} />
          </button>
          <button
            className="profile"
            onClick={() =>
              session
                ? action(async () => {
                    await signOut({ redirect: false });
                    setSession(null);
                    setWallet("");
                  })
                : setModal("login")
            }
          >
            <span className="avatar">{session ? "✓" : "G"}</span>
            <span>
              {session?.user?.name || "Your workspace"}
              <small>{session ? "Sign out" : "Sign in to get started"}</small>
            </span>
            <ChevronRight size={15} />
          </button>
        </div>
      </aside>
      <div className="main">
        <header>
          <div>
            <button
              className="mobile-menu"
              aria-label="Toggle menu"
              onClick={() => setSidebar(!sidebar)}
            >
              <PanelLeftClose size={20} />
            </button>
            <span className="crumb">Workspace</span>
            <ChevronRight size={14} />
            <span>{view}</span>
          </div>
          <div>
            <span className="network">
              <i />
              {status.network === "mainnet-beta"
                ? "Solana mainnet"
                : "Solana devnet"}
            </span>
            <button
              className="outline wallet"
              onClick={() =>
                action(async () => {
                  await connect();
                })
              }
            >
              <Wallet size={15} />
              {wallet
                ? wallet.slice(0, 4) + "…" + wallet.slice(-4)
                : "Connect wallet"}
            </button>
            {!session && (
              <button className="black" onClick={() => setModal("login")}>
                Sign in
              </button>
            )}
          </div>
        </header>
        {notice && (
          <div className="toast" role="status">
            {notice}
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {view === "Discover" && (
          <main>
            <div className="eyebrow">
              <span /> THE INTELLIGENCE LAYER FOR SOLANA
            </div>
            <section className="hero">
              <h1>
                Intelligence,
                <br />
                on your terms.
              </h1>
              <p>
                Bring your ChatGPT account. Build a trading agent.
                <br className="desktop" /> Share your edge, and get paid in SOL.
              </p>
              <div className="hero-actions">
                <button className="black" onClick={() => create()}>
                  Create your agent <Plus size={17} />
                </button>
                <button
                  className="text-button"
                  onClick={() => navigate("Guide")}
                >
                  How it works <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="hero-art">
                <div className="art-grid" />
                <div className="art-ring ring-one" />
                <div className="art-ring ring-two" />
                <img src="/logo.png" alt="" />
                <span className="art-tag top">
                  <i /> Intelligence, connected
                </span>
                <span className="art-tag bottom">Built for Solana ↗</span>
              </div>
            </section>
            <section className="intro-strip">
              <span>
                <Command size={17} /> Built by you. Powered by AI.
              </span>
              <span>
                <Clock size={17} /> Rent by the hour.
              </span>
              <span>
                <Wallet size={17} /> Earn directly in SOL.
              </span>
            </section>
            <section className="market">
              <div className="section-heading">
                <div>
                  <h2>Find your next edge.</h2>
                  <p>
                    Discover independent agents. Rent the strategy that fits
                    you.
                  </p>
                </div>
                <span className="quiet">{agents.length} available agents</span>
              </div>
              <div className="filters">
                <div className="tabs">
                  {[
                    "All agents",
                    "Research",
                    "Momentum",
                    "DeFi",
                    "Risk management",
                  ].map((c) => (
                    <button
                      className={category === c ? "selected" : ""}
                      key={c}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <label className="search">
                  <Search size={16} />
                  <input
                    aria-label="Search agents"
                    placeholder="Search agents"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
              </div>
              {loading ? (
                <div className="empty">
                  <LoaderCircle className="spin" size={25} />
                  <p>Loading agents…</p>
                </div>
              ) : loadError ? (
                <div className="empty">
                  <Shield size={25} />
                  <h3>The network is getting ready.</h3>
                  <p>
                    {status.database
                      ? loadError
                      : "Agent listings will appear once the marketplace database is connected."}
                  </p>
                  <button onClick={() => refresh()}>Refresh marketplace</button>
                </div>
              ) : filtered.length ? (
                <div className="cards">
                  {filtered.map((a) => (
                    <AgentCard
                      key={a.id}
                      agent={a}
                      onClick={() => {
                        setSelected(a);
                        setModal("rent");
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <Boxes size={27} />
                  <h3>
                    {search
                      ? "No agents match your search."
                      : "Be the first to bring your edge."}
                  </h3>
                  <p>
                    {search
                      ? "Try a different name or category."
                      : "The marketplace is open for your first strategy."}
                  </p>
                  <button onClick={() => create()}>
                    Create an agent <ArrowUpRight size={16} />
                  </button>
                </div>
              )}
            </section>
            <section className="templates">
              <div className="section-heading">
                <div>
                  <h2>Start with a spark.</h2>
                  <p>Three starting points. Make one your own.</p>
                </div>
                <span className="quiet">STRATEGY TEMPLATES</span>
              </div>
              <div className="cards">
                {templates.map((t, i) => (
                  <button
                    className={"template t" + i}
                    key={t.name}
                    onClick={() => create(t)}
                  >
                    <span className="template-icon">
                      {i === 0 ? "↗" : i === 1 ? "◈" : "◎"}
                    </span>
                    <h3>{t.name}</h3>
                    <p>{t.description}</p>
                    <span>
                      Use template <ArrowUpRight size={17} />
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <footer>
              <span>GPT Tek · Independent intelligence.</span>
              <span>
                Research agents. No guaranteed returns.{" "}
                <button onClick={() => navigate("Guide")}>Learn more ↗</button>
              </span>
            </footer>
          </main>
        )}
        {view === "My agents" && (
          <main>
            <div className="section-heading">
              <div>
                <div className="eyebrow">YOUR INTELLIGENCE</div>
                <h1 className="page-title">My agents</h1>
                <p>Create, publish, and run your strategies.</p>
              </div>
              <button className="black" onClick={() => create()}>
                <Plus size={16} /> Create agent
              </button>
            </div>
            {!session ? (
              <SignInPrompt onClick={() => setModal("login")} />
            ) : loadError ? (
              <div className="empty">
                <p>{loadError}</p>
              </div>
            ) : agents.length ? (
              <div className="cards">
                {agents.map((a) => (
                  <div className="agent-card" key={a.id}>
                    <span className="category">{a.category}</span>
                    <h3>{a.name}</h3>
                    <p>{a.description}</p>
                    <div className="card-bottom">
                      <span>{a.listed ? "Published" : "Private"}</span>
                      <button
                        onClick={() =>
                          action(async () => {
                            await api(
                              "/api/agents",
                              { id: a.id, listed: !a.listed },
                              "PATCH",
                            );
                            await refresh();
                          })
                        }
                      >
                        {a.listed ? "Unlist" : "Publish"}
                      </button>
                    </div>
                    {a.mint_signature ? (
                      <a
                        className="mint-link"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://explorer.solana.com/address/${a.mint_address}${status.network === "mainnet-beta" ? "" : "?cluster=devnet"}`}
                      >
                        View on-chain mint ↗
                      </a>
                    ) : (
                      <button
                        className="run-button"
                        disabled={busy}
                        onClick={() =>
                          action(async () => {
                            const address = wallet || (await connect());
                            const own = await api("/api/mint", {
                              agentId: a.id,
                            });
                            const signed =
                              await provider().signAndSendTransaction(
                                Transaction.from(
                                  Uint8Array.from(atob(own.transaction), (c) =>
                                    c.charCodeAt(0),
                                  ),
                                ),
                              );
                            try {
                              await new Connection(
                                process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
                                  "https://api.devnet.solana.com",
                                "confirmed",
                              ).confirmTransaction(
                                signed.signature,
                                "confirmed",
                              );
                              await api("/api/mint", {
                                agentId: a.id,
                                signature: signed.signature,
                              });
                            } catch {
                              throw new Error(
                                `Mint sent: ${signed.signature}. Use Verify mint to register its proof. Do not mint again.`,
                              );
                            }
                            await refresh("My agents");
                            setNotice(
                              "Agent minted: a unique 1/1 SPL token with revoked mint authority.",
                            );
                          })
                        }
                      >
                        Mint on Solana ↗
                      </button>
                    )}
                    {a.mint_address && !a.mint_signature && (
                      <button
                        className="run-button"
                        onClick={() =>
                          action(async () => {
                            const signature = window.prompt(
                              "Paste your mint transaction signature",
                            );
                            if (signature) {
                              await api("/api/mint", {
                                agentId: a.id,
                                signature,
                              });
                              await refresh("My agents");
                            }
                          })
                        }
                      >
                        Verify mint
                      </button>
                    )}
                    <button
                      className="run-button"
                      onClick={() => {
                        setSelected(a);
                        setView("Agent workspace");
                        setReply("");
                      }}
                    >
                      Open workspace <ArrowUpRight size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">
                <Boxes size={28} />
                <h3>Your first agent starts with an idea.</h3>
                <p>Describe a strategy, set an hourly price, and publish it.</p>
                <button onClick={() => create()}>Create an agent ↗</button>
              </div>
            )}
          </main>
        )}
        {view === "Rentals" && (
          <main>
            <div className="eyebrow">ON YOUR CLOCK</div>
            <h1 className="page-title">Your rentals</h1>
            <p className="subheading">
              Your active sessions and on-chain payment history.
            </p>
            {!session ? (
              <SignInPrompt onClick={() => setModal("login")} />
            ) : loadError ? (
              <div className="empty">
                <p>{loadError}</p>
              </div>
            ) : rentals.length ? (
              <div className="rental-list">
                {rentals.map((r) => (
                  <article key={r.id}>
                    <Clock size={25} />
                    <div>
                      <h3>{r.name}</h3>
                      <p>
                        {r.status === "pending"
                          ? "Awaiting payment"
                          : new Date(r.expires_at) > new Date()
                            ? `Access until ${new Date(r.expires_at).toLocaleString()}`
                            : "Rental expired"}{" "}
                        · {r.hours} hours
                      </p>
                      {r.signature && (
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={`https://explorer.solana.com/tx/${r.signature}${status.network === "mainnet-beta" ? "" : "?cluster=devnet"}`}
                        >
                          View payment ↗
                        </a>
                      )}
                    </div>
                    {r.status === "active" &&
                      new Date(r.expires_at) > new Date() && (
                        <button
                          className="black"
                          onClick={() => {
                            setSelected({
                              id: r.agent_id,
                              name: r.name,
                            } as Agent);
                            setReply("");
                            setView("Agent workspace");
                          }}
                        >
                          Open agent ↗
                        </button>
                      )}
                    {r.status === "pending" && (
                      <button
                        onClick={() =>
                          action(async () => {
                            const signature = window.prompt(
                              "Paste the transaction signature from your wallet to verify payment.",
                            );
                            if (signature) {
                              await api("/api/rentals", {
                                id: r.id,
                                signature,
                              });
                              await refresh("Rentals");
                            }
                          })
                        }
                      >
                        Verify payment
                      </button>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty">
                <Clock size={28} />
                <h3>Find a strategy worth your time.</h3>
                <p>
                  Rent an agent to access its workspace for your chosen hours.
                </p>
                <button onClick={() => navigate("Discover")}>
                  Explore agents ↗
                </button>
              </div>
            )}
          </main>
        )}
        {view === "Settings" && (
          <main className="settings">
            <div className="eyebrow">MAKE IT YOURS</div>
            <h1 className="page-title">Settings</h1>
            <section>
              <h3>AI access</h3>
              <p>
                ChatGPT sign-in connects your identity. Hosted ChatGPT plan
                usage requires separate OpenAI approval. For now, use your own
                OpenAI API key to run agents.
              </p>
              <label>
                OpenAI API key
                <input
                  type="password"
                  autoComplete="off"
                  placeholder="sk-…"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                />
              </label>
              <small>
                Held only in this page’s memory. Sent to the server for each AI
                request; never saved in the database. Reloading clears it.
              </small>
            </section>
            <section>
              <h3>Appearance</h3>
              <p>A workspace that feels like you.</p>
              <button className="outline" onClick={() => setDark(!dark)}>
                {dark ? "Switch to light mode" : "Switch to dark mode"}
              </button>
            </section>
            <section>
              <h3>Connections</h3>
              <div className="connection-row">
                <span>ChatGPT sign-in</span>
                <span>
                  {status.chatgpt
                    ? "Configured"
                    : "Awaiting registered OpenAI client"}
                </span>
              </div>
              <div className="connection-row">
                <span>Marketplace database</span>
                <span>{status.database ? "Configured" : "Setup required"}</span>
              </div>
              <div className="connection-row">
                <span>Solana network</span>
                <span>{status.network}</span>
              </div>
            </section>
          </main>
        )}
        {view === "Guide" && (
          <main className="guide">
            <div className="eyebrow">THE SHORT VERSION</div>
            <h1 className="page-title">
              Your intelligence.
              <br />A shared network.
            </h1>
            <p className="subheading">
              The decentralized intelligence core for Solana.
            </p>
            {[
              {
                title: "01 / Bring your identity",
                text: "Sign in with a Solana wallet by signing a one-time message, or continue with ChatGPT when the registered OpenAI client is configured. Connect Phantom to pay and receive SOL.",
              },
              {
                title: "02 / Build your agent",
                text: "Write your strategy, choose a category, and set your hourly price. Your private instructions stay on the server. Publish the agent when you are ready to share it.",
              },
              {
                title: "03 / Rent by the hour",
                text: "Choose 1–168 hours. Review and approve a direct SOL payment in Phantom. The server checks the sender, recipient, exact amount, unique rental memo and on-chain confirmation before opening access.",
              },
              {
                title: "04 / Put your agent to work",
                text: "Owners and active renters can ask their agents for research. Each renter uses their own AI access. Agent strategies are never a way to rent out somebody else’s ChatGPT credentials.",
              },
            ].map((s) => (
              <section key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </section>
            ))}
            <section>
              <h3>What’s live, and what comes next</h3>
              <p>
                This version supports an off-chain strategy registry, direct
                Solana payments, expiring rentals and AI research. Owners can
                mint a 1/1 SPL token with revoked mint authority and a strategy
                hash in the transaction memo. This is a token receipt without
                NFT artwork metadata. It does not execute trades autonomously.
                Agents cannot see live market data unless you provide it. The
                default payment network is devnet, which uses test SOL.
              </p>
              <p>
                ChatGPT website sign-in and hosted plan usage require OpenAI
                approval and registered credentials. NFT artwork metadata,
                token-based ownership transfer and autonomous execution require
                additional infrastructure. Marketplace ownership stays with the
                signing account.
              </p>
              <a
                href="https://developers.openai.com/siwc"
                target="_blank"
                rel="noreferrer"
              >
                Read the official Sign in with ChatGPT documentation ↗
              </a>
            </section>
            <p className="quiet">
              GPT Tek is an independent project and is not affiliated with
              OpenAI. AI outputs may be inaccurate. Rental fees pay for strategy
              access, not promised investment returns.
            </p>
          </main>
        )}
        {view === "Agent workspace" && selected && (
          <main className="chat">
            <div className="chat-title">
              <span className="category">AGENT WORKSPACE</span>
              <h1>{selected.name}</h1>
              <p>
                Explore a thesis. Pressure-test a strategy. Ask a better
                question.
              </p>
            </div>
            {reply && (
              <article className="response">
                <div className="response-brand">
                  <img src="/logo.png" alt="" /> {selected.name}
                </div>
                <div>{reply}</div>
              </article>
            )}
            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault();
                action(async () => {
                  const data = await api("/api/run", {
                    agentId: selected.id,
                    prompt,
                    apiKey: key || undefined,
                  });
                  setReply(data.output);
                });
              }}
            >
              <textarea
                required
                maxLength={4000}
                aria-label="Message agent"
                placeholder="What would you like to explore?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div>
                <span>
                  Research mode ·{" "}
                  {key ? "Your OpenAI API key" : "Configured AI access"}
                </span>
                <button
                  className="black"
                  aria-label="Send message"
                  disabled={busy || !prompt}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={18} />
                  ) : (
                    <ArrowUp size={18} />
                  )}
                </button>
              </div>
            </form>
            <p className="chat-disclaimer">
              No autonomous trades. Verify market data and AI outputs.
            </p>
          </main>
        )}
      </div>
      {modal && (
        <div className="backdrop" onClick={() => !busy && setModal(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
            {modal === "login" ? (
              <>
                <img className="login-logo" src="/logo.png" alt="GPT Tek" />
                <h2 id="modal-title">Your edge starts here.</h2>
                <p>Sign in to build, publish, and rent agents.</p>
                <button
                  className="black full"
                  disabled={busy || !status.chatgpt}
                  onClick={() =>
                    action(async () => {
                      await signIn("openai");
                    })
                  }
                >
                  <Command size={18} /> Continue with ChatGPT
                </button>
                {!status.chatgpt && (
                  <small>
                    ChatGPT sign-in will be available once OpenAI registers this
                    application.
                  </small>
                )}
                <div className="divider">or</div>
                <button
                  className="outline full"
                  disabled={busy}
                  onClick={walletLogin}
                >
                  <Wallet size={18} />
                  {busy ? "Waiting for your wallet…" : "Continue with Solana"}
                </button>
                <p className="modal-footnote">
                  Sign a message to verify your wallet. No transaction or
                  payment is requested.
                </p>
              </>
            ) : modal === "create" ? (
              <>
                <span className="category">FROM IDEA TO INTELLIGENCE</span>
                <h2 id="modal-title">Create your agent.</h2>
                <p>Turn your strategy into something others can use.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    action(async () => {
                      const address = wallet || (await connect());
                      await api("/api/agents", { ...form, wallet: address });
                      setModal(null);
                      setView("My agents");
                      await refresh("My agents");
                      setNotice("Agent created. Your strategy is ready.");
                    });
                  }}
                >
                  <label>
                    Agent name
                    <input
                      required
                      minLength={3}
                      maxLength={60}
                      value={form.name}
                      placeholder="Give your edge a name"
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Short description
                    <input
                      required
                      minLength={10}
                      maxLength={300}
                      value={form.description}
                      placeholder="What makes this agent useful?"
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Strategy instructions
                    <textarea
                      required
                      minLength={30}
                      maxLength={8000}
                      rows={5}
                      value={form.strategy}
                      placeholder="Define its approach, rules, and risk limits…"
                      onChange={(e) =>
                        setForm({ ...form, strategy: e.target.value })
                      }
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Category
                      <select
                        value={form.category}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                      >
                        {[
                          "Research",
                          "Momentum",
                          "DeFi",
                          "Risk management",
                        ].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Hourly price (SOL)
                      <input
                        type="number"
                        required
                        min="0.000001"
                        max="100"
                        step="0.000001"
                        value={form.hourlySol}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            hourlySol: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={form.listed}
                      onChange={(e) =>
                        setForm({ ...form, listed: e.target.checked })
                      }
                    />{" "}
                    Publish to the marketplace
                  </label>
                  <small>
                    Creates a strategy listing. You can mint its 1/1 Solana
                    token from My agents.
                  </small>
                  <button disabled={busy} className="black full">
                    {busy ? "Creating…" : "Create agent"}{" "}
                    <ArrowUpRight size={17} />
                  </button>
                </form>
              </>
            ) : (
              selected && (
                <>
                  <span className="category">{selected.category}</span>
                  <h2 id="modal-title">{selected.name}</h2>
                  <p>{selected.description}</p>
                  <div className="rental-summary">
                    <span>Hourly rate</span>
                    <strong>
                      {Number(selected.hourly_lamports) / 1e9} SOL
                    </strong>
                  </div>
                  <label>
                    Rental duration
                    <input
                      type="number"
                      min={1}
                      max={168}
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                    />
                  </label>
                  <div className="rental-summary">
                    <span>Total · {hours} hours</span>
                    <strong>
                      {(
                        (Number(selected.hourly_lamports) * hours) /
                        1e9
                      ).toFixed(6)}{" "}
                      SOL
                    </strong>
                  </div>
                  <p className="modal-footnote">
                    Network: {status.network}. Paid directly to the creator.
                    Wallet network fees apply. Access begins after confirmation.
                  </p>
                  <button
                    className="black full"
                    disabled={busy}
                    onClick={() =>
                      !session
                        ? setModal("login")
                        : action(async () => {
                            if (
                              !Number.isInteger(hours) ||
                              hours < 1 ||
                              hours > 168
                            )
                              throw new Error("Choose 1–168 hours.");
                            const address = wallet || (await connect());
                            const checkout = await api("/api/rentals", {
                              agentId: selected.id,
                              payer: address,
                              hours,
                            });
                            const tx = Transaction.from(
                              Uint8Array.from(atob(checkout.transaction), (c) =>
                                c.charCodeAt(0),
                              ),
                            );
                            const payment =
                              await provider().signAndSendTransaction(tx);
                            setNotice(
                              "Payment sent. Waiting for confirmation…",
                            );
                            try {
                              const c = new Connection(
                                process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
                                  "https://api.devnet.solana.com",
                                "confirmed",
                              );
                              await c.confirmTransaction(
                                payment.signature,
                                "confirmed",
                              );
                              await api("/api/rentals", {
                                id: checkout.id,
                                signature: payment.signature,
                              });
                            } catch {
                              throw new Error(
                                `Payment sent: ${payment.signature}. Open Rentals and verify this signature to activate access. Do not pay again.`,
                              );
                            }
                            setModal(null);
                            setView("Agent workspace");
                            setNotice("Rental active. Your agent is ready.");
                          })
                    }
                  >
                    {busy ? (
                      <LoaderCircle className="spin" size={17} />
                    ) : (
                      <Wallet size={17} />
                    )}{" "}
                    {busy
                      ? "Confirming rental…"
                      : session
                        ? "Rent agent"
                        : "Sign in to rent"}
                  </button>
                </>
              )
            )}
            {notice && (
              <p className="modal-error" role="alert">
                {notice}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function SignInPrompt({ onClick }: { onClick: () => void }) {
  return (
    <div className="empty">
      <Shield size={28} />
      <h3>Your own space to build.</h3>
      <p>Sign in to access your agents and rentals.</p>
      <button className="black" onClick={onClick}>
        Sign in <ArrowUpRight size={16} />
      </button>
    </div>
  );
}
function AgentCard({
  agent: a,
  onClick,
}: {
  agent: Agent;
  onClick: () => void;
}) {
  return (
    <button className="agent-card" onClick={onClick}>
      <div className="agent-symbol">
        <Command size={25} />
      </div>
      <span className="category">{a.category}</span>
      <h3>{a.name}</h3>
      <p>{a.description}</p>
      <div className="card-bottom">
        <span>
          <strong>{Number(a.hourly_lamports) / 1e9} SOL</strong> / hour
        </span>
        <span>
          Rent agent <ArrowUpRight size={16} />
        </span>
      </div>
    </button>
  );
}
