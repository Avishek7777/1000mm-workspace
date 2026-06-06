"use client";

import { Text, Svg, Rect, Circle, G, Line, Path } from "@react-pdf/renderer";

export function HorizBar({
  data,
  width = 480,
  color = "#2980b9",
}: {
  data: { label: string; value: number; pct?: number }[];
  width?: number;
  color?: string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barH = 13;
  const gap = 5;
  const labelW = 140;
  const chartW = width - labelW - 50;
  const totalH = data.length * (barH + gap) + 4;

  return (
    <Svg width={width} height={totalH}>
      {data.map((d, i) => {
        const bw = Math.max((d.value / maxVal) * chartW, 2);
        const y = i * (barH + gap);
        return (
          <G key={i}>
            <Text style={{ fontSize: 7, fill: "#444" }} x={0} y={y + barH - 2}>
              {d.label}
            </Text>
            <Rect
              x={labelW}
              y={y}
              width={bw}
              height={barH}
              fill={color}
              rx={2}
            />
            <Text
              style={{ fontSize: 6.5, fill: "#111" }}
              x={labelW + bw + 4}
              y={y + barH - 2}
            >
              {d.value}
              {d.pct != null ? ` (${d.pct}%)` : ""}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
}

export function PieChart({
  data,
  size = 90,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const slices = data.reduce(
    (
      acc: Array<{
        label: string;
        value: number;
        color: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        large: number;
        endAngle: number;
      }>,
      d,
    ) => {
      const startAngle =
        acc.length > 0 ? acc[acc.length - 1].endAngle : -Math.PI / 2;
      const angle = (d.value / total) * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const large = angle > Math.PI ? 1 : 0;
      return [...acc, { ...d, x1, y1, x2, y2, large, endAngle }];
    },
    [],
  );

  return (
    <Svg width={size} height={size}>
      {slices.map((s, i) => (
        <Path
          key={i}
          d={`M${cx},${cy} L${s.x1},${s.y1} A${r},${r} 0 ${s.large},1 ${s.x2},${s.y2} Z`}
          fill={s.color}
        />
      ))}
    </Svg>
  );
}

export function LineChart({
  data,
  width = 480,
  height = 100,
  color = "#2980b9",
  label = "",
}: {
  data: { x: number; y: number }[];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
}) {
  if (data.length < 2) return null;
  const minX = data[0].x;
  const maxX = data[data.length - 1].x;
  const maxY = Math.max(...data.map((d) => d.y), 1);
  const padL = 30;
  const padB = 20;
  const padT = 8;
  const padR = 10;
  const chartW = width - padL - padR;
  const chartH = height - padB - padT;

  function px(x: number) {
    return padL + ((x - minX) / (maxX - minX || 1)) * chartW;
  }
  function py(y: number) {
    return padT + chartH - (y / maxY) * chartH;
  }

  const points = data.map((d) => `${px(d.x)},${py(d.y)}`).join(" ");

  return (
    <Svg width={width} height={height}>
      <Line
        x1={padL}
        y1={padT}
        x2={padL}
        y2={padT + chartH}
        stroke="#ddd"
        strokeWidth={0.5}
      />
      <Line
        x1={padL}
        y1={padT + chartH}
        x2={padL + chartW}
        y2={padT + chartH}
        stroke="#ddd"
        strokeWidth={0.5}
      />
      <Path d={`M ${points}`} fill="none" stroke={color} strokeWidth={1.5} />
      {data.map((d, i) => (
        <G key={i}>
          <Circle cx={px(d.x)} cy={py(d.y)} r={2.5} fill={color} />
          <Text
            style={{ fontSize: 6, fill: "#666" }}
            x={px(d.x) - 6}
            y={padT + chartH + 10}
          >
            {d.x}
          </Text>
        </G>
      ))}
      {label && (
        <Text style={{ fontSize: 6.5, fill: "#555" }} x={padL} y={padT - 2}>
          {label}
        </Text>
      )}
    </Svg>
  );
}
