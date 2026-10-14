"use client";
import { useEffect, useState } from "react";
export function ChatText({
  text,
  animate = false,
}: {
  text: string;
  animate?: boolean;
}) {
  const [length, setLength] = useState(animate ? 0 : text.length);
  useEffect(() => {
    if (!animate || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLength(text.length);
      return;
    }
    setLength(0);
    const timer = setInterval(
      () =>
        setLength((n) => {
          if (n >= text.length) {
            clearInterval(timer);
            return text.length;
          }
          return Math.min(text.length, n + 2);
        }),
      24,
    );
    return () => clearInterval(timer);
  }, [text, animate]);
  return (
    <span>
      {text.slice(0, length)}
      {length < text.length && (
        <span className="ar-typing-cursor" aria-hidden="true">
          ▍
        </span>
      )}
    </span>
  );
}
export function Thinking() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((x) => (x + 1) % 3), 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="ar-thinking" role="status">
      <span className="ar-thinking-dots">
        <i />
        <i />
        <i />
      </span>
      {
        [
          "Understanding your strategy",
          "Comparing models",
          "Updating your blueprint",
        ][phase]
      }
    </div>
  );
}
