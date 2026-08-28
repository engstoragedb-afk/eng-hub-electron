"use client";
import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaPrint, FaChevronDown, FaFilePdf, FaSearchPlus, FaSearchMinus } from "react-icons/fa";

interface PrintPreviewModalProps {
  units: any[];
  aplColumns: { id: string; name: string }[];
  categoryName: string;
  isPlanPSMode?: boolean;
  psStatuses?: Record<string, 'Wait' | 'Progress' | 'Done'>;
  psSelectedApls?: Record<string, string>;
  onClose: () => void;
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  Merah: { bg: "#fee2e2", text: "#b91c1c" },
  Oranye: { bg: "#ffedd5", text: "#c2410c" },
  Amber: { bg: "#fef3c7", text: "#b45309" },
  Kuning: { bg: "#dcfce7", text: "#15803d" },
  Hijau: { bg: "#d1fae5", text: "#065f46" },
};

function getStatus(val: number) {
  if (val <= -50) return "Merah";
  if (val <= 0) return "Oranye";
  if (val < 50) return "Amber";
  if (val < 150) return "Kuning";
  return "Hijau";
}

const PAPER_SIZES = [
  { label: "A4 (210×297mm)", value: "A4" },
  { label: "A3 (297×420mm)", value: "A3" },
  { label: "Letter (216×279mm)", value: "Letter" },
  { label: "Legal (216×356mm)", value: "Legal" },
];

const MAIN_COLUMNS = [
  { id: "no", name: "No" },
  { id: "code", name: "Kode Unit" },
  { id: "operator", name: "Operator" },
  { id: "lokasi", name: "Lokasi" },
  { id: "hm", name: "HM" },
  { id: "hours", name: "Total Jam" },
];

const PLAN_PS_COLUMNS = [
  { id: "no", name: "No" },
  { id: "urgency", name: "Tingkat Urgensi" },
  { id: "code", name: "No Unit" },
  { id: "brand", name: "Brand" },
  { id: "type", name: "Type Unit" },
  { id: "pic", name: "PIC" },
  { id: "lokasi", name: "Location Unit" },
  { id: "operator", name: "Operator" },
  { id: "ps", name: "Periodical Service" },
  { id: "asumsi", name: "Asumsi (Hari)" },
  { id: "estimasi", name: "Estimasi" },
  { id: "status", name: "Status" },
];

export default function PrintPreviewModal({ units, aplColumns, categoryName, isPlanPSMode, psStatuses = {}, psSelectedApls = {}, onClose }: PrintPreviewModalProps) {
  const [paperSize, setPaperSize] = useState("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");
  const [showHeader, setShowHeader] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [title, setTitle] = useState(isPlanPSMode ? "LAPORAN PLAN PS" : "STATUS SERVICE");
  const [subtitle, setSubtitle] = useState("");
  const [zoom, setZoom] = useState(1);
  const [hiddenMainCols, setHiddenMainCols] = useState<Record<string, boolean>>({});
  const [aplDisplayMode, setAplDisplayMode] = useState<'diagram' | 'angka'>('angka');
  const [showValueLabel, setShowValueLabel] = useState(true);
  const [hideNormalUnits, setHideNormalUnits] = useState(!!isPlanPSMode);

  const activeColumns = isPlanPSMode ? PLAN_PS_COLUMNS : MAIN_COLUMNS;
  const visibleMainCols = activeColumns.filter(c => !hiddenMainCols[c.id]);

  /* ── lock body scroll ── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function getRowData(u: any, i: number) {
    const isZero = !u.hours || u.hours === 0;

    // Filter APLs: Abaikan jika unconfigured (total 0 dan vault 0) atau vault <= 0
    const validApls = (u.aplData || []).filter((a: any) => {
      const isUnconfigured = (!a.total || a.total === 0) && (!a.vault || a.vault === 0);
      const hasVault = (a.vault ?? 0) > 0;
      return hasVault && !isUnconfigured;
    });

    const urgentApls = validApls.filter((a: any) => (a.input ?? 0) < 50);

    // Urgency calculation: strictly based on valid APLs
    let urgencyLevel: 'CRITICAL' | 'URGENT' | 'ATTENTION' | 'NORMAL' = 'NORMAL';
    if (!isZero && urgentApls.length > 0) {
      if (urgentApls.some((a: any) => (a.input ?? 0) < 0)) urgencyLevel = 'CRITICAL';
      else if (urgentApls.some((a: any) => (a.input ?? 0) > 0 && (a.input ?? 0) <= 10)) urgencyLevel = 'URGENT';
      else if (urgentApls.some((a: any) => (a.input ?? 0) > 10 && (a.input ?? 0) < 50)) urgencyLevel = 'ATTENTION';
    } else if (u.mostSevereLevel && u.mostSevereLevel !== 'NORMAL' && urgentApls.length > 0) {
      urgencyLevel = u.mostSevereLevel;
    }

    let urgBg = '#d1fae5';
    let urgText = '#065f46';
    if (urgencyLevel === 'CRITICAL') { urgBg = '#fee2e2'; urgText = '#b91c1c'; }
    else if (urgencyLevel === 'URGENT') { urgBg = '#fef3c7'; urgText = '#b45309'; }
    else if (urgencyLevel === 'ATTENTION') { urgBg = '#e0f2fe'; urgText = '#0369a1'; }

    // Selected Urgent APL matching servis.tsx
    const defaultUrgentApl = urgentApls.length > 0
      ? urgentApls.reduce((prev: any, curr: any) => (prev.input < curr.input ? prev : curr), urgentApls[0])
      : null;
    const selectedAplId = psSelectedApls[u.id] || defaultUrgentApl?.category_apl_id;
    const urgentApl = urgentApls.find((a: any) => a.category_apl_id === selectedAplId) || defaultUrgentApl;

    const vaultVal = urgentApl && urgentApl.vault ? `PS ${urgentApl.vault} H` : '-';
    const asumsi = urgentApl ? Math.round(urgentApl.input / 8) : 0;
    const asumsiDisplay = urgentApl ? String(asumsi) : '-';

    let estimasiStr = '-';
    if (urgentApl) {
      const d = new Date();
      d.setDate(d.getDate() + asumsi);
      estimasiStr = d.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Default status: Always 'Wait' matching servis.tsx
    const status = psStatuses[u.id] || 'Wait';
    let statusColor = '#dc2626';
    let statusBg = '#fee2e2';
    if (status === 'Progress') { statusColor = '#059669'; statusBg = '#d1fae5'; }
    if (status === 'Done') { statusColor = '#0284c7'; statusBg = '#e0f2fe'; }

    const brandStr = u.brand || "-";
    const typeStr = u.type?.name || 
      (typeof u.type === 'string' && u.type ? u.type : '') || 
      u.type_unit?.name || 
      (typeof u.type_unit === 'string' && u.type_unit ? u.type_unit : '') || 
      (typeof u.category === 'string' && u.category ? u.category : (u.category?.name || '')) || 
      '-';

    const picStr = u.pic || "-";
    const locationStr = u.location?.name || (typeof u.location === 'string' ? u.location : '') || "-";
    const operatorStr = u.operator?.full_name || u.operator?.name || (typeof u.operator === 'string' ? u.operator : '') || "-";

    return {
      isZero,
      urgencyLevel,
      urgBg,
      urgText,
      vaultVal,
      asumsi: asumsiDisplay,
      estimasiStr,
      status,
      statusColor,
      statusBg,
      code: u.code || u.unit_name || u.name || "-",
      brand: brandStr,
      type: typeStr,
      pic: picStr,
      location: locationStr,
      operator: operatorStr,
      hm: u.hm || 0,
      hours: u.hours || 0,
    };
  }

  const displayedUnits = React.useMemo(() => {
    if (isPlanPSMode && hideNormalUnits) {
      return units.filter(u => {
        const row = getRowData(u, 0);
        return row.urgencyLevel !== 'NORMAL';
      });
    }
    return units;
  }, [units, isPlanPSMode, hideNormalUnits, psStatuses, psSelectedApls]);

  /* ── build printable HTML string ── */
  function buildHTML(forPDF = false) {
    const thead = `
      <tr>
        ${visibleMainCols.map(c => {
          const isCenter = ["no", "urgency", "ps", "asumsi", "estimasi", "status"].includes(c.id);
          const isRight = ["hm", "hours"].includes(c.id);
          const align = isCenter ? "center" : (isRight ? "right" : "left");
          return `<th style="padding: 5px 7px; text-align: ${align}; font-size: 8pt;">${c.name}</th>`;
        }).join("")}
        ${!isPlanPSMode 
          ? aplColumns.map(c => `<th style="word-break:break-word;white-space:normal;min-width:60px;text-transform:capitalize;text-align:center;padding:5px 7px;font-size:8pt">${c.name.toLowerCase()}</th>`).join("")
          : ""
        }
      </tr>`;

    const tbody = displayedUnits.map((u, i) => {
      const row = getRowData(u, i);
      const rowStyle = row.isZero ? 'style="background:#fff1f2"' : (i % 2 === 0 ? 'style="background:#f8fafc"' : '');

      if (isPlanPSMode) {
        const cells = visibleMainCols.map(c => {
          if (c.id === "no") return `<td style="text-align:center">${i + 1}</td>`;
          if (c.id === "urgency") return `<td style="text-align:center"><span style="background:${row.urgBg};color:${row.urgText};padding:2px 7px;border-radius:9999px;font-weight:bold;font-size:7.5pt;text-transform:uppercase">${row.urgencyLevel}</span></td>`;
          if (c.id === "code") return `<td style="font-weight:bold;text-align:left">${row.code}</td>`;
          if (c.id === "brand") return `<td style="text-align:left">${row.brand}</td>`;
          if (c.id === "type") return `<td style="text-align:left">${row.type}</td>`;
          if (c.id === "pic") return `<td style="text-align:left">${row.pic}</td>`;
          if (c.id === "lokasi") return `<td style="text-align:left">${row.location}</td>`;
          if (c.id === "operator") return `<td style="text-align:left">${row.operator}</td>`;
          if (c.id === "ps") return `<td style="text-align:center;font-weight:bold">${row.vaultVal}</td>`;
          if (c.id === "asumsi") return `<td style="text-align:center">${row.asumsi}</td>`;
          if (c.id === "estimasi") return `<td style="text-align:center">${row.estimasiStr}</td>`;
          if (c.id === "status") return `<td style="text-align:center"><span style="background:${row.statusBg};color:${row.statusColor};padding:2px 6px;border-radius:4px;font-weight:bold;font-size:7.5pt;text-transform:uppercase">${row.status}</span></td>`;
          return "<td>-</td>";
        }).join("");

        return `<tr ${rowStyle}>${cells}</tr>`;
      }

      // Non-Plan PS Mode (Standard Servis Page with APL columns)
      const mainCells = visibleMainCols.map(c => {
        if (c.id === "no") return `<td style="text-align:center">${i + 1}</td>`;
        if (c.id === "code") return `<td style="font-weight:bold">${row.code}</td>`;
        if (c.id === "operator") return `<td>${row.operator}</td>`;
        if (c.id === "lokasi") return `<td>${row.location}</td>`;
        if (c.id === "hm") return `<td style="text-align:right">${row.hm}</td>`;
        if (c.id === "hours") {
          const col = row.isZero ? 'color:#b91c1c;font-weight:bold' : 'font-weight:bold';
          return `<td style="text-align:right;${col}">${row.hours}</td>`;
        }
        return "<td>-</td>";
      }).join("");

      const aplCells = aplColumns.map(col => {
        const rec = u.aplData?.find((a: any) => a.category_apl_id === col.id);
        const val = rec ? (rec.input ?? 0) : 0;
        const sc = STATUS_COLOR[getStatus(val)];
        
        if (aplDisplayMode === 'diagram') {
          const fillCount = Math.min(10, Math.max(1, Math.round((Math.abs(val) / 250) * 10)));
          const barBg = val <= -50 ? '#f43f5e' : val <= 0 ? '#f97316' : val < 50 ? '#f59e0b' : val < 150 ? '#4ade80' : '#34d399';
          
          let barsHtml = '';
          for (let bi = 9; bi >= 0; bi--) {
             const bg = (9 - bi) < fillCount ? barBg : '#e2e8f0';
             barsHtml += `<div style="flex:1; border-radius:1px; background:${bg};"></div>`;
          }
          
          return `<td style="text-align:center; vertical-align:middle;">
            <div style="display:flex; flex-direction:column; align-items:center; gap:2px;">
              <div style="display:flex; flex-direction:column; gap:1px; height:32px; width:8px;">
                ${barsHtml}
              </div>
              ${showValueLabel ? `<span style="font-size:7pt; font-weight:bold; color:${sc.text}">${val}</span>` : ''}
            </div>
          </td>`;
        } else {
          if (showStatus) {
            return `<td style="text-align:center"><span style="background:${sc.bg};color:${sc.text};padding:2px 5px;border-radius:3px;font-weight:bold;font-size:8pt">${showValueLabel ? val : ''}</span></td>`;
          }
          return `<td style="text-align:center">${showValueLabel ? val : ''}</td>`;
        }
      }).join("");

      return `<tr ${rowStyle}>${mainCells}${aplCells}</tr>`;
    }).join("");

    const headerBlock = showHeader ? `
      <div class="header">
        <div style="display: flex; align-items: center; gap: 16px;">
          <img src="/images/icon.png" alt="Logo" style="height: 72px; object-fit: contain;" />
          <div>
            <div class="doc-title">${title || "LAPORAN PLAN PS"}</div>
            ${subtitle ? `<div class="doc-sub">${subtitle}</div>` : ""}
            <div class="doc-meta">Dicetak: ${new Date().toLocaleString("id-ID")} &nbsp;|&nbsp; Total: ${displayedUnits.length} unit</div>
          </div>
        </div>
        <hr class="divider"/>
      </div>` : "";

    const dateStr = new Date().toLocaleDateString("id-ID", { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, "-");
    const safeCatName = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const documentTitle = `servis-${safeCatName}-${dateStr}`;

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${documentTitle}</title>
<style>
  @page { size: ${paperSize} ${orientation}; margin: 12mm 15mm; }
  * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-size: 9pt; color: #1e293b; }
  .header { margin-bottom: 10px; }
  .doc-title { font-size: 15pt; font-weight: bold; color: #1e3a8a; margin-bottom: 2px; }
  .doc-sub { font-size: 9pt; color: #64748b; }
  .doc-meta { font-size: 8pt; color: #94a3b8; margin-top: 3px; }
  .divider { border: none; border-top: 2px solid #1e40af; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
  thead tr { page-break-after: avoid; }
  tr { page-break-inside: avoid; }
  th { background: #1e40af; color: white; padding: 5px 7px; text-align: left; font-size: 8pt; }
  td { padding: 4px 7px; border-bottom: 1px solid #e2e8f0; font-size: 8.5pt; vertical-align: middle; }
  .legend { margin-top: 14px; font-size: 7.5pt; color: #475569; line-height: 1.5; border-top: 1px solid #cbd5e1; padding-top: 6px; }
</style>
</head>
<body>
${headerBlock}
<table>
  <thead>${thead}</thead>
  <tbody>${tbody}</tbody>
</table>
${showHeader ? (isPlanPSMode 
  ? `<div class="legend">
      <div style="font-weight:bold; color:#1e293b; margin-bottom:2px;">Keterangan Tingkat Urgensi:</div>
      <div>
        <span style="color:#b91c1c; font-weight:bold;">🔴 CRITICAL:</span> Telah melewati batas rekomendasi (&lt; 0 Jam) &nbsp;|&nbsp; 
        <span style="color:#b45309; font-weight:bold;">🟡 URGENT:</span> Sudah harus diganti (1 - 10 Jam) &nbsp;|&nbsp; 
        <span style="color:#0369a1; font-weight:bold;">🔵 ATTENTION:</span> Mendekati jadwal pemeliharaan (11 - 49 Jam) &nbsp;|&nbsp; 
        <span style="color:#065f46; font-weight:bold;">🟢 NORMAL:</span> Dalam batas normal (≥ 50 Jam) &nbsp;|&nbsp; 
        <span>Baris merah muda = Total Jam 0</span>
      </div>
    </div>`
  : `<div class="legend">
      🟥 Kritis (≤-50) &nbsp; 🟧 Waspada (≤0) &nbsp; 🟨 Perhatian (&lt;50) &nbsp; 🟩 Normal (&lt;150) &nbsp; 🟢 Aman (≥150) &nbsp; | &nbsp; Baris merah muda = Total Jam 0
    </div>`
) : ""}
</body>
</html>`;
  }

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(buildHTML());
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  }

  function handleSavePDF() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(buildHTML(true));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  /* ── preview rendering ── */
  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/70 p-4">
      <div className="flex flex-col w-full max-w-6xl max-h-[95vh] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
              <FaPrint size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Print Preview</h2>
              <p className="text-sm text-slate-500">{displayedUnits.length} unit dipilih</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer">
            <FaTimes size={16} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Settings Panel ── */}
          <div className="w-72 shrink-0 flex flex-col gap-5 p-5 border-r border-slate-200 dark:border-white/10 overflow-y-auto">

            {/* Judul */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">Judul Dokumen</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="LAPORAN PLAN PS"
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100" />
            </div>

            {/* Sub-judul */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">Sub-Judul / Keterangan</label>
              <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)}
                placeholder="Opsional..."
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100" />
            </div>

            {/* Ukuran Kertas */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">Ukuran Kertas</label>
              <div className="relative">
                <select value={paperSize} onChange={e => setPaperSize(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm outline-none appearance-none pr-8 text-slate-900 dark:text-slate-100">
                  {PAPER_SIZES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
              </div>
            </div>

            {/* Orientasi */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">Orientasi</label>
              <div className="flex rounded-xl border border-slate-300 dark:border-white/10 overflow-hidden text-sm font-semibold">
                {(["portrait", "landscape"] as const).map(o => (
                  <button key={o} onClick={() => setOrientation(o)}
                    className={`flex-1 py-2.5 capitalize transition-colors cursor-pointer ${orientation === o ? "bg-sky-500 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
                    {o === "portrait" ? "Portrait" : "Landscape"}
                  </button>
                ))}
              </div>
            </div>

            {/* Kolom Pilihan */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                {isPlanPSMode ? "Kolom Laporan Plan PS" : "Kolom Utama"}
              </label>
              <div className="flex flex-col gap-1">
                {activeColumns.map(col => (
                  <label key={col.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                    <input type="checkbox"
                      checked={!hiddenMainCols[col.id]}
                      onChange={() => setHiddenMainCols(p => ({ ...p, [col.id]: !p[col.id] }))}
                      className="rounded border-slate-300 text-sky-500 focus:ring-sky-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{col.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Opsi Tampilan Non-Plan PS */}
            {!isPlanPSMode && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Opsi Tampilan</label>
                  {[
                    { label: "Tampilkan Header", val: showHeader, set: setShowHeader },
                    { label: "Warna Status APL", val: showStatus, set: setShowStatus },
                  ].map(({ label, val, set }) => (
                    <label key={label} className="flex items-center justify-between gap-3 mb-2 cursor-pointer">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                      <div onClick={() => set(v => !v)}
                        className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${val ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${val ? "translate-x-5" : "translate-x-0"}`} />
                      </div>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Tampilan Kolom APL</label>
                  <div className="flex rounded-xl border border-slate-300 dark:border-white/10 overflow-hidden text-xs font-semibold mb-2">
                    <button onClick={() => setAplDisplayMode('angka')}
                      className={`flex-1 py-2.5 transition-colors cursor-pointer ${aplDisplayMode === 'angka' ? 'bg-slate-700 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                      123 Angka
                    </button>
                    <button onClick={() => setAplDisplayMode('diagram')}
                      className={`flex-1 py-2.5 border-l border-slate-300 dark:border-white/10 transition-colors cursor-pointer ${aplDisplayMode === 'diagram' ? 'bg-slate-700 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                      ▐ Diagram
                    </button>
                  </div>
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span className="text-sm text-slate-700 dark:text-slate-300">Tampilkan Label Angka</span>
                    <div onClick={() => setShowValueLabel(v => !v)}
                      className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${showValueLabel ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${showValueLabel ? "translate-x-5" : "translate-x-0"}`} />
                    </div>
                  </label>
                </div>
              </>
            )}

            {isPlanPSMode && (
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Opsi Tampilan</label>
                <label className="flex items-center justify-between gap-3 mb-2 cursor-pointer">
                  <span className="text-sm text-slate-700 dark:text-slate-300">Sembunyikan Unit Normal</span>
                  <div onClick={() => setHideNormalUnits(v => !v)}
                    className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${hideNormalUnits ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${hideNormalUnits ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </label>
                <label className="flex items-center justify-between gap-3 mb-2 cursor-pointer">
                  <span className="text-sm text-slate-700 dark:text-slate-300">Tampilkan Header</span>
                  <div onClick={() => setShowHeader(v => !v)}
                    className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${showHeader ? "bg-sky-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${showHeader ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                </label>
              </div>
            )}

            {/* Legend in sidebar */}
            <div className="text-xs text-slate-400 border-t border-slate-200 dark:border-white/10 pt-3 flex flex-col gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Keterangan Tingkat Urgensi:</span>
              {isPlanPSMode ? (
                <div className="flex flex-col gap-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-bold text-rose-600 dark:text-rose-400">CRITICAL:</span> 
                    <span className="text-slate-500 dark:text-slate-400">&lt; 0 Jam (Lewat batas)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-bold text-amber-600 dark:text-amber-400">URGENT:</span> 
                    <span className="text-slate-500 dark:text-slate-400">1 - 10 Jam (Harus ganti)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                    <span className="font-bold text-sky-600 dark:text-sky-400">ATTENTION:</span> 
                    <span className="text-slate-500 dark:text-slate-400">11 - 49 Jam (Mendekati)</span>
                  </div>
                </div>
              ) : (
                <span className="text-[11px] text-slate-500">APL interval warning status</span>
              )}
              <div className="pt-1.5 border-t border-slate-200 dark:border-white/5 text-[11px]">
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-rose-100 border border-rose-300 inline-block shrink-0" />
                  Merah muda = Total Jam = 0
                </span>
              </div>
            </div>
          </div>

          {/* ── Preview Area ── */}
          <div className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-800 p-6 flex justify-center items-start">
            <div
              ref={previewRef}
              className="bg-white shadow-2xl rounded"
              style={{
                width: orientation === "landscape" ? 950 : 680,
                minHeight: orientation === "landscape" ? 640 : 900,
                padding: "28px 32px",
                fontFamily: "Arial, sans-serif",
                fontSize: 9,
                color: "#1e293b",
                flexShrink: 0,
                transform: `scale(${zoom})`,
                transformOrigin: "top center"
              }}
            >
              {/* Preview Header */}
              {showHeader && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/icon.png" alt="Logo" style={{ height: 72, objectFit: "contain" }} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: "bold", color: "#1e3a8a" }}>{title || "LAPORAN PLAN PS"}</div>
                      {subtitle && <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{subtitle}</div>}
                      <div style={{ fontSize: 8, color: "#94a3b8", marginTop: 3 }}>
                        Dicetak: {new Date().toLocaleString("id-ID")} &nbsp;|&nbsp; Total: {displayedUnits.length} unit
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: "2px solid #1e40af", marginTop: 8, marginBottom: 10 }} />
                </div>
              )}

              {/* Preview Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 8 }}>
                  <thead>
                    <tr style={{ background: "#1e40af", color: "white" }}>
                      {visibleMainCols.map(c => {
                        const isCenter = ["no", "urgency", "ps", "asumsi", "estimasi", "status"].includes(c.id);
                        const isRight = ["hm", "hours"].includes(c.id);
                        const align = isCenter ? "center" : (isRight ? "right" : "left");
                        return (
                          <th key={c.id} style={{ padding: "5px 7px", textAlign: align as any, fontSize: 8 }}>
                            {c.name}
                          </th>
                        );
                      })}
                      {!isPlanPSMode && (
                        aplColumns.map(c => (
                          <th key={c.id} style={{ padding: "5px 7px", textAlign: "center", fontSize: 8, wordBreak: "break-word", whiteSpace: "normal", minWidth: 60, textTransform: "capitalize" }}>
                            {c.name.toLowerCase()}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedUnits.map((u, i) => {
                      const row = getRowData(u, i);
                      const trBg = row.isZero ? "#fff1f2" : (i % 2 === 0 ? "#f8fafc" : "");
                      
                      if (isPlanPSMode) {
                        return (
                          <tr key={i} style={{ backgroundColor: trBg }}>
                            {visibleMainCols.map(c => {
                              let cellContent: React.ReactNode = "-";
                              let style: React.CSSProperties = { padding: "4px 7px", borderBottom: "1px solid #e2e8f0", fontSize: 8.5, verticalAlign: "middle" };

                              if (c.id === "no") {
                                cellContent = i + 1;
                                style.textAlign = "center";
                              } else if (c.id === "urgency") {
                                cellContent = <span style={{ background: row.urgBg, color: row.urgText, padding: "2px 7px", borderRadius: 9999, fontWeight: "bold", fontSize: 7.5, textTransform: "uppercase" }}>{row.urgencyLevel}</span>;
                                style.textAlign = "center";
                              } else if (c.id === "code") {
                                cellContent = row.code;
                                style.fontWeight = "bold";
                              } else if (c.id === "brand") {
                                cellContent = row.brand;
                              } else if (c.id === "type") {
                                cellContent = row.type;
                              } else if (c.id === "pic") {
                                cellContent = row.pic;
                              } else if (c.id === "lokasi") {
                                cellContent = row.location;
                              } else if (c.id === "operator") {
                                cellContent = row.operator;
                              } else if (c.id === "ps") {
                                cellContent = row.vaultVal;
                                style.textAlign = "center";
                                style.fontWeight = "bold";
                              } else if (c.id === "asumsi") {
                                cellContent = row.asumsi;
                                style.textAlign = "center";
                              } else if (c.id === "estimasi") {
                                cellContent = row.estimasiStr;
                                style.textAlign = "center";
                              } else if (c.id === "status") {
                                cellContent = <span style={{ background: row.statusBg, color: row.statusColor, padding: "2px 6px", borderRadius: 4, fontWeight: "bold", fontSize: 7.5, textTransform: "uppercase" }}>{row.status}</span>;
                                style.textAlign = "center";
                              }

                              return <td key={c.id} style={style}>{cellContent}</td>;
                            })}
                          </tr>
                        );
                      }

                      return (
                        <tr key={i} style={{ backgroundColor: trBg }}>
                          {visibleMainCols.map(c => {
                            let val: any = "-";
                            let colStyle: any = { padding: "4px 7px", borderBottom: "1px solid #e2e8f0", fontSize: 8.5, verticalAlign: "middle" };
                            
                            if (c.id === "no") { val = i + 1; colStyle.textAlign = "center"; }
                            else if (c.id === "code") { val = row.code; colStyle.fontWeight = "bold"; }
                            else if (c.id === "operator") { val = row.operator; }
                            else if (c.id === "lokasi") { val = row.location; }
                            else if (c.id === "hm") { val = row.hm; colStyle.textAlign = "right"; }
                            else if (c.id === "hours") {
                              val = row.hours;
                              colStyle.textAlign = "right";
                              colStyle.fontWeight = "bold";
                              if (row.isZero) colStyle.color = "#b91c1c";
                            }

                            return <td key={c.id} style={colStyle}>{val}</td>;
                          })}

                          {aplColumns.map(col => {
                            const rec = u.aplData?.find((a: any) => a.category_apl_id === col.id);
                            const val = rec ? (rec.input ?? 0) : 0;
                            const sc = STATUS_COLOR[getStatus(val)];
                            if (aplDisplayMode === 'diagram') {
                              const fillCount = Math.min(10, Math.max(1, Math.round((Math.abs(val) / 250) * 10)));
                              const barBg = val <= -50 ? '#f43f5e' : val <= 0 ? '#f97316' : val < 50 ? '#f59e0b' : val < 150 ? '#4ade80' : '#34d399';
                              return (
                                <td key={col.id} style={{ padding: "3px 7px", borderBottom: "1px solid #e2e8f0", textAlign: "center", verticalAlign: "middle" }}>
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                    <div style={{ display: "flex", flexDirection: "column-reverse", gap: 1, height: 32, width: 8 }}>
                                      {Array.from({ length: 10 }).map((_, bi) => (
                                        <div key={bi} style={{ flex: 1, borderRadius: 1, background: bi < fillCount ? barBg : '#e2e8f0' }} />
                                      ))}
                                    </div>
                                    {showValueLabel && <span style={{ fontSize: 7, fontWeight: 'bold', color: sc.text }}>{val}</span>}
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <td key={col.id} style={{ padding: "3px 7px", borderBottom: "1px solid #e2e8f0", textAlign: "center" }}>
                                {showStatus
                                  ? <span style={{ background: sc.bg, color: sc.text, padding: "1px 5px", borderRadius: 3, fontWeight: "bold", fontSize: 7 }}>
                                    {showValueLabel ? val : ''}
                                  </span>
                                  : showValueLabel ? <span style={{ fontSize: 8 }}>{val}</span> : null}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend in preview */}
              {showHeader && (
                <div style={{ marginTop: 12, fontSize: 8, color: "#64748b", borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
                  {isPlanPSMode ? (
                    <div>
                      <div style={{ fontWeight: "bold", color: "#1e293b", marginBottom: 2 }}>Keterangan Tingkat Urgensi:</div>
                      <div>
                        <span style={{ color: "#b91c1c", fontWeight: "bold" }}>🔴 CRITICAL:</span> Telah melewati batas rekomendasi (&lt; 0 Jam) &nbsp;|&nbsp;{" "}
                        <span style={{ color: "#b45309", fontWeight: "bold" }}>🟡 URGENT:</span> Sudah harus diganti (1 - 10 Jam) &nbsp;|&nbsp;{" "}
                        <span style={{ color: "#0369a1", fontWeight: "bold" }}>🔵 ATTENTION:</span> Mendekati jadwal pemeliharaan (11 - 49 Jam) &nbsp;|&nbsp;{" "}
                        <span style={{ color: "#065f46", fontWeight: "bold" }}>🟢 NORMAL:</span> Dalam batas normal (≥ 50 Jam) &nbsp;|&nbsp;{" "}
                        <span>Baris merah muda = Total Jam 0</span>
                      </div>
                    </div>
                  ) : (
                    "🟥 Kritis (≤-50) \u00A0 🟧 Waspada (≤0) \u00A0 🟨 Perhatian (<50) \u00A0 🟩 Normal (<150) \u00A0 🟢 Aman (≥150) \u00A0|\u00A0 Baris merah muda = Total Jam 0"
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onClose}
              className="rounded-xl border border-slate-300 dark:border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
              Batal
            </button>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-200 dark:border-white/5">
              <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 transition shadow-sm cursor-pointer" title="Zoom Out">
                <FaSearchMinus size={12} />
              </button>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-500 transition shadow-sm cursor-pointer" title="Zoom In">
                <FaSearchPlus size={12} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSavePDF}
              className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition cursor-pointer">
              <FaFilePdf size={14} /> Unduh PDF
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition shadow-md shadow-sky-500/30 cursor-pointer">
              <FaPrint size={14} /> Cetak Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
