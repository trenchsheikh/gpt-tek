"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getSession, signIn, signOut } from "next-auth/react";
import { Transaction, VersionedTransaction, Connection } from "@solana/web3.js";
import bs58 from "bs58";
import { ChatText, Thinking } from "./chat-text";
import AgentAvatar, { avatarNames } from "./agent-avatar";
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
import { journey, markets } from "@/lib/builder-journey";
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
  avatar?: number;
  avatar_color?: string;
  hourly_agent?: string | number;
  risk?: { maxTradeUsd?: number; slippageBps?: number; stopLossPct?: number };
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
type SavedChat = { id: string; title: string; updated_at: string };
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
let chosenWallet: "Phantom" | "Solflare" = "Phantom";
function walletProvider() {
  const w = window as unknown as {
    phantom?: { solana: Provider };
    solana?: Provider;
    solflare?: Provider;
  };
  const p =
    chosenWallet === "Solflare" ? w.solflare : w.phantom?.solana || w.solana;
  if (!p)
    throw new Error(
      "Open this site in your wallet browser, or install the selected wallet extension.",
    );
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
    tokenPayments: false,
    builder: false,
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
  const [chatId, setChatId] = useState<string | null>(null);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [moreChats, setMoreChats] = useState(false);
  const [choices, setChoices] = useState<string[]>([]);
  const [chatStep, setChatStep] = useState(0);
  const [chatNotice, setChatNotice] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [animateReply, setAnimateReply] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [modelReasons, setModelReasons] = useState<Record<string, string>>({});
  const [chatBusy, setChatBusy] = useState(false);
  const [architect, setArchitect] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [wallet, setWallet] = useState("");
  const [price, setPrice] = useState(10);
  const [avatar, setAvatar] = useState(0);
  const [avatarColor, setAvatarColor] = useState("#bba7f5");
  const [configTab, setConfigTab] = useState("Identity");
  const [hours, setHours] = useState(4);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<
    "models" | "login" | "rent" | "wallet" | null
  >(null);
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
  const serial = useRef(0);
  const chatEnd = useRef<HTMLDivElement>(null);
  const previousView = useRef("Build");
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
    // A visit starts a new conversation; previous chats remain in the sidebar.
    localStorage.removeItem("avelis-draft-v1");
  }, []);
  useEffect(() => {
    setSavedChats([]);
    setMoreChats(false);
    if (session?.user) loadChats();
  }, [session]);
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);
  useEffect(() => {
    if (view === "Build" && previousView.current !== "Build") newChat();
    previousView.current = view;
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
  async function loadChats(offset = 0) {
    try {
      const result = await api(`/api/chats?offset=${offset}`);
      setSavedChats((p) => (offset ? [...p, ...result.chats] : result.chats));
      setMoreChats(result.hasMore);
    } catch {
      setChatNotice("History couldn’t load. Try again.");
    }
  }
  function newChat() {
    if (chatBusy) return;
    setChatId(null);
    setMessages([]);
    setChoices([]);
    setChatStep(0);
    setPlan(defaultPlan);
    setModelReasons({});
    setDraft("");
    setChatNotice("");
    setAnimateReply(false);
    setHistoryOpen(false);
    setConfigTab("Identity");
  }
  async function openChat(id: string) {
    if (chatBusy || historyBusy) return;
    setHistoryBusy(true);
    try {
      const c = await api(`/api/chats?id=${id}`);
      setChatId(c.id);
      setMessages(c.messages);
      setChoices(c.choices);
      setChatStep(c.step);
      setPlan(c.plan || defaultPlan);
      setModelReasons(c.reasons || {});
      setAnimateReply(false);
      setDraft("");
      setChatNotice("");
      setHistoryOpen(false);
    } catch {
      setChatNotice("Conversation couldn’t load. Try again.");
    } finally {
      setHistoryBusy(false);
    }
  }
  async function send(text = draft, choice?: string) {
    if (!text.trim() || chatBusy || historyBusy) return;
    if (!session?.user) {
      setModal("login");
      return;
    }
    setChatBusy(true);
    setChatNotice("");
    setPendingMessage(text);
    setAnimateReply(false);
    const next = [...messages, { role: "user" as const, content: text }];
    const id = chatId || crypto.randomUUID();
    const started = Date.now();
    try {
      const r = await api("/api/builder", {
        messages: next.slice(-20),
        plan,
        chatId: id,
        choice,
      });
      const proposed = r.plan ? planSchema.parse(r.plan) : null;
      if (
        proposed &&
        !Object.values(proposed.models).every((model) =>
          catalogue.some((m) => m.id === model),
        )
      )
        throw new Error("Invalid blueprint");
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(0, 1800 - (Date.now() - started))),
        );
      setChatId(id);
      setMessages([...next, { role: "assistant", content: r.output }]);
      setChoices(r.choices || []);
      setChatStep(r.step || 0);
      setDraft("");
      setAnimateReply(true);
      if (proposed) {
        setPlan(proposed);
        setModelReasons(r.reasons || {});
        setConfigTab("Models");
      }
      await loadChats();
    } catch {
      // Keep unsuccessful turns out of the conversation and database.
      setChatNotice("Couldn’t send. Your message is ready to retry.");
      if (!choice) setDraft(text);
    } finally {
      setChatBusy(false);
      setPendingMessage("");
    }
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
        hourlyAgent: price,
        avatar,
        avatarColor,
        wallet: address,
        listed: false,
        plan: validated,
      });
      const a = {
        id: r.id,
        ...plan,
        plan: validated,
        wallet: address,
        hourly_lamports: "0",
        hourly_agent: price,
        avatar,
        avatar_color: avatarColor,
      };
      setSelected(a);
      setView("My agents");
      setRuns([]);
      setNotice("Agent saved. Open Test & manage to test and publish it.");
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
            <button className="at-outline" onClick={() => setModal("wallet")}>
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
            <aside
              className={"ar-chat-history " + (historyOpen ? "open" : "")}
              aria-label="Saved conversations"
            >
              <button
                className="ar-history-close"
                aria-label="Close history"
                onClick={() => setHistoryOpen(false)}
              >
                <X size={15} />
              </button>
              <button
                className="ar-new-chat"
                onClick={newChat}
                disabled={chatBusy || historyBusy}
              >
                <Plus size={16} /> New chat
              </button>
              <div className="ar-history-list">
                {savedChats.map((c) => (
                  <button
                    key={c.id}
                    title={c.title}
                    aria-current={chatId === c.id ? "true" : undefined}
                    disabled={chatBusy || historyBusy}
                    onClick={() => openChat(c.id)}
                  >
                    {c.title}
                  </button>
                ))}
                {!savedChats.length && (
                  <p>
                    {session?.user
                      ? "Your conversations will appear here."
                      : "Sign in to save conversations."}
                  </p>
                )}
                {moreChats && (
                  <button onClick={() => loadChats(savedChats.length)}>
                    Load older chats
                  </button>
                )}
              </div>
              <button
                className="ar-history-refresh"
                onClick={() => loadChats()}
                disabled={!session?.user || chatBusy}
              >
                Refresh history
              </button>
            </aside>
            <section className="at-chat">
              <div className="at-chat-header">
                <div>
                  <button
                    className="ar-history-toggle"
                    aria-label="Toggle chat history"
                    aria-expanded={historyOpen}
                    onClick={() => setHistoryOpen(!historyOpen)}
                  >
                    <PanelLeftClose size={16} />
                  </button>
                  <strong className="ar-section-label">Agent builder</strong>
                </div>
                <span className="ar-builder-provider">Strategy architect</span>
              </div>
              <div className="at-messages">
                {!messages.length ? (
                  <div className="at-chat-welcome">
                    <img src="/avelis-logo.png" alt="" />
                    <h2>What should your agent do?</h2>
                    <p>
                      Pick your market. We’ll map the playbook, dial in risk and
                      choose the right model for each job, with a reason for
                      every pick.
                    </p>
                    <div className="at-starters">
                      {markets.map((t) => (
                        <button
                          key={t}
                          onClick={() =>
                            send(`I want to build an agent for ${t}.`)
                          }
                        >
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
                        <ChatText
                          text={m.content}
                          animate={
                            animateReply &&
                            m.role === "assistant" &&
                            i === messages.length - 1
                          }
                        />
                      </div>
                    </article>
                  ))
                )}
                {pendingMessage && (
                  <article className="at-message user">
                    <span>You</span>
                    <div>{pendingMessage}</div>
                  </article>
                )}
                {chatBusy && <Thinking />}
                {!!choices.length && !chatBusy && (
                  <div
                    className="ar-chat-choices"
                    aria-label="Choose your agent preferences"
                  >
                    {choices.map((c) => (
                      <button
                        key={c}
                        disabled={historyBusy}
                        onClick={() => send(c, c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
                {messages.length > 0 && (
                  <div className="ar-journey-progress">
                    {chatStep < journey.length
                      ? `Step ${chatStep + 1} of ${journey.length} · Refine your blueprint`
                      : "Blueprint ready · Refine it or save your agent"}
                  </div>
                )}
                {chatNotice && (
                  <div className="ar-chat-notice" role="status">
                    {chatNotice}
                    <button
                      aria-label="Dismiss chat notice"
                      onClick={() => setChatNotice("")}
                    >
                      <X size={12} />
                    </button>
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
                  maxLength={3000}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <div>
                  <span>
                    {chatBusy
                      ? "Architect is thinking…"
                      : "Strategy and model selection"}
                  </span>
                  <button
                    aria-label="Send message"
                    disabled={
                      chatBusy ||
                      historyBusy ||
                      !draft.trim() ||
                      !status.builder
                    }
                  >
                    <ArrowUp size={18} />
                  </button>
                </div>
              </form>
            </section>
            <section className="at-configuration">
              <div className="at-config-title">
                <span className="av-eyebrow">YOUR AGENT BLUEPRINT</span>
                <span className="at-pill">
                  {chatBusy
                    ? "Reviewing"
                    : plan.name
                      ? "Configured"
                      : "New agent"}
                </span>
              </div>

              <div className="ar-config-tabs">
                {["Identity", "Models", "Strategy"].map((t) => (
                  <button
                    key={t}
                    aria-pressed={configTab === t}
                    className={configTab === t ? "active" : ""}
                    onClick={() => setConfigTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="ar-config-body">
                {configTab === "Identity" && (
                  <>
                    <div className="ar-avatar-preview">
                      <AgentAvatar variant={avatar} color={avatarColor} />
                      <span>
                        {plan.name || "Your agent"}
                        <small>Make it yours</small>
                      </span>
                    </div>
                    <div className="ar-avatar-picker">
                      {avatarNames.map((n, i) => (
                        <button
                          key={n}
                          aria-label={n}
                          aria-pressed={avatar === i}
                          className={avatar === i ? "active" : ""}
                          onClick={() => setAvatar(i)}
                        >
                          <AgentAvatar variant={i} color={avatarColor} />
                        </button>
                      ))}
                    </div>
                    <div className="ar-color-picker">
                      {[
                        "#bba7f5",
                        "#d9fc91",
                        "#9ddde9",
                        "#f4d59f",
                        "#efa9c2",
                        "#b3c8f5",
                      ].map((c) => (
                        <button
                          key={c}
                          aria-label={`Colour ${c}`}
                          aria-pressed={avatarColor === c}
                          style={{ background: c }}
                          onClick={() => setAvatarColor(c)}
                        />
                      ))}
                      <input
                        type="color"
                        aria-label="Custom avatar colour"
                        value={avatarColor}
                        onChange={(e) => setAvatarColor(e.target.value)}
                      />
                    </div>
                    <label>
                      Agent name
                      <input
                        value={plan.name}
                        placeholder="Name your intelligence"
                        maxLength={60}
                        onChange={(e) =>
                          setPlan({ ...plan, name: e.target.value })
                        }
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
                    <label>
                      Category
                      <select
                        value={plan.category}
                        onChange={(e) =>
                          setPlan({
                            ...plan,
                            category: e.target.value as Plan["category"],
                          })
                        }
                      >
                        {[
                          "Research",
                          "Momentum",
                          "DeFi",
                          "Risk management",
                          "Trenches",
                          "Prediction markets",
                        ].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Rental $AGENT / hour
                      <input
                        type="number"
                        min={0.000001}
                        max={1000000}
                        step={1}
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                      />
                    </label>
                  </>
                )}
                {configTab === "Models" && (
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
                          {modelReasons[s] && (
                            <p
                              className="ar-model-reason"
                              title={modelReasons[s]}
                            >
                              {modelReasons[s]}
                            </p>
                          )}
                        </div>
                        <ProviderIcon provider={plan.models[s].split("/")[0]} />
                        <ChevronDown size={12} />
                      </button>
                    ))}
                  </div>
                )}
                {configTab === "Strategy" && (
                  <>
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
                            setPlan({
                              ...plan,
                              maxTradeUsd: Number(e.target.value),
                            })
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
                            setPlan({
                              ...plan,
                              stopLossPct: Number(e.target.value),
                            })
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
                            setPlan({
                              ...plan,
                              slippageBps: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>
              <button
                className="av-button at-full"
                disabled={
                  busy ||
                  chatBusy ||
                  (messages.length > 0 && chatStep < journey.length)
                }
                title={
                  messages.length > 0 && chatStep < journey.length
                    ? "Finish the conversation steps to save your agent"
                    : undefined
                }
                onClick={save}
              >
                Save agent <ArrowUpRight size={16} />
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
                {[
                  "All",
                  "Research",
                  "Momentum",
                  "DeFi",
                  "Risk management",
                  "Trenches",
                  "Prediction markets",
                ].map((c) => (
                  <button
                    key={c}
                    className={category === c ? "active" : ""}
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
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
                          <AgentAvatar
                            variant={a.avatar}
                            color={a.avatar_color}
                            label={`${a.name} avatar`}
                          />
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
                          <strong>{Number(a.hourly_agent || 0)} $AGENT</strong>{" "}
                          / hr
                        </span>
                      </div>
                      <button
                        className="at-outline at-full"
                        onClick={() =>
                          view === "Marketplace"
                            ? (setSelected(a), setView("Agent details"))
                            : openAgent(a)
                        }
                      >
                        {view === "Marketplace"
                          ? "Preview agent"
                          : "Test & manage"}
                        <ArrowUpRight size={15} />
                      </button>
                      {view === "My agents" && !a.listed && (
                        <button
                          className="at-outline at-full"
                          disabled={busy}
                          onClick={() =>
                            action(async () => {
                              await api(
                                "/api/agents",
                                { id: a.id, listed: true },
                                "PATCH",
                              );
                              await refresh();
                              setNotice("Agent listed on the marketplace.");
                            })
                          }
                        >
                          List for rental <ArrowUpRight size={14} />
                        </button>
                      )}
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
        {view === "Agent details" && selected && (
          <main className="at-content ar-agent-detail">
            <button className="av-link" onClick={() => setView("Marketplace")}>
              <ArrowLeft size={16} />
              Marketplace
            </button>
            <div className="ar-detail-hero">
              <AgentAvatar
                variant={selected.avatar}
                color={selected.avatar_color}
              />
              <div>
                <span className="at-pill">{selected.category}</span>
                <h1>{selected.name}</h1>
                <p>{selected.description}</p>
              </div>
              <div className="ar-detail-price">
                <strong>{Number(selected.hourly_agent || 0)} $AGENT</strong>
                <span>per hour</span>
                <button className="av-button" onClick={() => setModal("rent")}>
                  Rent this agent <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
            <div className="ar-detail-grid">
              <section className="at-panel">
                <h2>Model lineup</h2>
                {stages.map((s) => (
                  <div className="ar-detail-model" key={s}>
                    <ProviderIcon
                      provider={
                        (
                          selected.models?.[s] ||
                          selected.plan?.models[s] ||
                          ""
                        ).split("/")[0]
                      }
                    />
                    <span>
                      {s === "execution" ? "Execution planning" : s}
                      <strong>
                        {modelName(
                          selected.models?.[s] ||
                            selected.plan?.models[s] ||
                            "",
                        )}
                      </strong>
                    </span>
                  </div>
                ))}
              </section>
              <section className="at-panel">
                <h2>Rental details</h2>
                <p>
                  1–168 hours of access. Payment goes directly to the creator.
                  Trading funds remain in your wallet.
                </p>
                <div className="ar-card-risk">
                  <span>
                    {selected.paper_samples || 0} recorded forward tests
                  </span>
                  <span>
                    Max $
                    {selected.risk?.maxTradeUsd ||
                      selected.plan?.maxTradeUsd ||
                      "—"}{" "}
                    per trade
                  </span>
                  <span>
                    {selected.risk?.slippageBps ||
                      selected.plan?.slippageBps ||
                      "—"}{" "}
                    bps slippage
                  </span>
                  <span>
                    {selected.risk?.stopLossPct ||
                      selected.plan?.stopLossPct ||
                      "—"}
                    % paper loss limit
                  </span>
                </div>
                <small className="at-footnote">
                  Tests are observations, not a guarantee of future returns.
                  Live execution currently supports wallet-approved SOL/USDC
                  swaps.
                </small>
              </section>
            </div>
            <section className="at-panel">
              <h2>Your trading platforms</h2>
              <p className="at-footnote">
                Open a platform below. Direct agent connections require a
                supported integration and are not enabled yet.
              </p>
              <div className="ar-detail-terminals">
                {[
                  {
                    name: "Axiom",
                    url: "https://axiom.trade",
                    logo: "axiom.svg",
                  },
                  { name: "GMGN", url: "https://gmgn.ai", logo: "gmgn.ico" },
                  {
                    name: "Pump Terminal",
                    url: "https://trade.padre.gg",
                    logo: "pump.svg",
                  },
                  {
                    name: "Fomo",
                    url: "https://fomo.family",
                    logo: "fomo.svg",
                  },
                  {
                    name: "Polymarket",
                    url: "https://polymarket.com",
                    logo: "polymarket.svg",
                  },
                  {
                    name: "Kalshi",
                    url: "https://kalshi.com",
                    logo: "kalshi.png",
                  },
                ].map((t) => (
                  <a
                    key={t.name}
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="at-outline"
                  >
                    <img src={`/terminals/${t.logo}`} alt="" />
                    {t.name}
                    <ArrowUpRight size={14} />
                  </a>
                ))}
              </div>
            </section>
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
            <div className="at-page-heading">
              <div>
                <span className="av-eyebrow">
                  TEST THE THINKING. REVIEW THE TRADE.
                </span>
                <h1>{selected.name}</h1>
                <p>SOL / USDC · Four model roles · Wallet-approved execution</p>
              </div>
              <button
                className="at-outline"
                onClick={() => setView("My agents")}
              >
                <ArrowLeft size={15} /> My agents
              </button>
            </div>
            <div className="at-test-layout">
              <section className="at-test-main">
                <div className="at-panel">
                  <div className="at-panel-heading">
                    <div>
                      <span className="av-eyebrow">FORWARD PAPER TEST</span>
                      <h2>Evidence before execution.</h2>
                    </div>
                    <FlaskConical size={23} />
                  </div>
                  <p>
                    Start with $10,000 simulated cash. Each test uses a fresh
                    SOL spot price, records the model decision, and applies a 10
                    bps simulated fee. These are forward observations, not
                    historical backtests.
                  </p>
                  <div className="at-metrics">
                    <div>
                      <small>Paper equity</small>
                      <strong>
                        $
                        {Number(runs[0]?.equity ?? 10000).toLocaleString(
                          undefined,
                          { maximumFractionDigits: 2 },
                        )}
                      </strong>
                    </div>
                    <div>
                      <small>Recorded samples</small>
                      <strong>{runs.length}</strong>
                    </div>
                    <div>
                      <small>Simulated return</small>
                      <strong>
                        {(
                          (Number(runs[0]?.equity ?? 10000) / 10000 - 1) *
                          100
                        ).toFixed(2)}
                        %
                      </strong>
                    </div>
                  </div>
                  <div className="at-actions">
                    <button
                      className="av-button"
                      disabled={busy}
                      onClick={() =>
                        action(async () => {
                          await api("/api/paper", {
                            agentId: selected.id,
                            apiKey: apiKey || undefined,
                          });
                          setRuns(
                            await api("/api/paper?agentId=" + selected.id),
                          );
                        })
                      }
                    >
                      {busy ? (
                        <LoaderCircle className="spin" size={16} />
                      ) : (
                        <FlaskConical size={16} />
                      )}{" "}
                      Run a forward test
                    </button>
                    {selected.plan && (
                      <button
                        className="at-outline"
                        disabled={busy || runs.length < 5}
                        onClick={() =>
                          action(async () => {
                            await api(
                              "/api/agents",
                              { id: selected.id, listed: true },
                              "PATCH",
                            );
                            setSelected({ ...selected, listed: true });
                            setNotice(
                              "Your tested agent is listed on the marketplace.",
                            );
                          })
                        }
                      >
                        {selected.listed ? "Published" : "Publish agent"}{" "}
                        <ArrowUpRight size={15} />
                      </button>
                    )}
                  </div>
                  {runs[0] && (
                    <div className="at-reports">
                      {["research", "reasoning", "decision", "execution"].map(
                        (s) => (
                          <details key={s}>
                            <summary>
                              {s === "execution"
                                ? "Execution planning"
                                : s[0].toUpperCase() + s.slice(1)}{" "}
                              <ChevronDown size={13} />
                            </summary>
                            <p>
                              {
                                runs[0].report[
                                  s as keyof Run["report"]
                                ] as string
                              }
                            </p>
                          </details>
                        ),
                      )}
                    </div>
                  )}
                </div>
                <div className="at-panel">
                  <h2>Recorded paper activity</h2>
                  {!runs.length ? (
                    <p>Your first forward sample will appear here.</p>
                  ) : (
                    <div className="at-table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Decision</th>
                            <th>SOL price</th>
                            <th>Trade size</th>
                            <th>Equity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {runs.map((r) => (
                            <tr key={r.id}>
                              <td>
                                {new Date(r.created_at).toLocaleTimeString()}
                              </td>
                              <td>
                                <span className={"at-action-label " + r.action}>
                                  {r.action}
                                </span>
                              </td>
                              <td>${Number(r.price).toFixed(2)}</td>
                              <td>${Number(r.amount_usd).toFixed(2)}</td>
                              <td>${Number(r.equity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
              <section className="at-live-panel at-panel">
                <div className="at-panel-heading">
                  <span className="av-eyebrow">LIVE MAINNET TRADING</span>
                  <ShieldCheck size={21} />
                </div>
                <h2>
                  Your wallet.
                  <br />
                  Your final say.
                </h2>
                <p>
                  Ask your agent to analyse your SOL and USDC balances. Review
                  its recommendation, get a live quote, then sign in your wallet
                  to execute.
                </p>
                <div className="at-live-steps">
                  <span>
                    <i>1</i> Generate a decision
                  </span>
                  <span>
                    <i>2</i> Review the live quote
                  </span>
                  <span>
                    <i>3</i> Approve in your wallet
                  </span>
                </div>
                <button
                  className="at-outline at-full"
                  disabled={busy}
                  onClick={() =>
                    action(async () => {
                      const address = wallet || (await connect());
                      setQuote(null);
                      setDecision(
                        await api("/api/decide", {
                          agentId: selected.id,
                          wallet: address,
                          apiKey: apiKey || undefined,
                        }),
                      );
                    })
                  }
                >
                  {busy ? "Analysing…" : "Analyse connected wallet"}{" "}
                  <BrainCircuit size={16} />
                </button>
                {decision && (
                  <div className="at-decision">
                    <span
                      className={"at-action-label " + decision.decision.action}
                    >
                      {decision.decision.action}
                    </span>
                    <strong>${decision.decision.amountUsd.toFixed(2)}</strong>
                    <p>{decision.decision.reason}</p>
                    <small>
                      SOL ${decision.snapshot.price.toFixed(2)} ·
                      Wallet-controlled
                    </small>
                    {decision.decision.action !== "hold" && (
                      <button
                        className="av-button at-full"
                        disabled={busy}
                        onClick={() =>
                          action(async () => {
                            const address = wallet || (await connect());
                            setQuote(
                              await api("/api/trade", {
                                agentId: selected.id,
                                wallet: address,
                                action: decision.decision.action,
                                amountUsd: decision.decision.amountUsd,
                              }),
                            );
                            setQuoteTime(Date.now());
                          })
                        }
                      >
                        Get live swap quote <ArrowUpRight size={15} />
                      </button>
                    )}
                  </div>
                )}
                {quote && (
                  <div className="at-quote">
                    <h3>Review before signing</h3>
                    <p>
                      {quote.action === "buy"
                        ? "Buy SOL with USDC"
                        : "Sell SOL for USDC"}{" "}
                      · ${quote.amountUsd.toFixed(2)}
                    </p>
                    <p>
                      Slippage limit: {(quote.slippageBps / 100).toFixed(2)}%
                      <br />
                      Quote expires after 60 seconds. Network and routing fees
                      apply.
                    </p>
                    <button
                      className="av-button at-full"
                      disabled={busy}
                      onClick={() =>
                        action(async () => {
                          if (Date.now() - quoteTime > 60000)
                            throw new Error(
                              "Quote expired. Request a fresh quote.",
                            );
                          const signed = await walletProvider().signTransaction(
                            VersionedTransaction.deserialize(
                              Uint8Array.from(atob(quote.transaction), (c) =>
                                c.charCodeAt(0),
                              ),
                            ),
                          );
                          const signedTransaction = btoa(
                            String.fromCharCode(...signed.serialize()),
                          );
                          const r = await api("/api/trade", {
                            id: quote.id,
                            signedTransaction,
                          });
                          setQuote(null);
                          setDecision(null);
                          setNotice(`Swap confirmed: ${r.signature}`);
                        })
                      }
                    >
                      <Wallet size={16} /> Approve live trade
                    </button>
                  </div>
                )}
                <small className="at-footnote">
                  Your main wallet is never given unattended signing access.
                  Every live swap requires approval. Stop-loss settings govern
                  paper tests; they do not create an on-chain stop order.
                </small>
              </section>
            </div>
          </main>
        )}
        {view === "Settings" && (
          <main className="at-content at-settings">
            <div className="at-page-heading">
              <div>
                <span className="av-eyebrow">MAKE IT YOURS</span>
                <h1>Workspace settings.</h1>
                <p>
                  Connect your model access and review your trading environment.
                </p>
              </div>
            </div>
            <section className="at-panel">
              <h2>AI model access</h2>
              <p>
                The architect is connected. Add a model access key for strategy
                tests. The key stays in page memory and is sent only when you
                request a model response. Reloading clears it.
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
                Your successful conversations and blueprints are saved privately
                to your account. Each visit starts a new chat. Access keys are
                not saved.
              </p>
              <button
                className="at-outline"
                onClick={() => {
                  newChat();
                  setNotice("New conversation started.");
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
            ) : modal === "login" || modal === "wallet" ? (
              <>
                <img className="at-login-logo" src="/avelis-logo.png" alt="" />
                <h2 id="at-dialog-title">
                  {modal === "wallet"
                    ? "Connect your wallet"
                    : "Sign in with your wallet"}
                </h2>
                <p>
                  {modal === "wallet"
                    ? "Choose a wallet to connect. Your funds stay in your wallet."
                    : "Sign a one-time message to create your AgentRouter session. No payment or trade is requested."}
                </p>
                <div className="ar-wallet-choices">
                  {["Phantom", "Solflare"].map((n) => (
                    <button
                      key={n}
                      className="at-outline"
                      disabled={busy || (modal === "login" && !status.database)}
                      onClick={() => {
                        chosenWallet = n as "Phantom" | "Solflare";
                        if (modal === "wallet")
                          action(async () => {
                            await connect();
                            setModal(null);
                          });
                        else login();
                      }}
                    >
                      <Wallet size={18} />
                      {n}
                    </button>
                  ))}
                </div>
                <p className="at-footnote">
                  On mobile, open AgentRouter inside the Phantom or Solflare app
                  browser.
                </p>
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
                  <AgentAvatar
                    variant={selected.avatar}
                    color={selected.avatar_color}
                  />
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
                        Number(selected.hourly_agent || 0) * hours
                      ).toLocaleString()}{" "}
                      $AGENT
                    </strong>
                  </div>
                  <p className="at-footnote">
                    Paid in $AGENT directly to the creator on {status.network}.
                    SOL covers network fees. Trading funds stay separate in your
                    wallet. Live swaps use real mainnet assets and require your
                    approval. Access starts after payment verification.
                  </p>
                  {!status.tokenPayments && (
                    <p className="ar-availability">
                      Token checkout opens when $AGENT is configured.
                    </p>
                  )}
                  <button
                    className="av-button at-full"
                    disabled={busy || !status.tokenPayments}
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
