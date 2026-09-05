export interface BarChartBar {
  value: number;
  label: string;
  fill?: string;
  opacity?: number;
  valueFill?: string;
  valueWeight?: number;
}

interface BarChartProps {
  bars: BarChartBar[];
  height?: number;
  barWidth?: number;
  className?: string;
}

function niceStep(maxVal: number): number {
  if (maxVal <= 5) return 1;
  if (maxVal <= 10) return 2;
  if (maxVal <= 25) return 5;
  if (maxVal <= 50) return 10;
  if (maxVal <= 100) return 20;
  if (maxVal <= 200) return 50;
  if (maxVal <= 500) return 100;
  return 200;
}

const LABEL_FONT_SIZE = 11;
const MAX_SLOT = 170;

function measureLabelWidth(label: string, fontSize: number): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return label.length * fontSize * 0.62;
  ctx.font = `${fontSize}px sans-serif`;
  return ctx.measureText(label).width;
}

function truncateLabel(
  label: string,
  maxWidth: number,
  fontSize: number,
): { text: string; tooltip?: string } {
  if (measureLabelWidth(label, fontSize) <= maxWidth) {
    return { text: label };
  }
  const ellipsis = '…';
  const ellipsisW = measureLabelWidth(ellipsis, fontSize);
  let chars = '';
  for (const ch of label) {
    if (measureLabelWidth(chars + ch, fontSize) + ellipsisW > maxWidth) break;
    chars += ch;
  }
  return { text: chars + ellipsis, tooltip: label };
}

export function BarChart({
  bars,
  height = 220,
  barWidth = 34,
  className,
}: BarChartProps) {
  const H = height;
  const top = 22;
  const bottom = 32;
  const left = 34;
  const right = 8;

  const total = bars.reduce((s, b) => s + b.value, 0);
  if (total === 0) {
    return <div className="chart-empty">Нет данных</div>;
  }

  const maxVal = Math.max(...bars.map((b) => b.value), 1);
  const step = niceStep(maxVal);
  const maxAxis = Math.ceil(maxVal / step) * step;
  const plotH = H - top - bottom;

  const measured = bars.map((b) => measureLabelWidth(b.label, LABEL_FONT_SIZE));
  const maxLabelWidth = Math.max(...measured, 0);
  const slotW = Math.max(barWidth + 14, Math.min(maxLabelWidth + 6, MAX_SLOT), 52);
  const labelSpace = slotW - 4;
  const W = bars.length * slotW + left + right;

  const yFor = (v: number) => top + plotH - (v / maxAxis) * plotH;

  const gridlines: number[] = [];
  for (let v = 0; v <= maxAxis; v += step) gridlines.push(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className={`chart ${className ?? ''}`}>
      {gridlines.map((v) => (
        <g key={v}>
          <line
            x1={left}
            y1={yFor(v)}
            x2={W - right}
            y2={yFor(v)}
            stroke="#ece4d6"
            strokeWidth={1}
          />
          <text x={left - 7} y={yFor(v) + 4} textAnchor="end" fontSize={11} fill="#948b7c">
            {v}
          </text>
        </g>
      ))}
      {bars.map((d, i) => {
          const cx = left + i * slotW + slotW / 2;
          const barHeight = Math.max((d.value / maxAxis) * plotH, d.value > 0 ? 2 : 1);
          const y = yFor(d.value);
          const rendered = truncateLabel(d.label, labelSpace, LABEL_FONT_SIZE);
          return (
            <g key={`${d.label}-${i}`}>
              <rect
                x={cx - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={d.fill ?? 'var(--clay)'}
                opacity={d.opacity ?? 1}
              />
              <text
                x={cx}
                y={y - 6}
                textAnchor="middle"
                fontSize={12}
                fontWeight={d.valueWeight ?? 600}
                fill={d.valueFill ?? 'var(--pine)'}
              >
                {d.value}
              </text>
              <text
                x={cx}
                y={H - 10}
                textAnchor="middle"
                fontSize={LABEL_FONT_SIZE}
                fill="#948b7c"
              >
                {rendered.tooltip && <title>{rendered.tooltip}</title>}
                {rendered.text}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
