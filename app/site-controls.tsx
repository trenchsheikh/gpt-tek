"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
export function XLink() {
  return (
    <a
      className="ar-x-link"
      href="https://x.com/agentroutersol"
      target="_blank"
      rel="noreferrer"
      aria-label="AgentRouter on X"
    >
      <svg
        viewBox="0 0 24 24"
        width="15"
        height="15"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l8.2-9.4L.8 2h6.5l4.5 6.8L18.9 2Zm-1.1 18h1.7L6.4 3.9H4.6L17.8 20Z" />
      </svg>
    </a>
  );
}
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const sync = () =>
      setDark(document.documentElement.dataset.theme === "dark");
    sync();
    window.addEventListener("agentrouter-theme", sync);
    return () => window.removeEventListener("agentrouter-theme", sync);
  }, []);
  function toggle() {
    const value = !dark;
    setDark(value);
    document.documentElement.dataset.theme = value ? "dark" : "light";
    window.dispatchEvent(new Event("agentrouter-theme"));
  }
  return (
    <button
      className="ar-theme-toggle"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
export function SiteControls() {
  return (
    <div className="ar-site-controls">
      <XLink />
      <ThemeToggle />
    </div>
  );
}
export function AppArrival() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    window.dispatchEvent(new Event("agentrouter-theme"));
    const timer = setTimeout(
      () => setVisible(false),
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 1100,
    );
    return () => clearTimeout(timer);
  }, []);
  return visible ? (
    <div className="ar-arrival" role="status" aria-live="polite">
      <div className="ar-pixel-track">
        <img src="/avelis-logo.png" alt="" />
      </div>
      <strong>Entering AgentRouter</strong>
      <span>Your strategy starts here.</span>
    </div>
  ) : null;
}
