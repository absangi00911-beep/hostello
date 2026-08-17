// Path: src/components/admin/VerificationThroughputChart.tsx

import { format, parseISO } from "date-fns";

interface ThroughputPoint {
  date: string; // YYYY-MM-DD
  submissions: number;
  approvals: number;
}

const WIDTH = 700;
const HEIGHT = 260;
const PAD_LEFT = 32;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;

export function VerificationThroughputChart({ data }: { data: ThroughputPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-[260px] items-center justify-center text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
        Not enough data yet in this range to chart a trend.
      </div>
    );
  }

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.submissions, d.approvals)));
  // Round the axis ceiling up to a friendly number
  const yMax = Math.ceil(maxVal / 5) * 5 || 5;

  const x = (i: number) => PAD_LEFT + (i / (data.length - 1)) * plotW;
  const y = (v: number) => PAD_TOP + plotH - (v / yMax) * plotH;

  const pathFor = (key: "submissions" | "approvals") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  // Show at most ~6 date labels so they don't collide on a 30/90-day range
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-[var(--text-caption)] text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-border-strong)]" aria-hidden="true" />
          Submissions
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
          Approvals
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Verification submissions and approvals over time"
      >
        {/* Grid lines + Y-axis labels */}
        {gridLines.map((f) => {
          const gy = PAD_TOP + plotH * (1 - f);
          return (
            <g key={f}>
              <line
                x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={gy} y2={gy}
                stroke="var(--color-border-subtle)" strokeWidth={1}
              />
              <text x={0} y={gy + 4} fontSize={10} fill="var(--color-text-muted)">
                {Math.round(yMax * f)}
              </text>
            </g>
          );
        })}

        {/* X-axis date labels */}
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text
              key={d.date}
              x={x(i)}
              y={HEIGHT - 8}
              fontSize={10}
              textAnchor="middle"
              fill="var(--color-text-muted)"
            >
              {format(parseISO(d.date), "MMM d")}
            </text>
          ) : null
        )}

        <path d={pathFor("submissions")} fill="none" stroke="var(--color-border-strong)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={pathFor("approvals")} fill="none" stroke="var(--color-primary)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}
