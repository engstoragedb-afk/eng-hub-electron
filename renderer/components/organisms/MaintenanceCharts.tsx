import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { useTheme } from "next-themes";
import { useState, useEffect, useMemo } from "react";
import { unitService } from "@/services/unit-service";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export const lineRangeData = {
  "1 minggu": {
    label: "1 minggu terakhir",
    labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    data: [0, 0, 0, 0, 0, 0, 0],
    doughnutData: [0, 0, 0, 0, 0],
  },
  "4 minggu": {
    label: "4 minggu terakhir",
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    data: [0, 0, 0, 0],
    doughnutData: [0, 0, 0, 0, 0],
  },
  "5 minggu": {
    label: "5 minggu terakhir",
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
    data: [0, 0, 0, 0, 0],
    doughnutData: [0, 0, 0, 0, 0],
  },
  "1 bulan": {
    label: "1 bulan terakhir",
    labels: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"],
    data: [0, 0, 0, 0],
    doughnutData: [0, 0, 0, 0, 0],
  },
  "Custom": {
    label: "Custom range",
    labels: ["Day 1", "Day 2", "Day 3"],
    data: [0, 0, 0],
    doughnutData: [0, 0, 0, 0, 0],
  },
};

export type FilterType = keyof typeof lineRangeData;

export function TrenPerbaikanChart({ filter, setFilter }: { filter: FilterType, setFilter: (val: FilterType) => void }) {
  const selectedData = lineRangeData[filter];
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isLight = mounted && theme === "light";
  
  const textColor = isLight ? "#475569" : "#cbd5e1"; // slate-600 vs slate-300
  const gridColor = isLight ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.15)";
  const tooltipBg = isLight ? "rgba(255, 255, 255, 0.96)" : "rgba(15, 23, 42, 0.96)";
  const tooltipBorder = isLight ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.35)";
  const tooltipTitle = isLight ? "#0f172a" : "#f8fafc";
  const tooltipBody = isLight ? "#334155" : "#cbd5e1";

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        titleColor: tooltipTitle,
        bodyColor: tooltipBody,
        padding: 12,
      },
    },
    scales: {
      y: {
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
      x: {
        ticks: { color: textColor },
        grid: { display: false },
      },
    },
  };

  const data = {
    labels: selectedData.labels,
    datasets: [
      {
        label: "Completed Repairs",
        data: selectedData.data,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.15)",
        tension: 0.35,
        fill: true,
      },
    ],
  };

  return (
    <div className="flex h-full flex-col min-w-0">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Tren Penyelesaian Perbaikan</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{selectedData.label}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filter === "Custom" && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 px-2 py-1">
              <input
                type="date"
                className="rounded-lg bg-transparent px-2 py-1 text-xs text-slate-700 dark:text-slate-300 outline-none [color-scheme:dark]"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">s/d</span>
              <input
                type="date"
                className="rounded-lg bg-transparent px-2 py-1 text-xs text-slate-700 dark:text-slate-300 outline-none [color-scheme:dark]"
              />
            </div>
          )}
          <label htmlFor="chartFilter" className="text-xs text-slate-700 dark:text-slate-300">Filter</label>
          <select
            id="chartFilter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          >
            <option value="1 minggu">1 minggu</option>
            <option value="4 minggu">4 minggu</option>
            <option value="5 minggu">5 minggu</option>
            <option value="1 bulan">1 bulan</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
      </div>
      <div className="relative flex-1 min-h-[250px] w-full">
        <Line options={options} data={data} />
      </div>
    </div>
  );
}

export function StatusUnitChart({ units: propUnits }: { units?: any[] }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [fetchedUnits, setFetchedUnits] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    if (!propUnits || propUnits.length === 0) {
      unitService.getAllUnitsWithDetail()
        .then((res) => setFetchedUnits(res || []))
        .catch((err) => console.error("StatusUnitChart fetch error:", err));
    }
  }, [propUnits]);

  const activeUnits = propUnits && propUnits.length > 0 ? propUnits : fetchedUnits;

  const counts = useMemo(() => {
    if (!activeUnits || activeUnits.length === 0) {
      return { CRITICAL: 0, URGENT: 0, ATTENTION: 0, NORMAL: 0, total: 0 };
    }

    let critical = 0;
    let urgent = 0;
    let attention = 0;
    let normal = 0;

    activeUnits.forEach((unit: any) => {
      const rawHours = unit.hours !== undefined && unit.hours !== null ? unit.hours : unit.hm;
      const hoursNum = parseFloat(String(rawHours ?? 0).replace(/[^\d.-]/g, ''));
      const isZeroHours = isNaN(hoursNum) || hoursNum <= 0;
      if (isZeroHours) {
        normal++;
        return;
      }

      const aplItems = unit.aplData || [];
      let unitLevel = 'NORMAL';

      if (aplItems.some((i: any) => (i.vault ?? 0) > 0 && (i.input ?? 0) < 0)) {
        unitLevel = 'CRITICAL';
      } else if (aplItems.some((i: any) => (i.vault ?? 0) > 0 && (i.input ?? 0) > 0 && (i.input ?? 0) <= 10)) {
        unitLevel = 'URGENT';
      } else if (aplItems.some((i: any) => (i.vault ?? 0) > 0 && (i.input ?? 0) > 10 && (i.input ?? 0) < 50)) {
        unitLevel = 'ATTENTION';
      }

      if (unitLevel === 'CRITICAL') critical++;
      else if (unitLevel === 'URGENT') urgent++;
      else if (unitLevel === 'ATTENTION') attention++;
      else normal++;
    });

    return {
      CRITICAL: critical,
      URGENT: urgent,
      ATTENTION: attention,
      NORMAL: normal,
      total: activeUnits.length
    };
  }, [activeUnits]);

  const isLight = mounted && theme === "light";
  
  const tooltipBg = isLight ? "rgba(255, 255, 255, 0.98)" : "rgba(15, 23, 42, 0.98)";
  const tooltipBorder = isLight ? "rgba(148, 163, 184, 0.25)" : "rgba(148, 163, 184, 0.35)";
  const tooltipTitle = isLight ? "#0f172a" : "#f8fafc";
  const tooltipBody = isLight ? "#334155" : "#cbd5e1";
  const doughnutBorder = isLight ? "#ffffff" : "#0f172a";

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 800,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        titleColor: tooltipTitle,
        bodyColor: tooltipBody,
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: function (context: any) {
            const val = context.raw || 0;
            const pct = counts.total > 0 ? ((val / counts.total) * 100).toFixed(1) : "0";
            return ` ${context.label}: ${val} Unit (${pct}%)`;
          },
        },
      },
    },
  };

  const chartData = {
    labels: ["CRITICAL", "URGENT", "ATTENTION", "NORMAL"],
    datasets: [
      {
        data: counts.total > 0 ? [counts.CRITICAL, counts.URGENT, counts.ATTENTION, counts.NORMAL] : [1, 1, 1, 1],
        backgroundColor: [
          "#f43f5e", // Rose-500
          "#f59e0b", // Amber-500
          "#0ea5e9", // Sky-500
          "#10b981", // Emerald-500
        ],
        hoverBackgroundColor: [
          "#e11d48",
          "#d97706",
          "#0284c7",
          "#059669",
        ],
        borderColor: doughnutBorder,
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <div className="flex h-full flex-col min-w-0 justify-between">
      <div className="mb-2 flex flex-col items-start justify-between gap-1 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 shrink-0">
            Kondisi & Status Unit
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Distribusi berdasarkan tingkat urgensi servis
          </p>
        </div>
        <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/5">
          {counts.total} Unit
        </span>
      </div>

      {/* Donut Chart with Center Text */}
      <div className="relative flex-1 min-h-[170px] max-h-[190px] w-full flex items-center justify-center my-1">
        <Doughnut options={options} data={chartData} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {counts.total}
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Total Unit
          </span>
        </div>
      </div>

      {/* Responsive 4-Column / 2-Row Legend Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
        {/* CRITICAL */}
        <div className="flex flex-col p-2 rounded-xl bg-rose-50/70 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
              Critical
            </span>
            <span className="text-[9px] font-bold text-rose-500/80">
              {counts.total > 0 ? Math.round((counts.CRITICAL / counts.total) * 100) : 0}%
            </span>
          </div>
          <span className="text-sm font-black text-rose-600 dark:text-rose-300 mt-0.5">
            {counts.CRITICAL} <span className="text-[10px] font-medium text-rose-500/70">unit</span>
          </span>
        </div>

        {/* URGENT */}
        <div className="flex flex-col p-2 rounded-xl bg-amber-50/70 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
              Urgent
            </span>
            <span className="text-[9px] font-bold text-amber-500/80">
              {counts.total > 0 ? Math.round((counts.URGENT / counts.total) * 100) : 0}%
            </span>
          </div>
          <span className="text-sm font-black text-amber-600 dark:text-amber-300 mt-0.5">
            {counts.URGENT} <span className="text-[10px] font-medium text-amber-500/70">unit</span>
          </span>
        </div>

        {/* ATTENTION */}
        <div className="flex flex-col p-2 rounded-xl bg-sky-50/70 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.6)]" />
              Attention
            </span>
            <span className="text-[9px] font-bold text-sky-500/80">
              {counts.total > 0 ? Math.round((counts.ATTENTION / counts.total) * 100) : 0}%
            </span>
          </div>
          <span className="text-sm font-black text-sky-600 dark:text-sky-300 mt-0.5">
            {counts.ATTENTION} <span className="text-[10px] font-medium text-sky-500/70">unit</span>
          </span>
        </div>

        {/* NORMAL */}
        <div className="flex flex-col p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              Normal
            </span>
            <span className="text-[9px] font-bold text-emerald-500/80">
              {counts.total > 0 ? Math.round((counts.NORMAL / counts.total) * 100) : 0}%
            </span>
          </div>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-300 mt-0.5">
            {counts.NORMAL} <span className="text-[10px] font-medium text-emerald-500/70">unit</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// Alias for backwards compatibility
export const KomposisiUnitChart = StatusUnitChart;
