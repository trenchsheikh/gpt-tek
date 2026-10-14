"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
export const contractAddress = "4kZVkhfMFEJhntYtoHTHiyfZLxV8VCLkfrp2PfLVpump";
export default function ContractAddress({ full = false }: { full?: boolean }) {
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(contractAddress);
      setStatus("Copied");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus(""), 2000);
    } catch {
      setStatus("Select address to copy");
    }
  }
  return (
    <button
      type="button"
      className={"ar-contract-address" + (full ? " ar-contract-full" : "")}
      onClick={copy}
      title={contractAddress}
      aria-label={`Copy contract address ${contractAddress}`}
    >
      <span>CA</span>
      <code>
        {full
          ? contractAddress
          : `${contractAddress.slice(0, 6)}…${contractAddress.slice(-6)}`}
      </code>
      {status === "Copied" ? <Check size={14} /> : <Copy size={14} />}
      <span className="ar-contract-status" aria-live="polite">
        {status}
      </span>
    </button>
  );
}
