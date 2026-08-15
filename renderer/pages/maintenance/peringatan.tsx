import React, { useEffect, useState } from "react";
import Head from "next/head";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import SectionHeading from "@/components/atoms/SectionHeading";
import { auditLogService } from "@/services/audit-log-service";
import { unitService } from "@/services/unit-service";
import { IAuditLog } from "@/domain/models/audit-log";
import { useRouter } from "next/router";
import { ACTIONS } from "@/common/utils/action";
import { FaExclamationTriangle, FaSearch, FaChevronRight, FaRegClock, FaWrench, FaChevronDown, FaTrash, FaFilter } from "react-icons/fa";

export default function PeringatanServisPage() {
  const router = useRouter();
  
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [totalRow, setTotalRow] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const itemsPerPage = 10;
  
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const [unitFilter, setUnitFilter] = useState("Semua");
  const [masterUnits, setMasterUnits] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCleanupDropdownOpen, setIsCleanupDropdownOpen] = useState(false);

  useEffect(() => {
    const closeDropdown = () => {
      setIsDropdownOpen(false);
      setIsCleanupDropdownOpen(false);
    };
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, []);

  const handleCleanup = async (days: number) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus histori peringatan yang usianya lebih dari ${days} hari?`)) return;
    try {
      await auditLogService.cleanupHistory(days, ACTIONS.CRON_APL_WARNING);
      // refetch logs
      const res = await auditLogService.getAllLogs({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        action: ACTIONS.CRON_APL_WARNING,
        unit: unitFilter !== "Semua" ? unitFilter : undefined
      });
      setLogs(res.data);
      setTotalRow(res.totalRow);
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus histori peringatan.");
    }
  };

  useEffect(() => {
    unitService.getAllUnits()
      .then(res => setMasterUnits(res || []))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, unitFilter]);

  useEffect(() => {
    auditLogService.getAllLogs({
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearch,
      action: ACTIONS.CRON_APL_WARNING,
      unit: unitFilter !== "Semua" ? unitFilter : undefined
    })
    .then((res) => {
      setLogs(res.data);
      setTotalRow(res.totalRow);
    })
    .catch((err) => console.error("Failed to fetch logs:", err));
  }, [currentPage, debouncedSearch, unitFilter]);

  const totalPages = Math.ceil(totalRow / itemsPerPage) || 1;

  const getVisiblePages = () => {
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  return (
    <React.Fragment>
      <Head>
        <title>Peringatan Servis - ENG HUB</title>
      </Head>
      <MaintenanceLayout
        title="Peringatan Servis"
        subtitle="Daftar lengkap notifikasi sparepart dan jadwal"
      >
        <section className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-6 shadow-xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <SectionHeading
              title=""
              description="Menampilkan semua histori peringatan unit"
            />
          </div>

          <div className="mb-6 flex gap-3">
            <div className="flex-1 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 p-2 shadow-sm">
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <FaSearch className="text-slate-400" />
                </div>
                <input
                  id="searchInput"
                  type="text"
                  placeholder="Cari kode unit atau nama peringatan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl bg-transparent py-2 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/50 transition-all"
                />
              </div>
            </div>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsCleanupDropdownOpen(false);
                }}
                className="flex items-center justify-between w-48 h-full rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 px-4 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FaFilter className="text-slate-400 shrink-0 text-xs" />
                  <span className="truncate">
                    {unitFilter === "Semua" 
                      ? "Semua Unit" 
                      : masterUnits.find(u => u.id === unitFilter)?.name || "Semua Unit"}
                  </span>
                </div>
                <FaChevronDown className={`text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-full max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-white/10 z-20 py-1">
                  <button
                    onClick={() => {
                      setUnitFilter("Semua");
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${unitFilter === "Semua" ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 font-semibold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                  >
                    Semua Unit
                  </button>
                  {masterUnits.map(unit => (
                    <button
                      key={unit.id}
                      onClick={() => {
                        setUnitFilter(unit.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${unitFilter === unit.id ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 font-semibold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"}`}
                    >
                      {unit.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCleanupDropdownOpen(!isCleanupDropdownOpen);
                  setIsDropdownOpen(false);
                }}
                className={`flex items-center justify-center w-12 h-full rounded-2xl border transition-all outline-none shadow-sm cursor-pointer ${isCleanupDropdownOpen ? 'bg-red-50 border-red-200 text-red-500 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400' : 'bg-white border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 dark:bg-slate-900/60 dark:border-white/5 dark:text-slate-400 dark:hover:text-red-400 dark:hover:border-red-500/30 dark:hover:bg-red-500/10'}`}
                title="Hapus Histori Peringatan"
              >
                <FaTrash className="text-sm" />
              </button>
              
              {isCleanupDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/10 z-20 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2">
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-1">
                      Bersihkan Histori
                    </p>
                    <div className="space-y-0.5">
                      <button
                        onClick={() => handleCleanup(3)}
                        className="flex items-center w-full px-2 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors group"
                      >
                        <FaRegClock className="mr-2 text-slate-400 group-hover:text-red-500 transition-colors" />
                        <span>Lebih dari 3 Hari</span>
                      </button>
                      <button
                        onClick={() => handleCleanup(7)}
                        className="flex items-center w-full px-2 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors group"
                      >
                        <FaRegClock className="mr-2 text-slate-400 group-hover:text-red-500 transition-colors" />
                        <span>Lebih dari 7 Hari</span>
                      </button>
                      <button
                        onClick={() => handleCleanup(30)}
                        className="flex items-center w-full px-2 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors group"
                      >
                        <FaRegClock className="mr-2 text-slate-400 group-hover:text-red-500 transition-colors" />
                        <span>Lebih dari 30 Hari</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {logs.length > 0 ? (
              logs.map((log) => {
                const oldData = JSON.parse(log.old_data || "{}");
                const newData = JSON.parse(log.new_data || "{}");
                const isCritical = newData.level === "CRITICAL";
                return (
                  <div 
                    key={log.id} 
                    onClick={() => oldData.unit_id && router.push(`/maintenance/detail-unit?id=${oldData.unit_id}`)}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden mb-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Left Accent Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`}></div>

                    <div className="flex items-center gap-4 ml-2">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCritical ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' : 'bg-amber-50 text-amber-500 dark:bg-amber-500/10'}`}>
                        {isCritical ? <FaExclamationTriangle size={16} /> : <FaWrench size={16} />}
                      </div>
                      
                      {/* Content */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                            {oldData.unit_name}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] flex items-center gap-1 font-medium uppercase tracking-wider">
                            <FaRegClock /> {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <div className="text-slate-800 dark:text-slate-100 font-extrabold text-[15px] uppercase tracking-wide group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {oldData.name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-6 ml-16 sm:ml-0 mt-3 sm:mt-0">
                      {/* Sisa Waktu */}
                      <div className="flex flex-col items-start sm:items-end">
                        <span className="text-slate-400 dark:text-slate-500 text-[9px] font-extrabold tracking-widest uppercase">
                          SISA WAKTU
                        </span>
                        <span className={`font-black text-sm ${isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {newData.input} Jam
                        </span>
                      </div>
                      
                      {/* Button */}
                      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
                        <FaChevronRight size={12} className="ml-0.5" />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/70 p-12 text-center text-slate-400 dark:text-slate-600 dark:text-slate-400">
                Tidak ada data peringatan.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 transition"
              >
                Sebelumnya
              </button>
              <div className="flex gap-1 overflow-x-auto max-w-full pb-2 sm:pb-0 px-2">
                {getVisiblePages().map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition ${
                      currentPage === page
                        ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 transition"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </section>
      </MaintenanceLayout>
    </React.Fragment>
  );
}
