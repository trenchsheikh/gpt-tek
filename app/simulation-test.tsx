"use client";
import { useEffect, useRef, useState } from "react";
import { X, FlaskConical } from "lucide-react";
import SimulationOffice from "./simulation-office";
import { ChatText } from "./chat-text";
import type { SimulationResult } from "@/lib/simulation";

export default function SimulationTest({
  id,
  plan,
}: {
  id?: string;
  plan?: unknown;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [variant, setVariant] = useState(0);
  const [reveal, setReveal] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    if (!result) {
      setReveal(0);
      return;
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReveal(4);
      return;
    }
    setReveal(0);
    const timers = [1800, 3600, 5800, 8000].map((delay, index) =>
      setTimeout(() => setReveal(index + 1), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [result]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        abort.current?.abort();
        setOpen(false);
        trigger.current?.focus();
      }
      if (event.key === "Tab") {
        const buttons = Array.from(
          dialog.current?.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ) || [],
        );
        if (event.shiftKey && document.activeElement === buttons[0]) {
          event.preventDefault();
          buttons.at(-1)?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === buttons.at(-1)
        ) {
          event.preventDefault();
          buttons[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);
  async function run() {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    const started = Date.now();
    setVariant(crypto.getRandomValues(new Uint32Array(1))[0] % 10000);
    setOpen(true);
    setBusy(true);
    setError("");
    setResult(null);
    setProgress(0);
    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { plan }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not run simulation.");
      // The office runs for at least ten seconds; slow calculations keep it alive.
      await new Promise<void>((resolve, reject) => {
        const finish = () => {
          controller.signal.removeEventListener("abort", cancel);
          resolve();
        };
        const cancel = () => {
          clearTimeout(timer);
          reject(new DOMException("Cancelled", "AbortError"));
        };
        const timer = setTimeout(
          finish,
          Math.max(0, 10000 - (Date.now() - started)),
        );
        controller.signal.addEventListener("abort", cancel, { once: true });
        if (controller.signal.aborted) cancel();
      });
      if (!controller.signal.aborted) {
        setProgress(1);
        setResult(data);
      }
    } catch (e) {
      if (!controller.signal.aborted) setError((e as Error).message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  const visible =
    result?.curve.slice(
      0,
      Math.max(1, Math.ceil(result.curve.length * progress)),
    ) || [];
  const point = visible.at(-1);
  const equity = progress === 1 ? result?.endingEquity : point?.equity;
  const low = result ? Math.min(100, ...result.curve.map((p) => p.equity)) : 0;
  const high = result ? Math.max(101, ...result.curve.map((p) => p.equity)) : 1;
  const points = visible
    .map(
      (p) =>
        `${(p.bar / (result!.bars - 1)) * 640},${170 - ((p.equity - low) / (high - low || 1)) * 150}`,
    )
    .join(" ");
  const close = () => {
    abort.current?.abort();
    setOpen(false);
    setBusy(false);
    trigger.current?.focus();
  };
  return (
    <>
      <button ref={trigger} className="at-outline" onClick={run}>
        <FlaskConical size={15} /> Test run
      </button>
      {open && (
        <div className="at-modal-backdrop">
          <div
            ref={dialog}
            className="ar-simulation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="simulation-title"
          >
            <button
              className="ar-simulation-close"
              onClick={close}
              aria-label="Close simulation"
            >
              <X size={19} />
            </button>
            <span className="av-eyebrow">STRATEGY LAB · SYNTHETIC DATA</span>
            <h2 id="simulation-title">Put your playbook to the test.</h2>
            <p className="ar-sim-subtitle">
              A generated scenario, not historical performance. No real funds or
              trades.
            </p>
            <small className="ar-sim-provenance">
              Gemini-powered simulation
            </small>
            {busy && <SimulationOffice key={variant} variant={variant} />}
            {error && (
              <div className="ar-chat-notice" role="alert">
                {error}
                <button className="at-outline" onClick={run}>
                  Try again
                </button>
              </div>
            )}
            {result && (
              <>
                <div className="ar-sim-progress">
                  <span>
                    {progress < 1
                      ? "Replaying simulated trades"
                      : "Scenario complete"}
                  </span>
                  <strong>{Math.round(progress * 100)}%</strong>
                  <progress value={progress} max={1} />
                </div>
                <p className="ar-result-narrative">
                  <ChatText
                    animate
                    text={`Your $100 starting balance finished at $${result.endingEquity.toFixed(2)} after ${result.tradeCount} closed trades. Net ${result.profit >= 0 ? "profit" : "loss"} was $${Math.abs(result.profit).toFixed(2)}, a ${Math.abs(result.returnPct).toFixed(2)}% ${result.returnPct >= 0 ? "gain" : "decline"} after trading costs. ${result.tradeCount ? "The result comes from the recorded trade P&L on this generated path." : "The entry rules did not trigger any trades in this scenario."}`}
                  />
                </p>
                <div className="ar-result-stage">
                  <div className="ar-sim-metrics">
                    <div>
                      <small>Starting capital</small>
                      <strong>$100.00</strong>
                    </div>
                    <div>
                      <small>Ending equity</small>
                      <strong>${(equity || 100).toFixed(2)}</strong>
                    </div>
                    <div>
                      <small>Net return</small>
                      <strong
                        className={
                          (equity || 100) >= 100 ? "ar-gain" : "ar-loss"
                        }
                      >
                        {((equity || 100) - 100).toFixed(2)}%
                      </strong>
                    </div>
                    <div>
                      <small>Closed trades</small>
                      <strong>{point?.trades || 0}</strong>
                    </div>
                  </div>
                </div>
                {reveal >= 1 && (
                  <div className="ar-result-stage">
                    <svg
                      className="ar-sim-chart"
                      viewBox="0 0 640 190"
                      role="img"
                      aria-label="Simulated equity curve"
                    >
                      <line
                        x1="0"
                        y1={170 - ((100 - low) / (high - low || 1)) * 150}
                        x2="640"
                        y2={170 - ((100 - low) / (high - low || 1)) * 150}
                        stroke="currentColor"
                        opacity=".2"
                        strokeDasharray="5 5"
                      />
                      <polyline
                        points={points}
                        fill="none"
                        stroke="var(--sim-line)"
                        strokeWidth="3"
                      />
                    </svg>
                    <p className="ar-result-narrative">
                      <ChatText
                        animate
                        text={`The equity curve tracks account value through ${result.bars.toLocaleString()} synthetic market steps, including open-position moves. Maximum drawdown was ${result.drawdown.toFixed(2)}% from a previous equity peak. ${result.drawdown > 15 ? "This path exposed substantial downside; review position sizing and exit rules before relying on the strategy." : "This figure describes the worst peak-to-trough decline observed in this scenario, not a guaranteed future risk limit."}`}
                      />
                    </p>
                  </div>
                )}
                {reveal >= 2 && progress === 1 && (
                  <>
                    <div className="ar-sim-score">
                      <strong>
                        {result.score}
                        <small>/100</small>
                      </strong>
                      <div>
                        <b>Scenario score</b>
                        <p>
                          <ChatText
                            animate
                            text={`Sample size: ${result.scoreBreakdown.sample.toFixed(1)}/20. Drawdown control: ${result.scoreBreakdown.risk.toFixed(1)}/40. Net return: ${result.scoreBreakdown.performance.toFixed(1)}/40. ${result.tradeCount ? "The total is rounded to a scenario score, not a prediction or ranking across different market paths." : "With no trades, the final score is zero regardless of the component values."}`}
                          />
                        </p>
                      </div>
                    </div>
                    <div className="ar-sim-metrics">
                      <div>
                        <small>Net P&amp;L</small>
                        <b>${result.profit.toFixed(2)}</b>
                      </div>
                      <div>
                        <small>Max drawdown</small>
                        <b>{result.drawdown.toFixed(2)}%</b>
                      </div>
                      <div>
                        <small>Win rate</small>
                        <b>{result.winRate.toFixed(1)}%</b>
                      </div>
                      <div>
                        <small>Trading costs</small>
                        <b>${result.fees.toFixed(2)}</b>
                      </div>
                    </div>
                    <p className="ar-result-narrative">
                      <ChatText
                        animate
                        text={`${result.trades.filter((t) => t.pnl > 0).length} trades closed in profit and ${result.trades.filter((t) => t.pnl < 0).length} closed at a loss. Total simulated costs were $${result.fees.toFixed(2)}. Win rate alone does not show profitability: the size of wins, losses and costs determines the net result.`}
                      />
                    </p>
                  </>
                )}
                {reveal >= 3 && (
                  <div className="ar-result-stage">
                    <div className="ar-sim-rules">
                      <b>
                        {result.market} · {result.rules.approach}
                      </b>
                      <p>
                        <ChatText animate text={result.rules.explanation} />
                      </p>
                      <p>
                        <ChatText
                          animate
                          text={`This ${result.rules.approach} proxy uses ${result.rules.lookback} prior steps and a ${(result.rules.threshold * 100).toFixed(2)}% entry threshold. It targets ${(result.rules.exposure * 100).toFixed(0)}% of available capital per position, capped by the blueprint trade limit. Positions exit at the blueprint stop, a ${(result.rules.takeProfit * 100).toFixed(1)}% take-profit move, or ${result.rules.holdingBars} steps. Stops use observed prices, so gaps can exceed the intended stop distance.`}
                        />
                      </p>
                    </div>
                  </div>
                )}
                {reveal >= 4 && (
                  <div className="ar-result-stage">
                    <details>
                      <summary>Rules, scoring and assumptions</summary>
                      <p>
                        Lookback {result.rules.lookback} steps · Threshold{" "}
                        {(result.rules.threshold * 100).toFixed(2)}% · Exposure{" "}
                        {(result.rules.exposure * 100).toFixed(0)}% · Holding
                        limit {result.rules.holdingBars} steps · Take profit{" "}
                        {(result.rules.takeProfit * 100).toFixed(1)}%
                      </p>
                      <ul>
                        {result.assumptions.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                      <p>
                        Seed: {result.seed}. Fresh runs use fresh scenarios.
                        These results do not count toward marketplace listing
                        tests.
                      </p>
                    </details>
                    <button
                      className="av-button"
                      onClick={run}
                      disabled={progress < 1}
                    >
                      Run a new scenario
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
