export const avatarNames = ["Bot", "Owl", "Cat", "Alien", "Knight", "Fox"];
const faces = [
  [
    "00111100",
    "01111110",
    "11111111",
    "11011011",
    "11111111",
    "01100110",
    "00111100",
    "01000010",
  ],
  [
    "11000011",
    "11111111",
    "11111111",
    "10011001",
    "11111111",
    "01100110",
    "00111100",
    "00011000",
  ],
  [
    "11000011",
    "11100111",
    "11111111",
    "10111101",
    "11111111",
    "01100110",
    "00111100",
    "00000000",
  ],
  [
    "00011000",
    "00111100",
    "01111110",
    "11011011",
    "10011001",
    "11111111",
    "01100110",
    "00100100",
  ],
  [
    "00111100",
    "01111110",
    "11111111",
    "10000001",
    "11111111",
    "01111110",
    "00111100",
    "01100110",
  ],
  [
    "11000011",
    "11100111",
    "01111110",
    "01100110",
    "00111100",
    "00100100",
    "00011000",
    "00000000",
  ],
];
export default function AgentAvatar({
  variant = 0,
  color = "#bba7f5",
  label = "Agent avatar",
}: {
  variant?: number;
  color?: string;
  label?: string;
}) {
  const pattern = faces[variant] || faces[0];
  return (
    <svg
      className="ar-avatar-art"
      viewBox="0 0 12 12"
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect width="12" height="12" rx="2" fill={color} />
      {pattern.flatMap((row, y) =>
        Array.from(row).map((v, x) =>
          v === "1" ? (
            <rect
              key={`${x}-${y}`}
              x={x + 2}
              y={y + 2}
              width="1"
              height="1"
              fill="#292f46"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
