import React, { useState, useEffect, useRef } from "react";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import Head from "next/head";
import { useRouter } from "next/router";
import { FaChevronLeft, FaChevronRight, FaFileExcel, FaSearch, FaColumns, FaTimes, FaUpload, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { categoryUnitsService, unitService } from "@/services";
import * as XLSX from "xlsx";
import { createPortal } from "react-dom";

const FIXED_COLUMNS = [
  { id: "no", name: "No", defaultWidth: 60, align: "center" },
  { id: "code", name: "Code / Nama Alat", defaultWidth: 150, align: "left" },
  { id: "operator", name: "Operator", defaultWidth: 180, align: "left" },
  { id: "lokasi", name: "Lokasi", defaultWidth: 150, align: "left" },
  { id: "hm", name: "HM", defaultWidth: 100, align: "right" },
  { id: "hours", name: "Total Jam", defaultWidth: 120, align: "right" },
];

export default function MaintenanceServisPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [detailsData, setDetailsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("Semua");
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({});
  const [collapsedCols, setCollapsedCols] = useState<Record<string, boolean>>({});
  const [isFloatingSearchOpen, setIsFloatingSearchOpen] = useState(false);
  const floatingSearchRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ notUpdated: any[] } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    try {
      const savedHidden = localStorage.getItem('servis_hidden_columns');
      if (savedHidden) setHiddenColumns(JSON.parse(savedHidden));
      const savedCollapsed = localStorage.getItem('servis_collapsed_cols');
      if (savedCollapsed) setCollapsedCols(JSON.parse(savedCollapsed));
    } catch {}
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsFloatingSearchOpen(true);
        setTimeout(() => floatingSearchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setIsFloatingSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    try { localStorage.setItem('servis_hidden_columns', JSON.stringify(hiddenColumns)); } catch {}
  }, [hiddenColumns]);

  useEffect(() => {
    try { localStorage.setItem('servis_collapsed_cols', JSON.stringify(collapsedCols)); } catch {}
  }, [collapsedCols]);


  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedCols(prev => ({ ...prev, [id]: !prev[id] }));
  };

  let currentLeft = 0;
  const visibleFixedCols = FIXED_COLUMNS.filter(col => !hiddenColumns[col.id]);
  const fixedColsWithLeft = visibleFixedCols.map(col => {
    const width = collapsedCols[col.id] ? 50 : col.defaultWidth;
    const left = currentLeft;
    currentLeft += width;
    return { ...col, width, left };
  });

  useEffect(() => {
    if (!activeCategoryId) return;
    setIsLoading(true);
    setLocationFilter("Semua");
    unitService.getUnitsDetailsByCategory(activeCategoryId)
      .then((data) => {
        setDetailsData(data || []);
      })
      .catch((err) => console.error("Failed to fetch unit details:", err))
      .finally(() => setIsLoading(false));
  }, [activeCategoryId]);

  const aplColumns = React.useMemo(() => {
    const cols = new Map<string, string>();
    detailsData.forEach(item => {
      item.aplData?.forEach((apl: any) => {
        cols.set(apl.category_apl_id, apl.name); 
      });
    });
    return Array.from(cols.entries()).map(([id, name]) => ({ id, name }));
  }, [detailsData]);

  const visibleAplColumns = React.useMemo(() => {
    return aplColumns.filter(col => !hiddenColumns[col.id]);
  }, [aplColumns, hiddenColumns]);

  const uniqueLocations = React.useMemo(() => {
    const locs = new Set<string>();
    detailsData.forEach(u => {
      const locName = u.location?.name || (typeof u.location === 'string' ? u.location : '-');
      if (locName && locName !== '-') locs.add(locName);
    });
    return Array.from(locs).sort();
  }, [detailsData]);

  const filteredData = React.useMemo(() => {
    return detailsData.filter(u => {
      const codeMatch = (u.code || "").toLowerCase().includes(searchTerm.toLowerCase());
      const opName = (u.operator?.full_name || u.operator?.name || "").toLowerCase();
      const opMatch = opName.includes(searchTerm.toLowerCase());
      
      const locName = u.location?.name || (typeof u.location === 'string' ? u.location : '-');
      const locMatch = locationFilter === "Semua" || locName === locationFilter;

      return (codeMatch || opMatch) && locMatch;
    });
  }, [detailsData, searchTerm, locationFilter]);

  useEffect(() => {
    categoryUnitsService.getAll()
      .then((data) => {
        if (data) {
          const formatted = data
            .filter((item: any) => item.name !== "NULL" && item.name !== "equipment_group")
            .map((item: any) => ({
              id: item.id,
              name: item.name,
              count: item.units,
            }));
          setCategories(formatted);
          if (formatted.length > 0) {
            setActiveCategoryId(formatted[0].id);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch category units:", err));
  }, []);

  const exportToExcel = () => {
    if (filteredData.length === 0) return;

    const headers = [
      ...visibleFixedCols.map(col => col.name),
      ...visibleAplColumns.map(col => col.name),
    ];

    const rows = filteredData.map((u, index) => {
      const row: any = {};
      visibleFixedCols.forEach(col => {
        if (col.id === 'no') row[col.name] = index + 1;
        else if (col.id === 'code') row[col.name] = u.code || '';
        else if (col.id === 'operator') row[col.name] = u.operator?.full_name || u.operator?.name || '';
        else if (col.id === 'lokasi') row[col.name] = u.location?.name || (typeof u.location === 'string' ? u.location : '');
        else if (col.id === 'hm') row[col.name] = u.hm || 0;
        else if (col.id === 'hours') row[col.name] = u.hours || 0;
      });
      visibleAplColumns.forEach(col => {
        const aplRecord = u.aplData?.find((a: any) => a.category_apl_id === col.id);
        row[col.name] = aplRecord ? (aplRecord.input ?? 0) : 0;
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

    // Styling header row bold
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddr]) continue;
      ws[cellAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'D9EAF7' } } };
    }

    // Auto column width
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 14) }));

    const wb = XLSX.utils.book_new();
    const activeCategory = categories.find(c => c.id === activeCategoryId);
    const categoryName = activeCategory ? activeCategory.name.replace(/\s+/g, '_') : 'Semua';
    XLSX.utils.book_append_sheet(wb, ws, categoryName.slice(0, 31));
    XLSX.writeFile(wb, `Data_Servis_${categoryName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';
    setIsImporting(true);
    try {
      const notUpdated = await unitService.uploadHoursFromExcel(file);
      setImportResult({ notUpdated: notUpdated || [] });
      // Refresh data
      if (activeCategoryId) {
        unitService.getUnitsDetailsByCategory(activeCategoryId).then(d => setDetailsData(d || []));
      }
    } catch (err: any) {
      setImportResult({ notUpdated: [{ reason: err?.response?.data?.message || err?.message || 'Terjadi kesalahan saat import.' }] });
    } finally {
      setIsImporting(false);
    }
  };


  return (
    <>
      <Head>
        <title>Servis Unit - ENG HUB</title>
      </Head>
      <MaintenanceLayout title="Servis Unit" subtitle="Kelola dan pantau jadwal servis unit secara menyeluruh">

        {/* Floating Search Bar (CMD+F / CTRL+F) */}
        <div
          className={`fixed top-0 left-0 right-0 z-[200] flex justify-center transition-transform duration-300 ease-out ${
            isFloatingSearchOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="mt-3 w-full max-w-xl mx-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex items-center gap-3 px-4 py-3">
            <FaSearch className="text-slate-400 shrink-0" size={14} />
            <input
              ref={floatingSearchRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kode unit atau nama operator..."
              className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none"
            />
            {searchTerm && (
              <span className="text-xs text-slate-400 shrink-0">
                {filteredData.length} hasil
              </span>
            )}
            <button
              onClick={() => { setIsFloatingSearchOpen(false); setSearchTerm(''); }}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0"
            >
              <FaTimes size={12} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-4">
          
          {/* Header Action & Tabs Kategori */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide flex-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeCategoryId === cat.id 
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/20 border border-sky-400" 
                      : "bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {cat.name}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeCategoryId === cat.id ? "bg-white/25 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}>
                    {cat.count || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Import input (hidden) */}
            <input
              ref={importInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportExcel}
            />

            <div className="flex items-center gap-2 shrink-0">
              {/* Import Button */}
              <button
                onClick={() => importInputRef.current?.click()}
                disabled={isImporting}
                className="flex items-center justify-center gap-2 rounded-xl border border-violet-500/50 bg-violet-500/10 px-5 py-2.5 text-sm font-semibold text-violet-600 dark:text-violet-400 transition hover:bg-violet-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title="Import HM dari file Excel (format khusus)"
              >
                {isImporting ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Mengimport...</>
                ) : (
                  <><FaUpload size={14} /> Import Excel</>
                )}
              </button>

              {/* Export Button */}
              <button
                onClick={exportToExcel}
                disabled={isLoading || filteredData.length === 0}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 transition hover:bg-emerald-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaFileExcel size={16} /> Export Excel
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kode unit atau nama operator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500/50 transition-colors"
              />
            </div>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500/50 transition-colors sm:min-w-[200px]"
            >
              <option value="Semua">Semua Lokasi</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            
            <div className="relative">
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <FaColumns /> Kolom Tabel
              </button>
              
              {showColumnMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-2 shadow-xl z-50">
                  <div className="mb-2 px-2 pb-2 border-b border-slate-100 dark:border-white/10 text-xs font-bold text-slate-500 uppercase">
                    Tampilkan Kolom
                  </div>
                  <div className="max-h-64 overflow-y-auto flex flex-col gap-1 scrollbar-hide">
                    <div className="px-2 py-1 mt-1 text-[10px] font-bold text-slate-400">KOLOM UTAMA</div>
                    {FIXED_COLUMNS.map(col => (
                      <label key={col.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={!hiddenColumns[col.id]}
                          onChange={() => setHiddenColumns(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
                          className="rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{col.name}</span>
                      </label>
                    ))}

                    <div className="px-2 py-1 mt-3 border-t border-slate-100 dark:border-white/5 pt-3 text-[10px] font-bold text-slate-400">KOLOM APL</div>
                    {aplColumns.map(col => (
                      <label key={col.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={!hiddenColumns[col.id]}
                          onChange={() => setHiddenColumns(prev => ({ ...prev, [col.id]: !prev[col.id] }))}
                          className="rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{col.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm mt-2">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                <tr>
                  {fixedColsWithLeft.map((col, idx) => {
                    const isLast = idx === fixedColsWithLeft.length - 1;
                    const isCollapsed = collapsedCols[col.id];
                    return (
                      <th 
                        key={col.id}
                        style={{ left: col.left, width: col.width, minWidth: col.width, maxWidth: col.width }}
                        className={`${isCollapsed ? 'px-2' : 'px-4'} py-4 whitespace-nowrap border-r border-slate-200 dark:border-white/5 sticky z-20 bg-slate-50 dark:bg-slate-800 transition-all duration-300 ${isLast ? 'shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_10px_-4px_rgba(255,255,255,0.05)]' : ''}`}
                      >
                        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
                          {!isCollapsed && <span className="truncate">{col.name}</span>}
                          <button 
                            onClick={(e) => toggleCollapse(col.id, e)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
                            title={isCollapsed ? "Perbesar" : "Perkecil"}
                          >
                            {isCollapsed ? <FaChevronRight size={12} /> : <FaChevronLeft size={12} />}
                          </button>
                        </div>
                      </th>
                    );
                  })}
                  {visibleAplColumns.map(col => (
                    <th 
                      key={col.id} 
                      style={{ width: 120, minWidth: 120, maxWidth: 120 }}
                      className="px-4 py-4 whitespace-nowrap border-r border-slate-200 dark:border-white/5 text-center transition-all duration-300 overflow-hidden"
                    >
                      <div className="truncate w-full" title={col.name}>{col.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                {isLoading ? (
                  <tr><td colSpan={6 + visibleAplColumns.length} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500 dark:border-white/10 dark:border-t-sky-500" />
                      <p>Memuat data...</p>
                    </div>
                  </td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={6 + visibleAplColumns.length} className="p-8 text-center text-slate-500">Tidak ada data unit yang sesuai.</td></tr>
                ) : (
                  filteredData.map((u, index) => {
                    return (
                      <tr 
                        key={u.id || index} 
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        onClick={() => router.push(`/maintenance/detail-unit?id=${u.id}`)}
                      >
                        {fixedColsWithLeft.map((col, idx) => {
                          const isLast = idx === fixedColsWithLeft.length - 1;
                          const isCollapsed = collapsedCols[col.id];
                          let content: React.ReactNode = "-";
                          
                          if (col.id === 'no') content = index + 1;
                          else if (col.id === 'code') content = <span className="font-bold text-slate-900 dark:text-white">{u.code || '-'}</span>;
                          else if (col.id === 'operator') content = u.operator?.full_name || u.operator?.name || '-';
                          else if (col.id === 'lokasi') content = u.location?.name || (typeof u.location === 'string' ? u.location : '-');
                          else if (col.id === 'hm') content = <span className="font-semibold">{u.hm || 0}</span>;
                          else if (col.id === 'hours') content = <span className="font-semibold">{u.hours || 0}</span>;

                          return (
                            <td 
                              key={col.id}
                              style={{ left: col.left, width: col.width, minWidth: col.width, maxWidth: col.width }}
                              className={`${isCollapsed ? 'px-2 whitespace-nowrap' : 'px-4 whitespace-normal break-words'} py-4 border-r border-slate-200 dark:border-white/5 sticky z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-all duration-300 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} ${isLast ? 'shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_10px_-4px_rgba(255,255,255,0.05)]' : ''}`}
                            >
                              {isCollapsed ? (
                                <div className="w-full flex justify-center text-slate-400">...</div>
                              ) : (
                                <div className="w-full">{content}</div>
                              )}
                            </td>
                          );
                        })}
                        {visibleAplColumns.map(col => {
                          const aplRecord = u.aplData?.find((a: any) => a.category_apl_id === col.id);
                          const val = aplRecord ? (aplRecord.input || 0) : 0;
                          
                          let barColor = "bg-emerald-400 dark:bg-emerald-500 shadow-[0_0_5px_rgba(52,211,153,0.6)]";
                          if (val <= -50) barColor = "bg-rose-500 dark:bg-rose-600 shadow-[0_0_5px_rgba(244,63,94,0.6)]";
                          else if (val <= 0) barColor = "bg-orange-500 dark:bg-orange-600 shadow-[0_0_5px_rgba(249,115,22,0.6)]";
                          else if (val < 50) barColor = "bg-amber-400 dark:bg-amber-500 shadow-[0_0_5px_rgba(251,191,36,0.6)]";

                          const fillPercent = Math.min(100, Math.max(8, (Math.abs(val) / 250) * 100));

                          return (
                            <td 
                              key={col.id} 
                              style={{ width: 120, minWidth: 120, maxWidth: 120 }}
                              className="px-4 py-4 whitespace-nowrap text-center border-r border-slate-200 dark:border-white/5 transition-all duration-300"
                            >
                              <div className="flex flex-col items-center gap-2 w-full">
                                <div className="flex flex-col-reverse gap-[2px] h-16 w-3.5">
                                  {Array.from({ length: 10 }).map((_, i) => {
                                    const isFilled = i < Math.round((fillPercent / 100) * 10);
                                    return (
                                      <div 
                                        key={i} 
                                        className={`w-full flex-1 rounded-[1px] transition-all duration-300 ${isFilled ? barColor : 'bg-slate-200 dark:bg-slate-700/30'}`}
                                      />
                                    );
                                  })}
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full">{val}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </MaintenanceLayout>

      {/* Import Result Modal */}
      {importResult && mounted && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  importResult.notUpdated.length === 0
                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-100 dark:bg-amber-500/10 text-amber-500'
                }`}>
                  {importResult.notUpdated.length === 0 ? <FaCheckCircle size={18} /> : <FaExclamationTriangle size={18} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hasil Import Excel</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {importResult.notUpdated.length === 0
                      ? 'Semua unit berhasil diperbarui!'
                      : `${importResult.notUpdated.length} unit tidak dapat diperbarui`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportResult(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {importResult.notUpdated.length > 0 && (
              <div className="flex-1 overflow-y-auto p-4">
                <p className="text-xs font-semibold uppercase text-slate-400 mb-3">Unit yang tidak berhasil diperbarui:</p>
                <div className="flex flex-col gap-2">
                  {importResult.notUpdated.map((item: any, i: number) => (
                    <div key={i} className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3">
                      {item.codeUnit ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{item.codeUnit}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{item.sheet}</span>
                          </div>
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{item.reason}</p>
                        </>
                      ) : (
                        <p className="text-sm text-rose-600 dark:text-rose-400">{item.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => setImportResult(null)}
                className="w-full rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
