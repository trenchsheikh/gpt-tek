export default function PoweredBy() {
  return (
    <a
      className="ar-powered-by"
      href="https://openrouter.ai"
      target="_blank"
      rel="noreferrer"
    >
      <span className="ar-powered-label">Powered by</span>
      <span className="ar-powered-wordmark">
        <img src="/providers/openrouter-lime.png" alt="" width="23" height="23" />
        <strong>OpenRouter</strong>
      </span>
    </a>
  );
}
