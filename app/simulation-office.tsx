"use client";
import { useEffect, useState } from "react";
import styles from "./simulation-office.module.css";

const chatter = [
  ["Found a signal", "Check the downside", "Test this entry", "Fees first"],
  [
    "New pair spotted",
    "Size stays capped",
    "Wait for confirmation",
    "Exit mapped",
  ],
  ["Reading the tape", "No chasing", "Compare the evidence", "Hold is a move"],
  [
    "Scenario loaded",
    "Protect the bankroll",
    "Question the setup",
    "Review the rules",
  ],
];
const paths = [
  "0,33 12,30 24,34 36,19 48,25 60,14 72,22 84,9 96,13",
  "0,12 12,18 24,9 36,22 48,18 60,32 72,23 84,31 96,19",
  "0,28 12,18 24,24 36,11 48,20 60,9 72,16 84,22 96,13",
  "0,21 12,29 24,14 36,20 48,9 60,17 72,28 84,18 96,25",
];
const colours = ["#bb9de6", "#dafa86", "#f0afc8", "#94c2ea"];
function Bot({ colour, variant }: { colour: string; variant: number }) {
  return (
    <svg viewBox="0 0 32 36" aria-hidden="true" shapeRendering="crispEdges">
      <path d="M6 4h20v4h4v16h-4v4H6v-4H2V8h4Z" fill={colour} />
      <path d="M6 12h20v12H6Z" fill="#302941" />
      <path
        d={
          variant % 2
            ? "M10 16h4v4h-4Zm8 0h4v4h-4Z"
            : "M8 16h6v3H8Zm10 0h6v3h-6Z"
        }
        fill="#fff9ec"
      />
      <path d="M10 28h4v6h-4Zm8 0h4v6h-4Z" fill={colour} />
      <path d="M14 0h4v4h-4Z" fill="#dafa86" />
    </svg>
  );
}

export default function SimulationOffice({ variant }: { variant: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  const phase = Math.floor(elapsed / 3);
  const waiting = elapsed >= 10;
  return (
    <div
      className={styles.scene}
      role="status"
      aria-label="Pixel trading office animation. Illustrative activity while your synthetic scenario is calculated."
    >
      <div className={styles.topline}>
        <span>
          <i /> STRATEGY LAB
        </span>
        <span>PIXEL WORKSPACE</span>
      </div>
      <div className={styles.office} aria-hidden="true">
        <div className={styles.wall}>
          <span>AGENTROUTER TRADING DESK</span>
          <div className={styles.board}>
            {[0, 1, 2].map((n) => (
              <svg key={n} viewBox="0 0 96 42">
                <path
                  d="M0 14H96M0 28H96"
                  stroke="currentColor"
                  opacity=".15"
                />
                <polyline
                  points={paths[(variant + n) % 4]}
                  fill="none"
                  stroke={colours[n]}
                  strokeWidth="2"
                  className={styles.chart}
                />
              </svg>
            ))}
          </div>
          <span className={styles.clock}>
            SCENARIO #{String((variant % 900) + 100)}
          </span>
        </div>
        <div className={styles.floor}>
          <div className={styles.walkway} />
          {[0, 1, 2, 3].map((n) => (
            <div className={styles.desk} data-desk={n} key={n}>
              <div className={styles.monitor}>
                <svg viewBox="0 0 96 42">
                  <polyline
                    points={paths[(variant + n + phase) % 4]}
                    fill="none"
                    stroke={colours[n]}
                    strokeWidth="3"
                    className={styles.chart}
                  />
                </svg>
                <span className={styles.screenTicker}>
                  {["SCAN", "RISK", "THESIS", "PLAN"][n]}
                  <i />
                </span>
              </div>
              <div className={styles.keyboard} />
              <div className={styles.deskEdge} />
              <span className={styles.deskLabel}>
                {["Research", "Risk", "Strategy", "Execution"][n]}
              </span>
            </div>
          ))}
          {[0, 1, 2, 3].map((n) => (
            <div
              className={styles.agent}
              data-agent={(n + variant) % 4}
              key={n}
              style={{ animationDelay: `-${(variant + n) % 5}s` }}
            >
              <div className={styles.bubble} key={phase}>
                {chatter[(variant + phase) % 4][n]}
              </div>
              <Bot colour={colours[n]} variant={variant + n} />
              <span className={styles.shadow} />
            </div>
          ))}
          <div className={styles.tickets}>
            <span key={phase}>
              {
                [
                  "SIGNAL → REVIEW",
                  "RISK CHECK → HOLD?",
                  "ENTRY → EXIT PLAN",
                  "EVIDENCE → DECISION",
                ][(phase + variant) % 4]
              }
            </span>
          </div>
          <div className={styles.plant}>
            <span />
            <i />
          </div>
        </div>
      </div>
      <div className={styles.bottomline}>
        <span>
          {waiting
            ? "Waiting for the calculated scenario…"
            : [
                "Reading your trading playbook…",
                "Preparing a synthetic market…",
                "Mapping entries, exits and risk…",
                "Checking scenario assumptions…",
              ][Math.min(3, phase)]}
        </span>
        <b>{waiting ? "COMPUTING" : `${Math.min(10, elapsed)} / 10s`}</b>
      </div>
      <div className={styles.progress}>
        <span className={waiting ? styles.waiting : undefined} />
      </div>
      <small className={styles.disclaimer}>
        Illustrative agent activity. No live orders or real funds.
      </small>
    </div>
  );
}
