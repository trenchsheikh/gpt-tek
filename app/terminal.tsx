"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getSession, signIn, signOut } from "next-auth/react";
import { Transaction, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import {
  Plus,
  ArrowUpRight,
  ArrowUp,
  Search,
  X,
  ChevronDown,
  Layers,
  Compass,
  Clock,
  Settings,
  Wallet,
  FlaskConical,
  LoaderCircle,
  Check,
  ShieldCheck,
  ArrowLeft,
  PanelLeftClose,
  BrainCircuit,
} from "lucide-react";
import type { Model } from "@/lib/models";
import { planSchema, stages } from "@/lib/agent-plan";
import type { z } from "zod";
type Plan = z.infer<typeof planSchema>;
type Agent = {
  id: string;
  name: string;
  description: string;
  category: string;
  hourly_lamports: string;
  plan?: Plan;
  models?: Plan["models"];
  listed?: boolean;
  paper_samples?: number;
  wallet: string;
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
type Msg = { role: "user" | "assistant"; content: string };
type Run = {
  id: string;
  price: number;
  action: string;
  amount_usd: number;
  equity: number;
  usd: number;
  sol: number;
  created_at: string;
  report: {
    research: string;
    reasoning: string;
    decision: string;
    execution: string;
    snapshot: { source: string };
  };
};
type Provider = {
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signMessage: (m: Uint8Array, e: string) => Promise<{ signature: Uint8Array }>;
  signTransaction: (t: VersionedTransaction) => Promise<VersionedTransaction>;
  signAndSendTransaction: (t: Transaction) => Promise<{ signature: string }>;
};
function walletProvider() {
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
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Request failed.");
  return d;
}
const defaultPlan: Plan = {
  name: "",
  description: "",
  strategy: "",
  category: "Momentum",
  models: { research: "", reasoning: "", decision: "", execution: "" },
  maxTradeUsd: 100,
  slippageBps: 50,
  stopLossPct: 10,
};
function ProviderIcon({ provider }: { provider: string }) {
  return ["openai", "anthropic", "google", "deepseek", "qwen", "x-ai"].includes(
    provider,
  ) ? (
    <img
      className="at-provider-icon"
      src={`/providers/${provider}.svg`}
      alt=""
    />
  ) : (
    <span className="at-provider-fallback">
      {provider.slice(0, 1).toUpperCase()}
    </span>
  );
}
export default function Terminal() {
  const [view, setView] = useState("Build");
  const [session, setSession] = useState<{
    user?: { name?: string | null };
  } | null>(null);
  const [catalogue, setCatalogue] = useState<Model[]>([]);
  const [status, setStatus] = useState({
    database: false,
    inference: false,
    trading: false,
    network: "devnet",
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [plan, setPlan] = useState<Plan>(defaultPlan);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [architect, setArchitect] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [wallet, setWallet] = useState("");
  const [price, setPrice] = useState(0.01);
  const [hours, setHours] = useState(4);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"models" | "login" | "rent" | null>(null);
  const [pickStage, setPickStage] = useState<string>("architect");
  const [modelSearch, setModelSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [providerFilter, setProviderFilter] = useState("all");
  const [decision, setDecision] = useState<{
    decision: {
      action: "buy" | "sell" | "hold";
      amountUsd: number;
      reason: string;
    };
    reports: Record<string, string>;
    snapshot: { price: number };
    balance: { usd: number; sol: number };
  } | null>(null);
  const [quote, setQuote] = useState<{
    id: string;
    transaction: string;
    amountUsd: number;
    action: string;
    slippageBps: number;
    expiresIn: number;
  } | null>(null);
  const [quoteTime, setQuoteTime] = useState(0);
  const ready = useRef(false);
  const serial = useRef(0);
  const chatEnd = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "market")
      setView("Marketplace");
    getSession()
      .then(setSession)
      .catch(() => {});
    api("/api/status")
      .then(setStatus)
      .catch(() => {});
    api("/api/models")
      .then((m: Model[]) => {
        setCatalogue(m);
        const preferred =
          m.find((x) => x.provider === "anthropic" && !x.id.includes(":")) ||
          m[0];
        if (preferred) setArchitect(preferred.id);
        setPlan((p) => ({
          ...p,
          models: Object.fromEntries(
            stages.map((s) => [s, p.models[s] || preferred?.id || ""]),
          ) as Plan["models"],
        }));
      })
      .catch((e) => setNotice(e.message));
    try {
      const stored = localStorage.getItem("avelis-draft-v1");
      if (stored) {
        const p = JSON.parse(stored);
        if (p.plan) setPlan(p.plan);
        if (p.messages) setMessages(p.messages);
      }
    } catch {}
    ready.current = true;
  }, []);
  useEffect(() => {
    if (ready.current)
      localStorage.setItem(
        "avelis-draft-v1",
        JSON.stringify({ plan, messages: messages.slice(-20) }),
      );
  }, [plan, messages]);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);
  useEffect(() => {
    if (["Marketplace", "My agents", "Rentals"].includes(view)) refresh(view);
  }, [view, session]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    dialog?.querySelector<HTMLElement>("input,button")?.focus();
    function keys(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) setModal(null);
      if (e.key === "Tab") {
        const nodes = Array.from(
          dialog?.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input,select,a[href]",
          ) || [],
        );
        if (e.shiftKey && document.activeElement === nodes[0]) {
          e.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          e.preventDefault();
          nodes[0]?.focus();
        }
      }
    }
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
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
  async function refresh(v = view) {
    const id = ++serial.current;
    setLoading(true);
    setError("");
    try {
      const d = await api(
        v === "Rentals"
          ? "/api/rentals"
          : "/api/agents" + (v === "My agents" ? "?mine=1" : ""),
      );
      if (id !== serial.current) return;
      v === "Rentals" ? setRentals(d) : setAgents(d);
    } catch (e) {
      if (id === serial.current) {
        setError((e as Error).message);
        setAgents([]);
        setRentals([]);
      }
    } finally {
      if (id === serial.current) setLoading(false);
    }
  }
  async function connect() {
    const r = await walletProvider().connect();
    const a = r.publicKey.toString();
    setWallet(a);
    return a;
  }
  async function login() {
    await action(async () => {
      const address = await connect();
      const c = await api("/api/challenge", {});
      const signed = await walletProvider().signMessage(
        new TextEncoder().encode(c.message),
        "utf8",
      );
      const result = await signIn("wallet", {
        address,
        signature: bs58.encode(signed.signature),
        challenge: c.id,
        redirect: false,
      });
      if (result?.error)
        throw new Error("Sign-in failed. Start a new wallet signature.");
      setSession(await getSession());
      setModal(null);
    });
  }
  function picker(stage: string) {
    setPickStage(stage);
    setModelSearch("");
    setProviderFilter("all");
    setModal("models");
  }
  function modelName(id: string) {
    return (
      catalogue.find((m) => m.id === id)?.name.replace(/^[^:]+:\s*/, "") ||
      "Choose model"
    );
  }
  async function send() {
    if (!draft.trim() || !architect) return;
    const next = [...messages, { role: "user" as const, content: draft }].slice(
      -20,
    );
    setMessages(next);
    setDraft("");
    await action(async () => {
      const r = await api("/api/builder", {
        model: architect,
        messages: next,
        apiKey: apiKey || undefined,
      });
      setMessages([...next, { role: "assistant", content: r.output }]);
      const json = r.output.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (json) {
        try {
          const proposed = planSchema.parse(JSON.parse(json[1]));
          const allowed = Object.values(proposed.models).every((id) =>
            catalogue.some((m) => m.id === id),
          );
          if (allowed) {
            setPlan(proposed);
            setNotice(
              "Strategy and model roles proposed. Review them before saving.",
            );
          }
        } catch {}
      }
    });
  }
  async function save() {
    if (!session) {
      setModal("login");
      return;
    }
    await action(async () => {
      const validated = planSchema.parse(plan);
      const address = wallet || (await connect());
      const r = await api("/api/agents", {
        name: plan.name,
        description: plan.description,
        strategy: plan.strategy,
        category: plan.category,
        hourlySol: price,
        wallet: address,
        listed: false,
        plan: validated,
      });
      const a = {
        id: r.id,
        ...plan,
        plan: validated,
        wallet: address,
        hourly_lamports: String(Math.round(price * 1e9)),
      };
      setSelected(a);
      setView("Test & trade");
      setRuns([]);
      setNotice("Draft saved. Run five forward tests before publishing.");
    });
  }
  async function openAgent(a: Agent) {
    setSelected(a);
    setView("Test & trade");
    setDecision(null);
    setQuote(null);
    setRuns([]);
    await action(async () => {
      setRuns(await api("/api/paper?agentId=" + a.id));
    });
  }
  const displayModels = catalogue
    .filter(
      (m) =>
        (providerFilter === "all" || m.provider === providerFilter) &&
        (m.name + " " + m.id).toLowerCase().includes(modelSearch.toLowerCase()),
    )
    .slice(0, 100);
  return (
    <div className="at-shell">
      <header className="ar-app-nav">
        <Link href="/" className="av-brand">
          <img src="/avelis-logo.png" alt="" />
          AgentRouter
        </Link>
        <nav aria-label="App navigation">
          {[
            { name: "Build", icon: BrainCircuit },
            { name: "My agents", icon: Layers },
            { name: "Marketplace", icon: Compass },
            { name: "Rentals", icon: Clock },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={view === name ? "active" : ""}
              aria-current={view === name ? "page" : undefined}
              onClick={() => setView(name)}
            >
              <Icon size={16} />
              {name}
            </button>
          ))}
        </nav>
        <div className="ar-nav-account">
          <button
            className={view === "Settings" ? "active" : ""}
            aria-label="Settings"
            onClick={() => setView("Settings")}
          >
            <Settings size={18} />
          </button>
          <button
            className="at-outline"
            onClick={() =>
              session
                ? action(async () => {
                    await signOut({ redirect: false });
                    setSession(null);
                  })
                : setModal("login")
            }
          >
            {session ? "Sign out" : "Sign in"}
          </button>
        </div>
      </header>
      <div className="at-main">
        <header className="at-topbar">
          <div>
            <strong>{view}</strong>
          </div>
          <div>
            <span className="at-network">
              <span className="av-live-dot" />
              {status.network === "mainnet-beta"
                ? "Mainnet rentals"
                : "Devnet rentals"}
            </span>
            <button
              className="at-outline"
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
          </div>
        </header>
        {notice && (
          <div className="at-notice" role="status">
            {notice}
            <button aria-label="Dismiss" onClick={() => setNotice("")}>
              <X size={15} />
            </button>
          </div>
        )}
        {view === "Build" && (
          <div className="at-builder">
            <section className="at-chat">
              <div className="at-chat-header">
                <div>
                  <strong className="ar-section-label">Agent builder</strong>
                </div>
                <button
                  className="at-model-button"
                  onClick={() => picker("architect")}
                >
                  <ProviderIcon provider={architect.split("/")[0]} />
                  {modelName(architect)}
                  <ChevronDown size={13} />
                </button>
              </div>
              <div className="at-messages">
                {!messages.length ? (
                  <div className="at-chat-welcome">
                    <img src="/avelis-logo.png" alt="" />
                    <h2>What should your agent do?</h2>
                    <p>
                      Tell your architect the strategy, timeframe, and risk
                      limits you have in mind. It’ll help you build the plan and
                      choose models for every role.
                    </p>
                    <div className="at-starters">
                      {[
                        "Build a cautious SOL momentum agent",
                        "Help me manage SOL and USDC exposure",
                        "Compare models for a research-first strategy",
                      ].map((t) => (
                        <button key={t} onClick={() => setDraft(t)}>
                          {t}
                          <ArrowUpRight size={14} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <article className={"at-message " + m.role} key={i}>
                      <span>
                        {m.role === "user" ? "You" : "AgentRouter architect"}
                      </span>
                      <div>
                        {m.content.replace(
                          /```(?:json)?[\s\S]*?```/g,
                          "Strategy proposal added to the configuration panel →",
                        )}
                      </div>
                    </article>
                  ))
                )}
                {busy && (
                  <div className="at-thinking">
                    <LoaderCircle size={16} className="spin" /> Building your
                    intelligence…
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
              <form
                className="at-composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <textarea
                  aria-label="Message your agent architect"
                  placeholder="Describe the agent you want to build…"
                  value={draft}
                  maxLength={6000}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <div>
                  <span>
                    {apiKey || status.inference
                      ? "AI access connected"
                      : "Add a model access key in Settings"}
                  </span>
                  <button
                    aria-label="Send message"
                    disabled={busy || !draft.trim() || !architect}
                  >
                    <ArrowUp size={18} />
                  </button>
                </div>
              </form>
            </section>
            <section className="at-configuration">
              <div className="at-config-title">
                <span className="av-eyebrow">YOUR AGENT BLUEPRINT</span>
                <span className="at-pill">Draft</span>
              </div>

              <label>
                Agent name
                <input
                  value={plan.name}
                  placeholder="Name your intelligence"
                  maxLength={60}
                  onChange={(e) => setPlan({ ...plan, name: e.target.value })}
                />
              </label>
              <label>
                Short description
                <input
                  value={plan.description}
                  placeholder="What is its edge?"
                  maxLength={300}
                  onChange={(e) =>
                    setPlan({ ...plan, description: e.target.value })
                  }
                />
              </label>
              <div className="at-roles">
                {stages.map((s, i) => (
                  <button key={s} onClick={() => picker(s)}>
                    <span className="at-role-number">0{i + 1}</span>
                    <div>
                      <strong>
                        {s === "execution"
                          ? "Execution planning"
                          : s[0].toUpperCase() + s.slice(1)}
                      </strong>
                      <small>{modelName(plan.models[s])}</small>
                    </div>
                    <ProviderIcon provider={plan.models[s].split("/")[0]} />
                    <ChevronDown size={12} />
                  </button>
                ))}
              </div>
              <label>
                Trading rules
                <textarea
                  rows={4}
                  maxLength={8000}
                  placeholder="Entry rules, exits, evidence requirements…"
                  value={plan.strategy}
                  onChange={(e) =>
                    setPlan({ ...plan, strategy: e.target.value })
                  }
                />
              </label>
              <div className="at-form-pair">
                <label>
                  Max trade (USD)
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={plan.maxTradeUsd}
                    onChange={(e) =>
                      setPlan({ ...plan, maxTradeUsd: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Paper loss limit (%)
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={plan.stopLossPct}
                    onChange={(e) =>
                      setPlan({ ...plan, stopLossPct: Number(e.target.value) })
                    }
                  />
                </label>
              </div>
              <div className="at-form-pair">
                <label>
                  Slippage (bps)
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={plan.slippageBps}
                    onChange={(e) =>
                      setPlan({ ...plan, slippageBps: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Rental SOL / hour
                  <input
                    type="number"
                    min={0.000001}
                    step={0.001}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </label>
              </div>
              <button
                className="av-button at-full"
                disabled={busy}
                onClick={save}
              >
                Save & test agent <ArrowUpRight size={16} />
              </button>
              <small className="at-footnote">
                A saved draft needs five recorded forward tests before listing.
                Live execution requires wallet approval.
              </small>
            </section>
          </div>
        )}
        {["Marketplace", "My agents"].includes(view) && (
          <main className="at-content">
            <div className="ar-market-toolbar">
              <div className="ar-category-tabs" aria-label="Agent categories">
                {["All", "Research", "Momentum", "DeFi", "Risk management"].map(
                  (c) => (
                    <button
                      key={c}
                      className={category === c ? "active" : ""}
                      aria-pressed={category === c}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ),
                )}
              </div>
              <label className="ar-agent-search">
                <Search size={16} />
                <input
                  aria-label="Search agents"
                  placeholder="Search agents…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button className="av-button" onClick={() => setView("Build")}>
                <Plus size={16} />
                Create agent
              </button>
            </div>
            <div className="ar-result-count">
              {
                agents.filter(
                  (a) =>
                    (category === "All" || a.category === category) &&
                    (a.name + a.description)
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                ).length
              }{" "}
              agents
            </div>
            {loading ? (
              <Empty title="Loading your network…" loading />
            ) : error ? (
              <Empty
                title={
                  status.database
                    ? "Could not load agents."
                    : "The marketplace is being connected."
                }
                text={
                  status.database
                    ? error
                    : "You can explore the builder now. Saving and rentals become available once the database is connected."
                }
                onClick={() => refresh()}
                button="Try again"
              />
            ) : !agents.length ? (
              <Empty
                title={
                  view === "Marketplace"
                    ? "The first edge could be yours."
                    : "Start with a conversation."
                }
                text="Build an agent, run forward tests, and bring it to the network."
                onClick={() => setView("Build")}
                button="Build an agent"
              />
            ) : !agents.some(
                (a) =>
                  (category === "All" || a.category === category) &&
                  (a.name + a.description)
                    .toLowerCase()
                    .includes(query.toLowerCase()),
              ) ? (
              <Empty
                title="No matching agents"
                button="Clear filters"
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                }}
              />
            ) : (
              <div className="at-agent-grid">
                {agents
                  .filter(
                    (a) =>
                      (category === "All" || a.category === category) &&
                      (a.name + a.description)
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                  )
                  .map((a) => (
                    <article className="at-agent-card" key={a.id}>
                      <div className="at-card-top">
                        <span className="at-agent-symbol">
                          {a.name.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="at-pill">{a.category}</span>
                      </div>
                      <h3>{a.name}</h3>
                      <p>{a.description}</p>
                      <div className="at-card-models">
                        {Array.from(
                          new Set(
                            Object.values(a.models || a.plan?.models || {}).map(
                              (id) => id.split("/")[0],
                            ),
                          ),
                        ).map((p) => (
                          <ProviderIcon key={p} provider={p} />
                        ))}
                      </div>
                      <div
                        className="ar-test-progress"
                        aria-label={`${a.paper_samples || 0} forward tests recorded`}
                      >
                        <div>
                          <span>Forward tests</span>
                          <strong>{a.paper_samples || 0}</strong>
                        </div>
                        <progress
                          max={Math.max(5, a.paper_samples || 0)}
                          value={a.paper_samples || 0}
                        />
                      </div>
                      <div className="at-card-stats">
                        <span>
                          {view === "Marketplace"
                            ? `${a.paper_samples || 0} forward samples`
                            : a.listed
                              ? "Listed on marketplace"
                              : "Private draft"}
                        </span>
                        <span>
                          <strong>{Number(a.hourly_lamports) / 1e9} SOL</strong>{" "}
                          / hr
                        </span>
                      </div>
                      <button
                        className="at-outline at-full"
                        onClick={() =>
                          view === "Marketplace"
                            ? (setSelected(a), setModal("rent"))
                            : openAgent(a)
                        }
                      >
                        {view === "Marketplace"
                          ? "Rent agent"
                          : "Test & manage"}
                        <ArrowUpRight size={15} />
                      </button>
                      {view === "My agents" && a.listed && (
                        <button
                          className="at-unlist"
                          disabled={busy}
                          onClick={() =>
                            action(async () => {
                              await api(
                                "/api/agents",
                                { id: a.id, listed: false },
                                "PATCH",
                              );
                              await refresh();
                            })
                          }
                        >
                          Unlist agent
                        </button>
                      )}
                    </article>
                  ))}
              </div>
            )}
          </main>
        )}
        {view === "Rentals" && (
          <main className="at-content">
            {loading ? (
              <Empty title="Loading rentals…" loading />
            ) : error ? (
              <Empty
                title={
                  session
                    ? "Rentals could not be loaded."
                    : "Sign in to see your rentals."
                }
                text={
                  session
                    ? error
                    : "Your wallet signature creates your AgentRouter identity."
                }
                onClick={() => (session ? refresh() : setModal("login"))}
                button={session ? "Retry" : "Sign in"}
              />
            ) : !rentals.length ? (
              <Empty
                title="Find your next perspective."
                onClick={() => setView("Marketplace")}
                button="Explore agents"
              />
            ) : (
              <div className="at-rentals">
                {rentals.map((r) => (
                  <article key={r.id}>
                    <Clock size={23} />
                    <div>
                      <h3>{r.name}</h3>
                      <p>
                        {r.status === "pending"
                          ? "Payment awaiting verification"
                          : new Date(r.expires_at) > new Date()
                            ? `Access until ${new Date(r.expires_at).toLocaleString()}`
                            : "Expired"}{" "}
                        · {r.hours} hours
                      </p>
                      {r.signature && (
                        <a
                          href={`https://explorer.solana.com/tx/${r.signature}${status.network === "devnet" ? "?cluster=devnet" : ""}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View rental payment ↗
                        </a>
                      )}
                    </div>
                    {r.status === "active" &&
                      new Date(r.expires_at) > new Date() && (
                        <button
                          className="av-button"
                          onClick={() =>
                            openAgent({ id: r.agent_id, name: r.name } as Agent)
                          }
                        >
                          Open agent ↗
                        </button>
                      )}
                    {r.status === "pending" && (
                      <button
                        className="at-outline"
                        onClick={() =>
                          action(async () => {
                            const signature = window.prompt(
                              "Paste the rental payment transaction signature.",
                            );
                            if (signature) {
                              await api("/api/rentals", {
                                id: r.id,
                                signature,
                              });
                              await refresh();
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
            )}
          </main>
        )}
        {view === "Test & trade" && selected && (
          <main className="at-content">
            <section className="at-panel">
              <h2>AI model access</h2>
              <p>
                Add your access key to power the architect and agent models. The
                key stays in page memory and is sent only when you request a
                model response. Reloading clears it.
              </p>
              <label>
                Model access key
                <input
                  type="password"
                  autoComplete="off"
                  placeholder="Paste your AI access key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </label>
              <span className="at-connection">
                {apiKey
                  ? "Personal key entered"
                  : status.inference
                    ? "Platform model access configured"
                    : "Platform model access awaits configuration"}
              </span>
            </section>
            <section className="at-panel">
              <h2>Connections</h2>
              {[
                {
                  name: "Live model catalogue",
                  value: catalogue.length
                    ? `${catalogue.length} models available`
                    : "Loading",
                },
                {
                  name: "Marketplace database",
                  value: status.database ? "Configured" : "Awaiting setup",
                },
                {
                  name: "Live swap routing",
                  value: status.trading ? "Configured" : "Awaiting setup",
                },
                {
                  name: "Rental payments",
                  value:
                    status.network === "devnet"
                      ? "Devnet / test SOL"
                      : "Mainnet / real SOL",
                },
                {
                  name: "Live swaps",
                  value: "Mainnet / real SOL / wallet approval",
                },
              ].map((c) => (
                <div className="at-connection-row" key={c.name}>
                  <span>{c.name}</span>
                  <span>{c.value}</span>
                </div>
              ))}
            </section>
            <section className="at-panel">
              <h2>Saved draft</h2>
              <p>
                Your unsaved blueprint and builder conversation are saved in
                this browser. Access keys are not saved.
              </p>
              <button
                className="at-outline"
                onClick={() => {
                  setPlan(defaultPlan);
                  setMessages([]);
                  localStorage.removeItem("avelis-draft-v1");
                  setNotice("Draft cleared.");
                }}
              >
                Clear this browser’s draft
              </button>
            </section>
          </main>
        )}
      </div>
      {modal && (
        <div className="at-backdrop" onClick={() => !busy && setModal(null)}>
          <div
            className={
              "at-modal " + (modal === "models" ? "at-model-modal" : "")
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="at-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="at-close"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <X size={19} />
            </button>
            {modal === "models" ? (
              <>
                <span className="av-eyebrow">CHOOSE YOUR INTELLIGENCE</span>
                <h2 id="at-dialog-title">
                  A model for{" "}
                  {pickStage === "architect"
                    ? "your architect"
                    : pickStage === "execution"
                      ? "execution planning"
                      : pickStage}
                  .
                </h2>
                <p>
                  Compare capabilities, context, and pricing from the live
                  catalogue.
                </p>
                <label className="at-model-search">
                  <Search size={17} />
                  <input
                    aria-label="Search AI models"
                    placeholder="Search by model or provider"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                  />
                </label>
                <div className="at-provider-tabs">
                  {[
                    "all",
                    "openai",
                    "anthropic",
                    "google",
                    "deepseek",
                    "qwen",
                    "x-ai",
                  ].map((p) => (
                    <button
                      className={providerFilter === p ? "active" : ""}
                      key={p}
                      onClick={() => setProviderFilter(p)}
                    >
                      {p === "all"
                        ? "All models"
                        : p === "x-ai"
                          ? "xAI"
                          : p[0].toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="at-model-list">
                  {displayModels.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (pickStage === "architect") setArchitect(m.id);
                        else
                          setPlan({
                            ...plan,
                            models: { ...plan.models, [pickStage]: m.id },
                          });
                        setModal(null);
                      }}
                    >
                      <ProviderIcon provider={m.provider} />
                      <div>
                        <strong>{m.name}</strong>
                        <small>
                          {Math.round(m.context / 1000)}k context · $
                          {m.inputPrice.toFixed(2)} input / $
                          {m.outputPrice.toFixed(2)} output per 1M tokens
                        </small>
                        <span>
                          {m.reasoning ? "Reasoning · " : ""}
                          {m.tools ? "Tool support" : "Text generation"}
                        </span>
                      </div>
                      {(pickStage === "architect"
                        ? architect
                        : plan.models[pickStage as keyof Plan["models"]]) ===
                      m.id ? (
                        <Check size={17} />
                      ) : (
                        <Plus size={15} />
                      )}
                    </button>
                  ))}
                  {!displayModels.length && <p>No models match this search.</p>}
                </div>
                <small className="at-footnote">
                  Availability and prices may change. A model’s capabilities do
                  not guarantee trading performance. Showing up to 100 matching
                  models; narrow your search for more.
                </small>
              </>
            ) : modal === "login" ? (
              <>
                <img className="at-login-logo" src="/avelis-logo.png" alt="" />
                <h2 id="at-dialog-title">Your intelligence starts here.</h2>
                <p>
                  Sign a one-time message to create your AgentRouter session. No
                  payment or trade is requested.
                </p>
                <button
                  className="av-button at-full"
                  disabled={busy || !status.database}
                  onClick={login}
                >
                  <Wallet size={17} />
                  {busy
                    ? "Waiting for your signature…"
                    : "Continue with Solana"}
                </button>
                {!status.database && (
                  <small className="at-footnote">
                    Wallet sign-in is waiting for the marketplace database
                    connection. You can build a draft with your own model access
                    key in Settings.
                  </small>
                )}
              </>
            ) : (
              selected && (
                <>
                  <span className="av-eyebrow">RENT INTELLIGENCE</span>
                  <h2 id="at-dialog-title">{selected.name}</h2>
                  <p>{selected.description}</p>
                  <label>
                    Hours of access
                    <input
                      type="number"
                      min={1}
                      max={168}
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                    />
                  </label>
                  <div className="at-rental-total">
                    <span>Total rental fee</span>
                    <strong>
                      {(
                        (Number(selected.hourly_lamports) * hours) /
                        1e9
                      ).toFixed(6)}{" "}
                      SOL
                    </strong>
                  </div>
                  <p className="at-footnote">
                    Paid directly to the creator on {status.network}. Trading
                    funds stay separate in your wallet. Live swaps use real
                    mainnet assets and require your approval. Access starts
                    after payment verification.
                  </p>
                  <button
                    className="av-button at-full"
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
                            const order = await api("/api/rentals", {
                              agentId: selected.id,
                              payer: address,
                              hours,
                            });
                            const tx = Transaction.from(
                              Uint8Array.from(atob(order.transaction), (c) =>
                                c.charCodeAt(0),
                              ),
                            );
                            const payment =
                              await walletProvider().signAndSendTransaction(tx);
                            try {
                              await new Connection(
                                process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
                                  "https://api.devnet.solana.com",
                                "confirmed",
                              ).confirmTransaction(
                                payment.signature,
                                "confirmed",
                              );
                              await api("/api/rentals", {
                                id: order.id,
                                signature: payment.signature,
                              });
                            } catch {
                              throw new Error(
                                `Payment sent: ${payment.signature}. Open Rentals and verify this signature. Do not pay again.`,
                              );
                            }
                            setModal(null);
                            setView("Rentals");
                          })
                    }
                  >
                    {busy
                      ? "Confirming…"
                      : session
                        ? "Approve rental in wallet"
                        : "Sign in to rent"}
                    <Wallet size={16} />
                  </button>
                </>
              )
            )}
            {notice && (
              <p className="at-modal-error" role="alert">
                {notice}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function Empty({
  title,
  text,
  button,
  onClick,
  loading,
}: {
  title: string;
  text?: string;
  button?: string;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="at-empty">
      {loading ? (
        <LoaderCircle className="spin" size={25} />
      ) : (
        <Layers size={25} />
      )}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {button && (
        <button className="at-outline" onClick={onClick}>
          {button}
          <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  );
}
