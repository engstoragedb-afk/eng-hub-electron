"use client";
import { useState, useEffect, useRef } from "react";
import { FaTimes, FaPrint, FaChevronDown, FaFilePdf } from "react-icons/fa";

interface PrintPreviewModalProps {
  units: any[];
  aplColumns: { id: string; name: string }[];
  categoryName: string;
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

export default function PrintPreviewModal({ units, aplColumns, categoryName, onClose }: PrintPreviewModalProps) {
  const [paperSize, setPaperSize] = useState("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("landscape");
  const [showHeader, setShowHeader] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [title, setTitle] = useState("Laporan Servis Unit");
  const [subtitle, setSubtitle] = useState("");
  const [hiddenMainCols, setHiddenMainCols] = useState<Record<string, boolean>>({});
  const [aplDisplayMode, setAplDisplayMode] = useState<'diagram' | 'angka'>('angka');
  const [showValueLabel, setShowValueLabel] = useState(true);

  const visibleMainCols = MAIN_COLUMNS.filter(c => !hiddenMainCols[c.id]);

  /* ── lock body scroll ── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ── build printable HTML string ── */
  function buildHTML(forPDF = false) {
    const isZeroFn = (u: any) => !u.hours || u.hours === 0;

    const thead = `
      <tr>
        ${visibleMainCols.map(c => `<th>${c.name}</th>`).join("")}
        ${aplColumns.map(c => `<th style="word-break:break-word;white-space:normal;min-width:60px;text-transform:capitalize">${c.name.toLowerCase()}</th>`).join("")}
      </tr>`;

    const tbody = units.map((u, i) => {
      const zero = isZeroFn(u);
      const rowStyle = zero ? 'style="background:#fff1f2"' : (i % 2 === 0 ? 'style="background:#f8fafc"' : '');

      const mainCells = visibleMainCols.map(c => {
        if (c.id === "no") return `<td style="text-align:center">${i + 1}</td>`;
        if (c.id === "code") return `<td style="font-weight:bold">${u.code || "-"}</td>`;
        if (c.id === "operator") return `<td>${u.operator?.full_name || u.operator?.name || "-"}</td>`;
        if (c.id === "lokasi") return `<td>${u.location?.name || (typeof u.location === "string" ? u.location : "-")}</td>`;
        if (c.id === "hm") return `<td style="text-align:right">${u.hm || 0}</td>`;
        if (c.id === "hours") {
          const col = zero ? 'color:#b91c1c;font-weight:bold' : 'font-weight:bold';
          return `<td style="text-align:right;${col}">${u.hours || 0}</td>`;
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
        <div class="doc-title">${title || "Laporan Servis Unit"}</div>
        ${subtitle ? `<div class="doc-sub">${subtitle}</div>` : ""}
        <div class="doc-meta">Dicetak: ${new Date().toLocaleString("id-ID")} &nbsp;|&nbsp; Total: ${units.length} unit</div>
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
  .legend { margin-top: 12px; font-size: 7pt; color: #64748b; }
</style>
</head>
<body>
${headerBlock}
<table>
  <thead>${thead}</thead>
  <tbody>${tbody}</tbody>
</table>
${showHeader ? `<div class="legend">🟥 Kritis (≤-50) &nbsp; 🟧 Waspada (≤0) &nbsp; 🟨 Perhatian (<50) &nbsp; 🟩 Normal (<150) &nbsp; 🟢 Aman (≥150) &nbsp; | &nbsp; Baris merah muda = Total Jam 0</div>` : ""}
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
    // browser/Electron will show print dialog; user selects "Save as PDF"
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
              <p className="text-sm text-slate-500">{units.length} unit dipilih</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition">
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
                placeholder="Laporan Servis Unit"
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
                    className={`flex-1 py-2.5 capitalize transition-colors ${orientation === o ? "bg-sky-500 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
                    {o === "portrait" ? "Portrait" : "Landscape"}
                  </button>
                ))}
              </div>
            </div>

            {/* Kolom Utama */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Kolom Utama</label>
              <div className="flex flex-col gap-1">
                {MAIN_COLUMNS.map(col => (
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

            {/* Opsi Tampilan */}
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

            {/* Tampilan APL */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Tampilan Kolom APL</label>
              <div className="flex rounded-xl border border-slate-300 dark:border-white/10 overflow-hidden text-xs font-semibold mb-2">
                <button onClick={() => setAplDisplayMode('angka')}
                  className={`flex-1 py-2.5 transition-colors ${aplDisplayMode === 'angka' ? 'bg-slate-700 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  123 Angka
                </button>
                <button onClick={() => setAplDisplayMode('diagram')}
                  className={`flex-1 py-2.5 border-l border-slate-300 dark:border-white/10 transition-colors ${aplDisplayMode === 'diagram' ? 'bg-slate-700 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
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

            {/* Legend */}
            <div className="text-xs text-slate-400 border-t border-slate-200 dark:border-white/10 pt-3">
              <span className="font-semibold block mb-1">Keterangan warna baris:</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-rose-100 border border-rose-300 inline-block" />
                Merah muda = Total Jam = 0
              </span>
            </div>
          </div>

          {/* ── Preview Area ── */}
          <div className="flex-1 overflow-auto bg-slate-200 dark:bg-slate-800 p-6 flex justify-center items-start">
            <div
              ref={previewRef}
              className="bg-white shadow-2xl rounded"
              style={{
                width: orientation === "landscape" ? 900 : 640,
                minHeight: orientation === "landscape" ? 640 : 900,
                padding: "28px 32px",
                fontFamily: "Arial, sans-serif",
                fontSize: 9,
                color: "#1e293b",
                flexShrink: 0,
              }}
            >
              {/* Preview Header */}
              {showHeader && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: "bold", color: "#1e3a8a" }}>{title || "Laporan Servis Unit"}</div>
                  {subtitle && <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{subtitle}</div>}
                  <div style={{ fontSize: 8, color: "#94a3b8", marginTop: 3 }}>
                    Dicetak: {new Date().toLocaleString("id-ID")} &nbsp;|&nbsp; Total: {units.length} unit
                  </div>
                  <div style={{ borderTop: "2px solid #1e40af", marginTop: 8, marginBottom: 10 }} />
                </div>
              )}

              {/* Preview Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 8 }}>
                  <thead>
                    <tr>
                      {visibleMainCols.map(c => (
                        <th key={c.id} style={{ background: "#1e40af", color: "white", padding: "5px 7px", textAlign: "left", fontSize: 8, fontWeight: "bold", whiteSpace: "nowrap" }}>
                          {c.name}
                        </th>
                      ))}
                      {aplColumns.map(c => (
                        <th key={c.id} style={{ background: "#1e40af", color: "white", padding: "5px 7px", textAlign: "center", fontSize: 8, fontWeight: "bold", minWidth: 55, wordBreak: "break-word", whiteSpace: "normal", textTransform: "capitalize" }}>
                          {c.name.toLowerCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u, i) => {
                      const isZero = !u.hours || u.hours === 0;
                      const rowBg = isZero ? "#fff1f2" : i % 2 === 0 ? "#f8fafc" : "white";
                      return (
                        <tr key={u.id || i} style={{ background: rowBg }}>
                          {visibleMainCols.map(c => {
                            if (c.id === "no") return <td key={c.id} style={{ padding: "3px 7px", borderBottom: "1px solid #e2e8f0", textAlign: "center", color: "#64748b" }}>{i + 1}</td>;
                            if (c.id === "code") return <td key={c.id} style={{ padding: "3px 7px", borderBottom: "1px solid #e2e8f0", fontWeight: "bold" }}>{u.code || "-"}</td>;
                            if (c.id === "operator") return <td key={c.id} style={{ padding: "3px 7px", borderBottom: "1px solid #e2e8f0" }}>{u.operator?.full_name || u.operator?.name || "-"}</td>;
                            if (c.id === "lokasi") return <td key={c.id} style={{ padding: "3px 7px", borderBottom: "1px solid #e2e8f0", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>{u.location?.name || (typeof u.location === "string" ? u.location : "-")}</td>;
                            if (c.id === "hm") return <td key={c.id} style={{ padding: "3px 7px", borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>{u.hm || 0}</td>;
                            if (c.id === "hours") return <td key={c.id} style={{ padding: "3px 7px", borderBottom: "1px solid #e2e8f0", textAlign: "right", fontWeight: "bold", color: isZero ? "#b91c1c" : undefined }}>{u.hours || 0}</td>;
                            return <td key={c.id}>-</td>;
                          })}
                          {aplColumns.map(col => {
                            const rec = u.aplData?.find((a: any) => a.category_apl_id === col.id);
                            const val = rec ? (rec.input ?? 0) : 0;
                            const sc = STATUS_COLOR[getStatus(val)];
                            if (aplDisplayMode === 'diagram') {
                              // Bar diagram in preview
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
                <div style={{ marginTop: 10, fontSize: 7, color: "#94a3b8" }}>
                  🟥 Kritis (≤-50) &nbsp; 🟧 Waspada (≤0) &nbsp; 🟨 Perhatian (&lt;50) &nbsp; 🟩 Normal (&lt;150) &nbsp; 🟢 Aman (≥150) &nbsp;|&nbsp; Baris merah muda = Total Jam 0
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-white/10 shrink-0">
          <button onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Batal
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleSavePDF}
              className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition">
              <FaFilePdf size={14} /> Unduh PDF
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition shadow-md shadow-sky-500/30">
              <FaPrint size={14} /> Cetak Sekarang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
