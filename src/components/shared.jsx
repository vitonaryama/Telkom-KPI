import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

/* =========================================================================
   SMALL SHARED HELPERS
   ========================================================================= */

export function EmptyState() {
  return (
    <div className="w-full h-64 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <span className="text-4xl mb-4 grayscale opacity-80">📄</span>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">No data available</h3>
      <p className="text-xs text-slate-500">Try changing your filters.</p>
    </div>
  );
}

export function useCountUp(endValue, duration = 300) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrame;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setCount(ease * endValue);
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };
    animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [endValue, duration]);

  return count;
}

export function Skeleton({ className, ...props }) {
  return <div className={`animate-pulse bg-slate-200 rounded-md ${className}`} {...props} />;
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-1 shadow-sm">
      <Skeleton className="h-4 w-1/2 mb-1" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/4 rounded-full mt-1" />
    </div>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-wrap items-center gap-4 shadow-sm">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-9 flex-1 min-w-[180px]" />
      <Skeleton className="h-9 w-20 ml-auto" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden p-4">
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export const fmtPct = (n) => {
  const num = typeof n === "number" && !isNaN(n) ? n : 0;
  return `${num.toFixed(1)}%`;
};

export function TrendValue({ value, target, trend }) {
  const safeValue = typeof value === "number" && !isNaN(value) ? value : 0;
  const comply = safeValue >= target;
  const color = comply ? "text-emerald-600" : "text-red-600";
  // Only show arrow if trend is explicitly set
  const Arrow = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : null;
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${color}`}>
      {fmtPct(safeValue)}
      {Arrow && <Arrow size={12} strokeWidth={2.5} />}
    </span>
  );
}

export function KpiCard({ label, value, target, unit = "%" }) {
  const displayValue = useCountUp(value, 300);

  let status = "NOT COMPLY";
  if (value >= target) status = "COMPLY";
  else if (value >= target - 2) status = "WARNING"; // Within 2% of target

  let statusColors;
  let valueColor;

  if (status === "COMPLY") {
    statusColors = "bg-emerald-100 text-emerald-700";
    valueColor = "text-emerald-600";
  } else if (status === "WARNING") {
    statusColors = "bg-orange-100 text-orange-700";
    valueColor = "text-orange-600";
  } else {
    statusColors = "bg-red-100 text-red-700";
    valueColor = "text-red-600";
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col gap-1 shadow-sm animate-fade-in-up transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className={`text-2xl font-bold ${valueColor}`}>{displayValue.toFixed(1)}{unit}</span>
      <span
        className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide ${statusColors}`}
      >
        {status}
      </span>
    </div>
  );
}
