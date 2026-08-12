import React, { useEffect, useState } from "react";
import Head from "next/head";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import SectionHeading from "@/components/atoms/SectionHeading";
import { auditLogService } from "@/services/audit-log-service";
import { IAuditLog } from "@/domain/models/audit-log";
import { useRouter } from "next/router";
import { ACTIONS } from "@/common/utils/action";
import { FaExclamationTriangle, FaSearch, FaChevronRight, FaRegClock, FaWrench } from "react-icons/fa";

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

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    auditLogService.getAllLogs({
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearch,
      action: ACTIONS.CRON_APL_WARNING
    })
    .then((res) => {
      setLogs(res.data);
      setTotalRow(res.totalRow);
    })
    .catch((err) => console.error("Failed to fetch logs:", err));
  }, [currentPage, debouncedSearch]);

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
        <section className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-6 shadow-xl backdrop-blur-md">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <SectionHeading
              title=""
              description="Menampilkan semua histori peringatan unit"
            />
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 p-2 shadow-sm">
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
                className="w-full rounded-xl bg-transparent py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/50 transition-all"
              />
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
                    className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white dark:bg-slate-900/60 p-5 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-slate-200 dark:border-white/5 hover:border-sky-500/30 overflow-hidden"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`}></div>

                    <div className="flex items-center gap-5 ml-2">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-inner ${isCritical ? 'bg-rose-100 text-rose-500 dark:bg-rose-500/20' : 'bg-amber-100 text-amber-500 dark:bg-amber-500/20'}`}>
                        {isCritical ? <FaExclamationTriangle size={20} /> : <FaWrench size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300">
                            {oldData.unit_name}
                          </span>
                          <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                            <FaRegClock /> {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {oldData.name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-6 ml-2 sm:ml-0 mt-2 sm:mt-0">
                      <div className="flex flex-col items-start sm:items-end">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Sisa Waktu
                        </span>
                        <span className={`text-base font-black ${isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {newData.input} Jam
                        </span>
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-sky-50 dark:group-hover:bg-sky-500/20 group-hover:text-sky-500 transition-colors">
                        <FaChevronRight size={14} />
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
