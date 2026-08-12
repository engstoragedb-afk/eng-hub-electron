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
import { useState, useEffect } from "react";

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

export function KomposisiUnitChart({ filter }: { filter: FilterType }) {
  const selectedData = lineRangeData[filter];
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isLight = mounted && theme === "light";
  
  const textColor = isLight ? "#475569" : "#e2e8f0";
  const tooltipBg = isLight ? "rgba(255, 255, 255, 0.96)" : "rgba(15, 23, 42, 0.96)";
  const tooltipBorder = isLight ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.35)";
  const tooltipTitle = isLight ? "#0f172a" : "#f8fafc";
  const tooltipBody = isLight ? "#334155" : "#cbd5e1";
  const doughnutBorder = isLight ? "#ffffff" : "#081327";

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "58%",
    plugins: {
      legend: {
        position: "top" as const,
        align: "start" as const,
        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 10,
          boxHeight: 10,
          padding: 18,
          font: { size: 12, weight: 600 },
        },
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
  };

  const data = {
    labels: [
      "Excavator",
      "Bulldozer",
      "Vibro",
      "Motor Grader",
      "Truck",
    ],
    datasets: [
      {
        data: selectedData.doughnutData,
        backgroundColor: [
          "#f59e0b",
          "#22c55e",
          "#38bdf8",
          "#a855f7",
          "#fb7185",
        ],
        borderColor: doughnutBorder,
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  return (
    <div className="flex h-full flex-col min-w-0">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 shrink-0">Komposisi Unit</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Pembagian kategori</p>
      </div>
      <div className="relative flex-1 min-h-[250px] w-full pb-4">
        <Doughnut options={options} data={data} />
      </div>
    </div>
  );
}
