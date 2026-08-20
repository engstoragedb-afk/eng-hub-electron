import React, { useState, useEffect, useRef } from "react";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import Head from "next/head";
import { useRouter } from "next/router";
import { FaChevronLeft, FaChevronRight, FaFileExcel, FaSearch, FaColumns, FaTimes, FaUpload, FaChevronDown, FaPrint } from "react-icons/fa";
import { categoryUnitsService, unitService } from "@/services";
import { exportServisToExcel } from "@/utils/exportExcel";
import { createPortal } from "react-dom";
import PrintPreviewModal from "@/components/organisms/PrintPreviewModal";
import ImportResultModal from "@/components/organisms/ImportResultModal";

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
  const [activeCategoryId, setActiveCategoryId] = useLocalStorage<string>("servis_active_category_id", "");
  const [detailsData, setDetailsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useLocalStorage("servis_search_term", "");
  const [locationFilter, setLocationFilter] = useLocalStorage("servis_location_filter", "Semua");
  const [aplFilterCols, setAplFilterCols] = useLocalStorage<string[]>("servis_apl_filter_cols", []);
  const [aplFilterColors, setAplFilterColors] = useLocalStorage<string[]>("servis_apl_filter_colors", []);
  const [aplFilterMode, setAplFilterMode] = useLocalStorage<'some' | 'every'>("servis_apl_filter_mode", 'some');
  const [showAplFilterMenu, setShowAplFilterMenu] = useState(false);
  const [showAplStatusMenu, setShowAplStatusMenu] = useState(false);
  const [aplDisplayMode, setAplDisplayMode] = useLocalStorage<'diagram' | 'angka'>("servis_apl_display_mode", 'diagram');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<Record<string, boolean>>("servis_hidden_columns", {});
  const [collapsedCols, setCollapsedCols] = useLocalStorage<Record<string, boolean>>("servis_collapsed_cols", {});
  const [isFloatingSearchOpen, setIsFloatingSearchOpen] = useState(false);
  const floatingSearchRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ notUpdated: any[] } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
    let visible = aplColumns.filter(col => !hiddenColumns[col.id]);
    if (aplFilterCols.length > 0) {
      visible = visible.filter(col => aplFilterCols.includes(col.id));
    }
    return visible;
  }, [aplColumns, hiddenColumns, aplFilterCols]);

  const STATUS_OPTIONS = [
    { value: 'Merah', label: '🔴 Kritis (≤ -50)' },
    { value: 'Oranye', label: '🟠 Waspada (≤ 0)' },
    { value: 'Amber', label: '🟡 Perhatian (< 50)' },
    { value: 'Kuning', label: '🟢 Normal (< 150)' },
    { value: 'Hijau', label: '🟢 Aman (≥ 150)' },
  ];

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

      const getStatus = (val: number) => {
        if (val <= -50) return "Merah";
        if (val <= 0) return "Oranye";
        if (val < 50) return "Amber";
        if (val < 150) return "Kuning";
        return "Hijau";
      };

      let aplMatch = true;
      if (aplFilterCols.length > 0 && aplFilterColors.length > 0) {
        const colCheck = (colId: string) => {
          const aplRecord = u.aplData?.find((a: any) => a.category_apl_id === colId);
          const val = aplRecord ? (aplRecord.input || 0) : 0;
          return aplFilterColors.includes(getStatus(val));
        };
        aplMatch = aplFilterMode === 'every'
          ? aplFilterCols.every(colCheck)
          : aplFilterCols.some(colCheck);
      }

      return (codeMatch || opMatch) && locMatch && aplMatch;
    });
  }, [detailsData, searchTerm, locationFilter, aplFilterCols, aplFilterColors, aplFilterMode]);

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

  const handleExport = async () => {
    await exportServisToExcel({
      filteredData,
      visibleFixedCols,
      visibleAplColumns,
      categories,
      activeCategoryId
    });
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
          className={`fixed top-0 left-0 right-0 z-[200] flex justify-center transition-transform duration-300 ease-out ${isFloatingSearchOpen ? 'translate-y-0' : '-translate-y-full'
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
                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeCategoryId === cat.id
                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/20 border border-sky-400"
                    : "bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                >
                  {cat.name}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeCategoryId === cat.id ? "bg-white/25 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
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
                onClick={handleExport}
                disabled={isLoading || filteredData.length === 0}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 transition hover:bg-emerald-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaFileExcel size={16} /> Export Excel
              </button>

              {/* Print Button - only when items selected */}
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-sky-500/50 bg-sky-500/10 px-5 py-2.5 text-sm font-semibold text-sky-600 dark:text-sky-400 transition hover:bg-sky-500 hover:text-white"
                >
                  <FaPrint size={14} />
                  <span>Print</span>
                  <span className="bg-sky-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                    {selectedIds.size}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row flex-wrap items-center gap-3 bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
            <div className="relative flex-1 min-w-[150px] sm:min-w-[200px] lg:max-w-md shrink-0">
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
              className="rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500/50 transition-colors sm:min-w-[150px] shrink-0"
            >
              <option value="Semua">Semua Lokasi</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {/* Filter Kolom APL */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setShowAplFilterMenu(!showAplFilterMenu)}
                  className="rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between min-w-[150px] w-full"
                >
                  <span className="truncate max-w-[150px]">
                    {aplFilterCols.length === 0 
                      ? "-- Semua APL --" 
                      : `${aplFilterCols.length} APL Dipilih`}
                  </span>
                  <FaChevronDown className="ml-2 text-slate-400 text-xs shrink-0" />
                </button>
                
                {showAplFilterMenu && (
                  <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-2 shadow-xl z-50">
                    <div className="max-h-64 overflow-y-auto flex flex-col gap-1 scrollbar-hide">
                      {aplColumns.map(col => (
                        <label key={col.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={aplFilterCols.includes(col.id)}
                            onChange={() => {
                               setAplFilterCols(prev => {
                                 const next = prev.includes(col.id) ? prev.filter(c => c !== col.id) : [...prev, col.id];
                                 if (next.length === 0) setAplFilterColors([]);
                                 return next;
                               });
                            }}
                            className="rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{col.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {aplFilterCols.length > 0 && (
                <>
                  {/* Status multi-select */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setShowAplStatusMenu(v => !v)}
                      className="rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm flex items-center gap-2 min-w-[130px] justify-between"
                    >
                      <span className="truncate text-slate-900 dark:text-slate-100">
                        {aplFilterColors.length === 0 ? 'Semua Status' : `${aplFilterColors.length} Status`}
                      </span>
                      <FaChevronDown className="text-slate-400 text-xs shrink-0" />
                    </button>
                    {showAplStatusMenu && (
                      <div className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-2 shadow-xl z-50">
                        <div className="flex flex-col gap-1">
                          {STATUS_OPTIONS.map(opt => (
                            <label key={opt.value} className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                              <input
                                type="checkbox"
                                checked={aplFilterColors.includes(opt.value)}
                                onChange={() => setAplFilterColors(prev =>
                                  prev.includes(opt.value) ? prev.filter(c => c !== opt.value) : [...prev, opt.value]
                                )}
                                className="rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                              />
                              <span className="text-sm text-slate-700 dark:text-slate-300">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mode toggle: Salah Satu / Semua Harus */}
                  {aplFilterColors.length > 0 && (
                    <div className="flex rounded-xl border border-slate-300 dark:border-white/10 overflow-hidden text-xs font-semibold shrink-0">
                      <button
                        onClick={() => setAplFilterMode('some')}
                        className={`px-3 py-2.5 transition-colors ${
                          aplFilterMode === 'some'
                            ? 'bg-sky-500 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        Salah Satu
                      </button>
                      <button
                        onClick={() => setAplFilterMode('every')}
                        className={`px-3 py-2.5 border-l border-slate-300 dark:border-white/10 transition-colors ${
                          aplFilterMode === 'every'
                            ? 'bg-sky-500 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        Semua Harus
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="relative lg:ml-auto flex flex-wrap items-center gap-2 shrink-0">
              {/* APL View Toggle */}
              <div className="flex rounded-xl border border-slate-300 dark:border-white/10 overflow-hidden text-xs font-semibold shrink-0">
                <button
                  onClick={() => setAplDisplayMode('diagram')}
                  className={`px-3 py-2.5 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    aplDisplayMode === 'diagram'
                      ? 'bg-slate-700 text-white dark:bg-slate-600'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Tampilkan diagram batang"
                >
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
                    <rect x="0" y="8" width="3" height="6" rx="0.5"/>
                    <rect x="4.5" y="3" width="3" height="11" rx="0.5"/>
                    <rect x="9" y="0" width="3" height="14" rx="0.5"/>
                  </svg>
                  Diagram
                </button>
                <button
                  onClick={() => setAplDisplayMode('angka')}
                  className={`px-3 py-2.5 flex items-center gap-1.5 border-l border-slate-300 dark:border-white/10 transition-colors whitespace-nowrap shrink-0 ${
                    aplDisplayMode === 'angka'
                      ? 'bg-slate-700 text-white dark:bg-slate-600'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  title="Tampilkan angka saja"
                >
                  <span className="font-mono font-bold">123</span>
                  Angka
                </button>
              </div>

              {/* Kolom Tabel button */}
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 whitespace-nowrap"
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
                  {/* Checkbox select-all header */}
                  <th className="px-3 py-4 sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-white/5" style={{ width: 44, minWidth: 44 }}>
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                      checked={filteredData.length > 0 && filteredData.every((u: any) => selectedIds.has(u.id))}
                      onChange={() => {
                        const allIds = filteredData.map((u: any) => u.id);
                        const allSelected = allIds.every((id: string) => selectedIds.has(id));
                        setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (allSelected) allIds.forEach((id: string) => next.delete(id));
                          else allIds.forEach((id: string) => next.add(id));
                          return next;
                        });
                      }}
                    />
                  </th>
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
                    const isZeroHours = !u.hours || u.hours === 0;
                    const rowBgClass = isZeroHours 
                      ? 'bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 dark:hover:bg-rose-900' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800';
                    const fixedColBgClass = isZeroHours
                      ? 'bg-rose-50 dark:bg-rose-950 group-hover:bg-rose-100 dark:group-hover:bg-rose-900'
                      : 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800';

                    const isSelected = selectedIds.has(u.id);
                    const checkboxBg = isSelected
                      ? isZeroHours ? 'bg-rose-100 dark:bg-rose-900' : 'bg-sky-50 dark:bg-sky-950'
                      : isZeroHours ? 'bg-rose-50 dark:bg-rose-950 group-hover:bg-rose-100 dark:group-hover:bg-rose-900' : 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800';

                    return (
                      <tr
                        key={u.id || index}
                        className={`group transition-colors cursor-pointer ${isSelected ? (isZeroHours ? 'bg-rose-100 dark:bg-rose-900' : 'bg-sky-50 dark:bg-sky-950') : rowBgClass}`}
                        onClick={() => router.push(`/maintenance/detail-unit?id=${u.id}`)}
                      >
                        {/* Checkbox cell */}
                        <td
                          className={`px-3 py-4 sticky left-0 z-10 border-r border-slate-200 dark:border-white/5 transition-colors ${checkboxBg}`}
                          style={{ width: 44, minWidth: 44 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                            checked={isSelected}
                            onChange={() => setSelectedIds(prev => {
                              const next = new Set(prev);
                              if (next.has(u.id)) next.delete(u.id);
                              else next.add(u.id);
                              return next;
                            })}
                          />
                        </td>
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
                              className={`${isCollapsed ? 'px-2 whitespace-nowrap' : 'px-4 whitespace-normal break-words'} py-4 border-r border-slate-200 dark:border-white/5 sticky z-10 ${fixedColBgClass} transition-all duration-300 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'} ${isLast ? 'shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_10px_-4px_rgba(255,255,255,0.05)]' : ''}`}
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
                          else if (val < 50) barColor = "bg-amber-500 dark:bg-amber-600 shadow-[0_0_5px_rgba(245,158,11,0.6)]";
                          else if (val < 150) barColor = "bg-green-400 dark:bg-green-500 shadow-[0_0_5px_rgba(250,204,21,0.6)]";

                          const fillPercent = Math.min(100, Math.max(8, (Math.abs(val) / 250) * 100));

                          return (
                            <td
                              key={col.id}
                              style={{ width: aplDisplayMode === 'angka' ? 80 : 120, minWidth: aplDisplayMode === 'angka' ? 80 : 120, maxWidth: aplDisplayMode === 'angka' ? 80 : 120 }}
                              className="px-4 py-4 whitespace-nowrap text-center border-r border-slate-200 dark:border-white/5 transition-all duration-300"
                            >
                              {aplDisplayMode === 'diagram' ? (
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
                              ) : (
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-lg text-sm font-bold tabular-nums ${
                                    val <= -50  ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400' :
                                    val <= 0    ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400' :
                                    val < 50    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' :
                                    val < 150   ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                                                  'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                                  }`}
                                >
                                  {val}
                                </span>
                              )}
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
        <ImportResultModal 
          importResult={importResult} 
          onClose={() => setImportResult(null)} 
        />,
        document.body
      )}

      {/* Print Preview Modal */}
      {showPrintModal && mounted && createPortal(
        <PrintPreviewModal
          units={filteredData.filter((u: any) => selectedIds.has(u.id))}
          aplColumns={visibleAplColumns}
          categoryName={categories.find(c => c.id === activeCategoryId)?.name || 'semua-unit'}
          onClose={() => setShowPrintModal(false)}
        />,
        document.body
      )}
    </>
  );
}
