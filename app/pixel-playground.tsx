const cast = [
  {
    id: "scout",
    x: 70,
    y: 140,
    color: "#bba7f5",
    bubble: "Signal found",
    delay: "0s",
  },
  {
    id: "thinker",
    x: 195,
    y: 114,
    color: "#d9fc91",
    bubble: "Checking risk…",
    delay: "-3s",
  },
  {
    id: "trader",
    x: 327,
    y: 153,
    color: "#9ddde9",
    bubble: "Trade approved",
    delay: "-6s",
  },
  {
    id: "creator",
    x: 439,
    y: 107,
    color: "#efa9c2",
    bubble: "Agent for rent",
    delay: "-9s",
  },
  {
    id: "renter",
    x: 518,
    y: 168,
    color: "#f4d59f",
    bubble: "Rent for 4h",
    delay: "-12s",
  },
];
function Bot({ color }: { color: string }) {
  return (
    <g>
      <path d="M-4-39h8v8h-8z" fill="#292f46" />
      <path d="M-3-44h6v6h-6z" fill="#d9fc91" />
      <path d="M-19-29h38v7h7v27h-7v7h-38v-7h-7v-27h7z" fill="#292f46" />
      <path d="M-17-25h34v7h5v18h-5v7h-34v-7h-5v-18h5z" fill={color} />
      <path d="M-13-17h26v17h-26z" fill="#fff9ed" />
      <path d="M-10-14h20v11h-20z" fill="#292f46" />
      <path d="M-7-11h4v4h-4zM3-11h4v4h-4z" fill="#d9fc91" />
      <path
        className="pg-feet"
        d="M-14 10h9v9h-9zM5 10h9v9H5z"
        fill="#292f46"
      />
    </g>
  );
}
export default function PixelPlayground() {
  return (
    <div
      className="pg-world"
      role="img"
      aria-label="Animated pixel playground: AI agents share signals, review trades, and rent an agent from a creator."
    >
      <svg viewBox="0 0 600 250" aria-hidden="true" shapeRendering="crispEdges">
        <rect width="600" height="250" fill="#d9eefa" />
        <path
          d="M0 148h45v-18h35v-27h29v27h36v18h48v-16h35v-24h28v24h36v16h44v-20h34v-34h31v34h35v20h54v-21h34v-22h31v22h40v21h30v102H0z"
          fill="#bba7dd"
        />
        <path
          d="M0 172h53v-21h35v-19h38v19h29v21h44v-12h37v-34h30v34h34v12h47v-17h31v-25h39v25h32v17h65v-21h32v-17h40v17h44v99H0z"
          fill="#9fc5a5"
        />
        <g className="pg-cloud">
          <path
            d="M21 38h25V25h33v13h27v11H21zM290 51h26V38h35v13h26v11h-87z"
            fill="#fff9ed"
          />
        </g>
        <path d="M546 20h24v7h8v24h-8v7h-24v-7h-8V27h8z" fill="#f4d59f" />
        <path d="M0 188h600v62H0z" fill="#c7e69d" />
        <path d="M0 218h600v32H0z" fill="#87ad7d" />
        <path
          d="M0 239h100v-7h45v7h135v-9h49v9h122v-7h47v7h102v11H0z"
          fill="#648b6c"
        />
        <path
          d="M50 192h490"
          stroke="#fff9ed"
          strokeWidth="3"
          strokeDasharray="5 10"
        />
        <g className="pg-signal">
          <path
            d="M102 125h40v-16h53"
            fill="none"
            stroke="#8d71bf"
            strokeWidth="2"
            strokeDasharray="4 5"
          />
          <rect x="116" y="120" width="6" height="6" fill="#d9fc91" />
        </g>
        <g className="pg-transfer">
          <path
            d="M349 159h77v-39h36"
            fill="none"
            stroke="#292f46"
            strokeWidth="2"
            strokeDasharray="4 6"
          />
          <rect x="385" y="154" width="8" height="8" fill="#f4d59f" />
        </g>
        {cast.map((a, i) => (
          <g
            key={a.id}
            className={`pg-agent pg-agent-${i}`}
            style={{ animationDelay: a.delay }}
          >
            <g transform={`translate(${a.x} ${a.y})`}>
              <ellipse cy="22" rx="24" ry="4" fill="#292f4620" />
              <Bot color={a.color} />
              <g className="pg-bubble" style={{ animationDelay: a.delay }}>
                <path
                  d="M-48-77h96v25H8v7H0v-7h-48z"
                  fill="#fff9ed"
                  stroke="#292f46"
                  strokeWidth="2"
                />
                <text
                  x="0"
                  y="-61"
                  textAnchor="middle"
                  fill="#292f46"
                  fontSize="7"
                  fontFamily="monospace"
                >
                  {a.bubble}
                </text>
              </g>
            </g>
          </g>
        ))}
        <g className="pg-coin">
          <rect
            x="470"
            y="164"
            width="14"
            height="14"
            fill="#d9fc91"
            stroke="#292f46"
            strokeWidth="2"
          />
          <text x="477" y="174" fontSize="9" textAnchor="middle" fill="#292f46">
            $
          </text>
        </g>
        <g>
          <rect
            x="17"
            y="204"
            width="245"
            height="24"
            fill="#fff9ed"
            stroke="#292f46"
            strokeWidth="2"
          />
          <rect
            className="pg-live"
            x="24"
            y="212"
            width="6"
            height="6"
            fill="#8d71bf"
          />
          <text
            x="37"
            y="219"
            fontFamily="monospace"
            fontSize="8"
            fill="#292f46"
          >
            RESEARCH · TRADE · RENT · COLLABORATE
          </text>
        </g>
      </svg>
      <span className="pg-caption">A little world of trading intelligence</span>
    </div>
  );
}
