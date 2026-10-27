function ringColor(percent: number) {
    if (percent < 50) return "var(--color-occ-low)";
    if (percent <= 80) return "var(--color-occ-mid)";
    return "var(--color-occ-high)";
}

function ringLabel(percent: number) {
    if (percent < 50) return "יש מקום";
    if (percent <= 80) return "מתמלא";
    return "כמעט מלא";
}

export default function OccupancyRing({ percent, size = 64, showLabel = false }: { percent: number; size?: number; showLabel?: boolean }) {
    const value = Math.min(100, Math.max(0, Math.round(Number(percent) || 0)));
    const stroke = Math.max(5, size * 0.1);
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const color = ringColor(value);

    return (
        <div className="flex flex-col items-center gap-1.5" role="img" aria-label={`תפוסה ${value}%`}>
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-stone-200/80" />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - value / 100)}
                        className="transition-[stroke-dashoffset] duration-700 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                    <span className="font-display font-bold text-stone-900" style={{ fontSize: size * 0.26 }}>{value}%</span>
                    {size >= 110 && <span className="mt-1 text-stone-500" style={{ fontSize: size * 0.09 }}>תפוסה</span>}
                </div>
            </div>
            {showLabel && <span className="text-xs font-semibold" style={{ color }}>{ringLabel(value)}</span>}
        </div>
    )
}
