"use client";

type Segment = {
  id?: number;
  label?: string;
  shortLabel?: string;
  color?: string;
};

type RouletteWheelProps = {
  segments?: Segment[];
  rotation?: number;
  spinning?: boolean;
};

const fallbackSegments: Segment[] = [
  { shortLabel: "Grátis" },
  { shortLabel: "Cupom" },
  { shortLabel: "Vídeo" },
  { shortLabel: "VIP" },
  { shortLabel: "Saldo" },
  { shortLabel: "Raro" },
  { shortLabel: "Bônus" },
  { shortLabel: "Extra" },
];

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: Number((cx + r * Math.cos(angleRad)).toFixed(2)),
    y: Number((cy + r * Math.sin(angleRad)).toFixed(2)),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

function describeDonutSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
) {
  const outerStart = polarToCartesian(cx, cy, outerR, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    outerStart.x,
    outerStart.y,
    "A",
    outerR,
    outerR,
    0,
    largeArcFlag,
    0,
    outerEnd.x,
    outerEnd.y,
    "L",
    innerStart.x,
    innerStart.y,
    "A",
    innerR,
    innerR,
    0,
    largeArcFlag,
    1,
    innerEnd.x,
    innerEnd.y,
    "Z",
  ].join(" ");
}

export function RouletteWheel({
  segments = fallbackSegments,
  rotation = 0,
  spinning = false,
}: RouletteWheelProps) {
  const safeSegments =
    segments.length >= 6
      ? segments.map((segment, index) => ({
          ...segment,
          shortLabel:
            segment.shortLabel || segment.label || `Item ${index + 1}`,
        }))
      : fallbackSegments;

  const count = safeSegments.length;
  const sliceAngle = 360 / count;

  const size = 320;
  const center = size / 2;
  const outerR = 142;
  const innerR = 72;
  const textR = 108;

  const colors = [
    { base: "#5e0909", glow: "#ff4040" },
    { base: "#7a160f", glow: "#ff7a30" },
    { base: "#4b0808", glow: "#ff4d4d" },
    { base: "#6b120d", glow: "#ff9b35" },
    { base: "#3d0606", glow: "#ff5959" },
    { base: "#70120f", glow: "#ff7f50" },
    { base: "#4b0909", glow: "#ff4040" },
    { base: "#65100d", glow: "#ffb347" },
  ];

  return (
    <div className="relative mx-auto flex h-[340px] w-[340px] items-center justify-center">
      {/* glow externo */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,60,60,0.18)_0%,rgba(255,60,60,0.08)_35%,transparent_70%)] blur-xl" />

      {/* ponteiro */}
      <div className="absolute top-[0px] z-30 flex flex-col items-center">
        <div className="h-4 w-4 rounded-full border border-[#ffd27a] bg-gradient-to-b from-[#ffe7a8] to-[#d49015] shadow-[0_0_16px_rgba(255,196,77,0.75)]" />
        <div className="-mt-1 h-0 w-0 border-l-[12px] border-r-[12px] border-t-[22px] border-l-transparent border-r-transparent border-t-[#f0b93a] drop-shadow-[0_4px_12px_rgba(255,196,77,0.65)]" />
      </div>

      {/* roleta */}
      <div
        className="relative z-10 h-[320px] w-[320px]"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? "transform 4s cubic-bezier(0.18, 0.8, 0.2, 1)"
            : "none",
        }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-full w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]"
        >
          <defs>
            <radialGradient id="outerGold" cx="50%" cy="35%" r="75%">
              <stop offset="0%" stopColor="#fff0b8" />
              <stop offset="35%" stopColor="#f4c85d" />
              <stop offset="70%" stopColor="#b06e09" />
              <stop offset="100%" stopColor="#4d2600" />
            </radialGradient>

            <radialGradient id="innerCore" cx="40%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#6c1730" />
              <stop offset="38%" stopColor="#2a0c18" />
              <stop offset="72%" stopColor="#0b0608" />
              <stop offset="100%" stopColor="#000000" />
            </radialGradient>

            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="labelShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* aro externo dourado */}
          <circle cx={center} cy={center} r={151} fill="url(#outerGold)" />
          <circle cx={center} cy={center} r={145} fill="#21070a" />

          {/* fatias */}
          {safeSegments.map((segment, index) => {
            const startAngle = index * sliceAngle;
            const endAngle = startAngle + sliceAngle;
            const midAngle = startAngle + sliceAngle / 2;
            const color = colors[index % colors.length];

            const textPoint = polarToCartesian(center, center, textR, midAngle);
            const rotateText = midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle;

            return (
              <g key={`slice-${index}`}>
                {/* base da fatia */}
                <path
                  d={describeDonutSlice(
                    center,
                    center,
                    outerR,
                    innerR,
                    startAngle,
                    endAngle
                  )}
                  fill={color.base}
                  stroke="#d39a2e"
                  strokeWidth="2"
                />

                {/* brilho interno sutil */}
                <path
                  d={describeDonutSlice(
                    center,
                    center,
                    outerR - 6,
                    innerR + 8,
                    startAngle + 1.2,
                    endAngle - 1.2
                  )}
                  fill={color.glow}
                  opacity="0.14"
                  filter="url(#softGlow)"
                />

                {/* divisor dourado */}
                <path
                  d={describeArc(center, center, outerR, startAngle, startAngle)}
                  stroke="#f2c55a"
                  strokeWidth="1.6"
                  opacity="0.9"
                />

                {/* label dentro da fatia */}
                <text
                  x={textPoint.x}
                  y={textPoint.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffe7b0"
                  fontSize="11"
                  fontWeight="700"
                  letterSpacing="0.5"
                  filter="url(#labelShadow)"
                  transform={`rotate(${rotateText} ${textPoint.x} ${textPoint.y})`}
                >
                  {String(segment.shortLabel).slice(0, 8).toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* círculo interno dourado */}
          <circle
            cx={center}
            cy={center}
            r={innerR + 8}
            fill="none"
            stroke="#f0bf4d"
            strokeWidth="6"
          />

          {/* miolo */}
          <circle
            cx={center}
            cy={center}
            r={innerR}
            fill="url(#innerCore)"
            stroke="#0a0a0a"
            strokeWidth="3"
          />

          {/* centro */}
          <circle
            cx={center}
            cy={center}
            r="13"
            fill="url(#outerGold)"
            stroke="#fff1b8"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
}