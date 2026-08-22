import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { FaGrip, FaList } from "react-icons/fa6";

import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import UnitCard from "@/components/molecules/UnitCard";
import SectionHeading from "@/components/atoms/SectionHeading";

import { unitService, categoryUnitsService } from "@/services";
import { EGPSStatus } from "@/common/utils/status";

interface UnitType {
  id: string;
  code: string;
  image?: string;
  category: string;
  status: "Siap" | "Perbaikan" | "RJ Rawat Jalan";
  hm: number;
  hours: number;
  location: string;
  gpsVendor?: string;
  gpsStatus?: string;
  service?: string;
  aplData?: any[];
}

type UnitStatus = "Semua" | "Siap" | "Perbaikan" | "RJ Rawat Jalan";

const hmRanges = ["Semua", "0-1000", "1001-1200", "1201-1500", "1501-9999"] as const;
const hoursRanges = ["Semua", "0-400", "401-600", "601-700", "701-9999"] as const;

export default function MaintenanceUnitList() {
  const router = useRouter();
  const { category, id } = router.query;

  const [units, setUnits] = useState<UnitType[]>([]);
  const [totalRow, setTotalRow] = useState(0);

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("Semua");
  const [hmRange, setHmRange] = useState<(typeof hmRanges)[number]>("Semua");
  const [hoursRange, setHoursRange] = useState<(typeof hoursRanges)[number]>("Semua");
  const [status, setStatus] = useState<UnitStatus>("Semua");
  const [gpsStatusFilter, setGpsStatusFilter] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [refreshKey, setRefreshKey] = useState(0);
  const [isRestored, setIsRestored] = useState(false);

  const [selectedWarningUnit, setSelectedWarningUnit] = useState<UnitType | null>(null);

  useEffect(() => {
    if (selectedWarningUnit) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedWarningUnit]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUnit, setNewUnit] = useState({
    name: "",
    hm: 0,
    hours: 0,
    manufacture_year: new Date().getFullYear(),
  });

  useEffect(() => {
    if (isAddModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isAddModalOpen]);

  const [allCategories, setAllCategories] = useState<{id: string; name: string}[]>([]);

  useEffect(() => {
    categoryUnitsService.getAll()
      .then((data) => {
        if (data) {
          const formatted = data
            .filter((item: any) => item.name !== "NULL" && item.name !== "equipment_group")
            .map((item: any) => ({ id: item.id, name: item.name }));
          setAllCategories(formatted);
        }
      })
      .catch((err) => console.error("Failed to fetch category units:", err));
  }, []);

  // Keyboard Navigation for Pagination & Category
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent pagination if user is typing in an input or modal is open
      if (
        isAddModalOpen ||
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }

      const totalPages = Math.ceil(totalRow / itemsPerPage) || 1;

      if (e.key === "ArrowLeft") {
        setCurrentPage((p) => Math.max(1, p - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentPage((p) => Math.min(totalPages, p + 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        if (allCategories.length === 0) return;
        
        const currentIndex = allCategories.findIndex(c => c.name === category);
        if (currentIndex === -1) return;
        
        let nextIndex = currentIndex;
        if (e.key === "ArrowUp") {
          e.preventDefault();
          nextIndex = (currentIndex - 1 + allCategories.length) % allCategories.length;
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          nextIndex = (currentIndex + 1) % allCategories.length;
        }
        
        if (nextIndex !== currentIndex) {
          const nextCat = allCategories[nextIndex];
          router.push(`/maintenance/unit/${encodeURIComponent(nextCat.name)}?id=${nextCat.id}`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddModalOpen, totalRow, itemsPerPage, allCategories, category, router]);

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnit.name || !id) return;
    setIsSubmitting(true);
    try {
      await unitService.createUnit({
        category_id: id as string,
        name: newUnit.name,
        hm: Number(newUnit.hm),
        hours: Number(newUnit.hours),
        manufacture_year: Number(newUnit.manufacture_year),
      });
      toast.success("Unit berhasil ditambahkan!");
      setIsAddModalOpen(false);
      setNewUnit({
        name: "",
        hm: 0,
        hours: 0,
        manufacture_year: new Date().getFullYear(),
      });
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menambahkan unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const STORAGE_KEY = `unit_filters_${category}`;
  const isRestoringRef = useRef(true);

  // Restore filters
  useEffect(() => {
    if (!category) return;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        isRestoringRef.current = true;
        if (parsed.search !== undefined) {
          setSearch(parsed.search);
          setDebouncedSearch(parsed.search);
        }
        if (parsed.location !== undefined) setLocation(parsed.location);
        if (parsed.hmRange !== undefined) setHmRange(parsed.hmRange);
        if (parsed.hoursRange !== undefined) setHoursRange(parsed.hoursRange);
        if (parsed.status !== undefined) setStatus(parsed.status);
        if (parsed.gpsStatusFilter !== undefined) setGpsStatusFilter(parsed.gpsStatusFilter);
        if (parsed.currentPage !== undefined) setCurrentPage(parsed.currentPage);
      } catch (e) {}
    }
    
    // Wait a bit for state to settle before fetching
    setTimeout(() => {
      isRestoringRef.current = false;
      setIsRestored(true);
    }, 50);
  }, [category]);

  // Save filters
  useEffect(() => {
    if (!category || isRestoringRef.current || !isRestored) return;
    const filters = { search, location, hmRange, hoursRange, status, gpsStatusFilter, currentPage };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [search, location, hmRange, hoursRange, status, gpsStatusFilter, currentPage, category, isRestored]);

  useEffect(() => {
    if (isRestoringRef.current) return;
    setCurrentPage(1);
  }, [debouncedSearch, location, hmRange, hoursRange, status, category, gpsStatusFilter]);

  useEffect(() => {
    if (!id || !isRestored) return;

    let hm_min, hm_max, hours_min, hours_max;
    if (hmRange !== "Semua") {
      [hm_min, hm_max] = hmRange.split("-").map(Number);
    }
    if (hoursRange !== "Semua") {
      [hours_min, hours_max] = hoursRange.split("-").map(Number);
    }

    const apiStatus = status !== "Semua" ? (status === "Siap" ? "READY" : status === "Perbaikan" ? "BREAKDOWN" : "RAWAT_JALAN") : undefined;

    const params: any = {
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearch || undefined,
      status: apiStatus,
      location_id: location !== "Semua" ? location : undefined,
      gps_status: gpsStatusFilter !== "Semua" ? gpsStatusFilter : undefined,
      hm_min, hm_max, hours_min, hours_max
    };

    unitService.getUnitsByCategory(id as string, params)
      .then((res: any) => {
        if (res && res.data) {
          const formatted = res.data.map((item: any) => ({
            ...item,
            category: item.category?.name || category,
            status: item.status === "Breakdown" ? "Perbaikan" : item.status,
            hm: item.hm || 0,
            hours: item.hours || 0,
            location: item.location?.name || item.location || "Site A",
          }));
          setUnits(formatted);
          setTotalRow(res.totalRow || 0);
        }
      })
      .catch((err) => console.error("Failed to fetch units:", err));
  }, [id, category, currentPage, debouncedSearch, status, location, gpsStatusFilter, hmRange, hoursRange, refreshKey, isRestored]);

  const categoryName = typeof category === "string" ? category : "";

  const statusOptions = ["Semua", "Siap", "Perbaikan", "RJ Rawat Jalan"];
  const gpsStatusOptions = [
    { label: "Semua", value: "Semua" },
    { label: "Connected", value: EGPSStatus.CONNECTED },
    { label: "Offline", value: EGPSStatus.OFFLINE },
    { label: "Error Not Found", value: EGPSStatus.ERROR_NOT_FOUND },
    { label: "Error Invalid Device", value: EGPSStatus.ERROR_INVALID_DEVICE },
    { label: "Error Unavailable", value: EGPSStatus.ERROR_UNAVAILABLE },
  ];

  const categoryImages: Record<string, string> = {
    EXCAVATOR: "/units/exavator.png",
    BULLDOZER: "/units/bulldozer.png",
    VIBRO: "/units/vibro.png",
    "MOTOR GRADER": "/units/motor-grader.png",
    TRUCK: "/units/truck.png",
  };

  const totalPages = Math.ceil(totalRow / itemsPerPage) || 1;
  const paginatedUnits = units;

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
      <MaintenanceLayout
        title={`Maintenance Unit ${categoryName}`}
        subtitle="Daftar unit dan status perbaikan"
      >
        <section className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-100/90 dark:bg-white/[0.03] p-6 shadow-xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <SectionHeading
              title={``}
              description={`Menampilkan semua unit dalam maintenance untuk kategori ${categoryName}`}
            />
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              Tambah Unit
            </button>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="searchInput" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Cari Unit
                </label>
                <input
                  id="searchInput"
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari kode, lokasi..."
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                />
              </div>


              <div className="flex flex-col gap-1.5">
                <label htmlFor="statusFilter" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Status
                </label>
                <select
                  id="statusFilter"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as UnitStatus)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  {statusOptions.map((value) => (
                    <option key={value} value={value}>{value as string}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="gpsStatusFilter" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Status GPS
                </label>
                <select
                  id="gpsStatusFilter"
                  value={gpsStatusFilter}
                  onChange={(event) => setGpsStatusFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  {gpsStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Tampilan
                </label>
                <div className="flex items-center h-[38px] rounded-xl bg-slate-200/50 dark:bg-slate-800 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 flex items-center justify-center rounded-lg h-full transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    title="Tampilan Grid"
                  >
                    <FaGrip className="text-sm" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 flex items-center justify-center rounded-lg h-full transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    title="Tampilan List"
                  >
                    <FaList className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={viewMode === 'grid' ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"}>
            {paginatedUnits.length > 0 ? (
              paginatedUnits.map((item) => (
                <UnitCard
                  key={item.code}
                  code={item.code}
                  category={item.category}
                  status={item.status as any}
                  hm={item.hm}
                  hours={item.hours}
                  gpsVendor={item.gpsVendor}
                  gpsStatus={item.gpsStatus}
                  service={item.service}
                  imageUrl={item.image || categoryImages[item.category]}
                  viewMode={viewMode}
                  onWarningClick={() => setSelectedWarningUnit(item)}
                  onClick={() => router.push(`/maintenance/detail-unit?code=${item.code}&id=${item.id}`)}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/70 p-12 text-center text-slate-400 dark:text-slate-600 dark:text-slate-400 col-span-full">
                Tidak ada unit yang sesuai filter.
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
              <div className="flex gap-1 overflow-x-auto max-w-full pb-2 sm:pb-0">
                {getVisiblePages().map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg text-xs font-semibold transition ${currentPage === page
                        ? "bg-sky-500 text-white"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
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

          {selectedWarningUnit && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-amber-50 dark:bg-amber-500/10 p-6 border-b border-amber-100 dark:border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-amber-900 dark:text-amber-400">
                      Tindakan Servis Diperlukan
                    </h3>
                    <button 
                      onClick={() => setSelectedWarningUnit(null)}
                      className="text-amber-700 hover:bg-amber-200/50 dark:text-amber-500 dark:hover:bg-amber-500/20 p-2 rounded-xl transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-amber-800 dark:text-amber-500/80">
                    Unit <strong>{selectedWarningUnit.code}</strong> memerlukan perbaikan untuk item berikut:
                  </p>
                </div>
                
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-4">
                    {selectedWarningUnit.aplData?.filter((d: any) => d.input < 50).map((item: any, i: number) => (
                      <div key={i} className="flex flex-col gap-1 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          {item.name}
                        </div>
                        <div className={`text-sm font-medium ${item.input < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {item.input < 0 ? "Telah melewati batas rekomendasi" : "Sudah harus diganti"}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Sisa waktu / batas: {item.input} H
                        </div>
                      </div>
                    ))}
                    
                    {(!selectedWarningUnit.aplData || selectedWarningUnit.aplData.filter((d: any) => d.input < 50).length === 0) && (
                      <div className="text-center text-slate-500 dark:text-slate-400 py-4 text-sm italic">
                        Tidak ada detail peringatan servis yang tersedia.
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                  <button
                    onClick={() => setSelectedWarningUnit(null)}
                    className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

        </section>
      </MaintenanceLayout>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div 
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Unit Baru</h3>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="addUnitForm" onSubmit={handleCreateUnit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Kode / Nama Unit *</label>
                  <input required type="text" value={newUnit.name} onChange={e => setNewUnit({...newUnit, name: e.target.value})} className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">HM *</label>
                    <input required type="number" min="0" value={newUnit.hm} onChange={e => setNewUnit({...newUnit, hm: parseInt(e.target.value) || 0})} className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total Jam *</label>
                    <input required type="number" min="0" value={newUnit.hours} onChange={e => setNewUnit({...newUnit, hours: parseInt(e.target.value) || 0})} className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500" />
                  </div>
                </div>

              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">Batal</button>
              <button type="submit" form="addUnitForm" disabled={isSubmitting} className="px-4 py-2 rounded-xl bg-sky-500 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50 transition">
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
