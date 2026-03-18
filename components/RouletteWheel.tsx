"use client";

type Segment = {
  label: string;
  color: string;
};

type RouletteWheelProps = {
  segments: Segment[];
  rotation: number;
  spinning: boolean;
  onClick?: () => void;
  durationMs?: number;
};

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
  segments,
  rotation,
  spinning,
  onClick,
  durationMs = 4000,
}: RouletteWheelProps) {
  const count = segments.length;
  const sliceAngle = 360 / count;

  const size = 340;
  const center = size / 2;
  const outerR = 146;
  const innerR = 76;
  const textR = 111;

  const colors = [
    { base: "#5a0808", glow: "#ff4040" },
    { base: "#73120d", glow: "#ff7a30" },
    { base: "#4a0707", glow: "#ff4d4d" },
    { base: "#64100c", glow: "#ff9b35" },
    { base: "#3d0606", glow: "#ff5e5e" },
    { base: "#6f120f", glow: "#ff8350" },
    { base: "#500808", glow: "#ff4747" },
    { base: "#5d0e0b", glow: "#ffb347" },
  ];

  return (
    <>
      <style jsx>{`
        @keyframes sweepLight {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
            opacity: 0.22;
          }
          50% {
            opacity: 0.55;
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
            opacity: 0.22;
          }
        }

        @keyframes centerPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.96);
            opacity: 0.5;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.08);
            opacity: 0.95;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.96);
            opacity: 0.5;
          }
        }
      `}</style>

      <button
        type="button"
        onClick={onClick}
        disabled={spinning}
        className="relative mx-auto flex h-[350px] w-[350px] items-center justify-center rounded-full cursor-pointer disabled:cursor-not-allowed"
        aria-label="Girar roleta"
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,210,110,0.18)_0%,rgba(255,120,40,0.10)_28%,rgba(255,40,40,0.08)_48%,transparent_74%)] blur-2xl" />

        <div className="absolute top-[2px] z-40 flex flex-col items-center">
          <div className="h-4 w-4 rounded-full border border-[#ffe39c] bg-gradient-to-b from-[#fff4cc] to-[#d69a17] shadow-[0_0_16px_rgba(255,205,92,0.95)]" />
          <div className="-mt-1 h-0 w-0 border-l-[13px] border-r-[13px] border-t-[24px] border-l-transparent border-r-transparent border-t-[#f2bf46] drop-shadow-[0_5px_14px_rgba(255,196,77,0.9)]" />
        </div>

        <div
          className="relative z-10 h-[340px] w-[340px]"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? `transform ${durationMs}ms cubic-bezier(0.18, 0.8, 0.2, 1)`
              : "none",
          }}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[315px] w-[315px] rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,245,190,0.00) 12deg, rgba(255,240,170,0.08) 20deg, rgba(255,215,110,0.16) 28deg, rgba(255,255,255,0.03) 38deg, rgba(255,255,255,0) 62deg, rgba(255,255,255,0) 360deg)",
              mixBlendMode: "screen",
              filter: "blur(7px)",
              animation: spinning ? "sweepLight 1.8s linear infinite" : "none",
              transform: "translate(-50%, -50%)",
            }}
          />

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[88px] w-[88px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,248,220,0.60) 0%, rgba(255,220,120,0.20) 35%, rgba(255,190,90,0.10) 55%, transparent 75%)",
              filter: "blur(10px)",
              animation: spinning
                ? "centerPulse 1.2s ease-in-out infinite"
                : "none",
              transform: "translate(-50%, -50%)",
            }}
          />

          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="relative z-10 h-full w-full drop-shadow-[0_22px_34px_rgba(0,0,0,0.5)]"
          >
            <defs>
              <radialGradient id="outerGold" cx="50%" cy="35%" r="78%">
                <stop offset="0%" stopColor="#fff4c6" />
                <stop offset="18%" stopColor="#ffe08a" />
                <stop offset="42%" stopColor="#f4c85d" />
                <stop offset="72%" stopColor="#b06e09" />
                <stop offset="100%" stopColor="#4d2600" />
              </radialGradient>

              <linearGradient
                id="goldStroke"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#fff1ba" />
                <stop offset="35%" stopColor="#f2c65b" />
                <stop offset="65%" stopColor="#d18b13" />
                <stop offset="100%" stopColor="#6e3b00" />
              </linearGradient>

              <radialGradient id="innerCore" cx="40%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#4a0717" />
                <stop offset="22%" stopColor="#2b0710" />
                <stop offset="50%" stopColor="#15060b" />
                <stop offset="78%" stopColor="#050505" />
                <stop offset="100%" stopColor="#000000" />
              </radialGradient>

              <radialGradient id="centerOrb" cx="35%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#fff8da" />
                <stop offset="30%" stopColor="#ffe182" />
                <stop offset="70%" stopColor="#d79a18" />
                <stop offset="100%" stopColor="#7a4300" />
              </radialGradient>

              <filter
                id="softGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter
                id="goldGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="4"
                  floodColor="#ffd36a"
                  floodOpacity="0.65"
                />
              </filter>
            </defs>

            <circle
              cx={center}
              cy={center}
              r={158}
              fill="url(#outerGold)"
              filter="url(#goldGlow)"
            />
            <circle cx={center} cy={center} r={152} fill="#2a0908" />
            <circle
              cx={center}
              cy={center}
              r={149}
              fill="none"
              stroke="url(#goldStroke)"
              strokeWidth="3"
              opacity="0.9"
            />
            <circle
              cx={center}
              cy={center}
              r={146}
              fill="none"
              stroke="#ffe39c"
              strokeWidth="1.6"
              opacity="0.45"
            />

            <g transform={`rotate(${-sliceAngle / 2} ${center} ${center})`}>
              {segments.map((segment, index) => {
                const startAngle = index * sliceAngle;
                const endAngle = startAngle + sliceAngle;
                const midAngle = startAngle + sliceAngle / 2;
                const color = colors[index % colors.length];

                const textPoint = polarToCartesian(
                  center,
                  center,
                  textR,
                  midAngle
                );
                const rotateText =
                  midAngle > 90 && midAngle < 270 ? midAngle + 180 : midAngle;

                return (
                  <g key={`slice-${index}`}>
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
                      stroke="#d9a33b"
                      strokeWidth="2.2"
                    />

                    <path
                      d={describeDonutSlice(
                        center,
                        center,
                        outerR - 4,
                        innerR + 9,
                        startAngle + 1,
                        endAngle - 1
                      )}
                      fill={color.glow}
                      opacity="0.09"
                      filter="url(#softGlow)"
                    />

                    <path
                      d={describeDonutSlice(
                        center,
                        center,
                        outerR - 9,
                        innerR + 24,
                        startAngle + 4,
                        startAngle + sliceAngle * 0.58
                      )}
                      fill="#fff4d4"
                      opacity="0.028"
                    />

                    <path
                      d={describeArc(
                        center,
                        center,
                        outerR,
                        startAngle,
                        startAngle
                      )}
                      stroke="#f3c55f"
                      strokeWidth="1.6"
                      opacity="0.9"
                    />

                    <text
                      x={textPoint.x}
                      y={textPoint.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff6dc"
                      fontSize="12"
                      fontWeight="800"
                      letterSpacing="0.6"
                      stroke="#3b0a0a"
                      strokeWidth="1.2"
                      paintOrder="stroke fill"
                      transform={`rotate(${rotateText} ${textPoint.x} ${textPoint.y})`}
                    >
                      {String(segment.label).slice(0, 8).toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </g>

            <circle
              cx={center}
              cy={center}
              r={innerR + 9}
              fill="none"
              stroke="url(#goldStroke)"
              strokeWidth="7"
              filter="url(#goldGlow)"
            />

            <circle
              cx={center}
              cy={center}
              r={innerR + 1}
              fill="none"
              stroke="#fff0b2"
              strokeWidth="1.5"
              opacity="0.4"
            />

            <circle
              cx={center}
              cy={center}
              r={innerR}
              fill="url(#innerCore)"
              stroke="#0a0a0a"
              strokeWidth="3"
            />

            <circle
              cx={center}
              cy={center}
              r="14"
              fill="url(#centerOrb)"
              stroke="#fff1b8"
              strokeWidth="1.8"
              filter="url(#goldGlow)"
            />

            <circle
              cx={center}
              cy={center}
              r="5.5"
              fill="#fff7d6"
              opacity="0.8"
            />
          </svg>
        </div>
      </button>
    </>
  );
}
