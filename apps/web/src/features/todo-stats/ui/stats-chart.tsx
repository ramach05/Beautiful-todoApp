import type { DailyPoint } from '../model/stats';

const WIDTH = 320;
const HEIGHT = 140;
const PAD_X = 10;
const LABEL_H = 18;
const TOP_H = 14;
const GAP = 8;

/**
 * Столбчатый график выполнений по дням: чистый inline SVG без библиотек.
 * Высота столбца масштабируется относительно максимума окна.
 */
export function StatsChart({ data }: { data: DailyPoint[] }) {
  const max = Math.max(1, ...data.map((point) => point.completed));
  const innerWidth = WIDTH - PAD_X * 2;
  const barWidth = (innerWidth - GAP * (data.length - 1)) / data.length;
  const trackHeight = HEIGHT - LABEL_H - TOP_H;
  const total = data.reduce((sum, point) => sum + point.completed, 0);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Completed per day over the last ${data.length} days, ${total} total`}
    >
      {data.map((point, index) => {
        const barHeight = (point.completed / max) * trackHeight;
        const x = PAD_X + index * (barWidth + GAP);
        const y = TOP_H + trackHeight - barHeight;
        return (
          <g key={point.key}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={3} fill="#ff7f00" />
            {point.completed > 0 && (
              <text
                x={x + barWidth / 2}
                y={Math.max(y - 3, TOP_H - 2)}
                textAnchor="middle"
                fontSize={11}
                fill="#ffffff"
              >
                {point.completed}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={HEIGHT - 4}
              textAnchor="middle"
              fontSize={11}
              fill="#d1d5db"
            >
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
