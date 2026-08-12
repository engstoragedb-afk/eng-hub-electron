import React, { useState } from "react";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import { repairs } from "@/common/data/repairData";
import AddRepairModal from "@/components/organisms/AddRepairModal";
import Link from "next/link";
import {
  FaPlus,
  FaFileExcel,
  FaLayerGroup,
  FaLocationDot,
  FaClockRotateLeft,
  FaFlag,
  FaCheck,
  FaSpinner,
} from "react-icons/fa6";

export default function MaintenanceBreakdownPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [locationFilter, setLocationFilter] = useState("Semua");
  const [localRepairs, setLocalRepairs] = useState(repairs);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, locationFilter]);

  const handleSaveRepair = (data: any) => {
    // Basic mock save
    const newRepair = {
      code: `WO-${Math.floor(Math.random() * 10000)}`,
      unit: data.unitCode,
      category: data.equipmentType || "UNKNOWN",
      image: "placeholder.png", // placeholder
      location: data.location || "Unknown",
      status: "Menunggu",
      priority: data.severity === "Critical" ? "Tinggi" : data.severity === "High" ? "Sedang" : "Rendah",
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      description: data.description,
    };
    setLocalRepairs([newRepair, ...localRepairs]);
  };

  const filteredRepairs = localRepairs.filter((repair) => {
    const matchSearch =
      repair.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory =
      categoryFilter === "Semua" || repair.category === categoryFilter;
    const matchStatus =
      statusFilter === "Semua" || repair.status === statusFilter;
    const matchLocation =
      locationFilter === "Semua" || repair.location === locationFilter;
    return matchSearch && matchCategory && matchStatus && matchLocation;
  });

  const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage) || 1;
  const paginatedRepairs = filteredRepairs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        title="Breakdown"
        subtitle="Daftar pekerjaan perbaikan unit"
      >
        <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-6 mb-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">Filter Perbaikan</h3>
              <p className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">
                Cari dan sortir work order perbaikan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-500 transition hover:bg-amber-500 hover:text-slate-900"
              >
                <FaPlus /> Tambah
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-500 transition hover:bg-emerald-500 hover:text-slate-900">
                <FaFileExcel /> Export Excel
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input
              type="text"
              placeholder="Cari kode, unit, lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="EXCAVATOR">Excavator</option>
              <option value="MOTOR GRADER">Motor Grader</option>
              <option value="TRUCK">Truck</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Menunggu">Menunggu</option>
              <option value="Proses">Proses</option>
              <option value="Selesai">Selesai</option>
            </select>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none"
            >
              <option value="Semua">Semua Lokasi</option>
              <option value="Site A">Site A</option>
              <option value="Site B">Site B</option>
              <option value="Site C">Site C</option>
              <option value="Workshop">Workshop</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {paginatedRepairs.map((repair) => (
            <Link
              key={repair.code}
              href={`/maintenance/detail-perbaikan?id=${repair.code}`}
              className="block rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/50 p-5 transition hover:border-amber-500/30 hover:bg-slate-50 dark:hover:bg-slate-900 group"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-950/70 p-3 group-hover:bg-slate-100 dark:group-hover:bg-slate-950 transition">
                  <img
                    src={`/units/${repair.image}`}
                    alt={repair.unit}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/400x400/1e293b/cbd5e1?text=No+Image";
                    }}
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-xs font-bold tracking-widest text-slate-400 dark:text-slate-600 dark:text-slate-400">
                        {repair.code}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        <FaClockRotateLeft className="inline mr-1" />
                        {repair.date}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                      {repair.unit}
                    </h4>
                    <p className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400 line-clamp-1">
                      {repair.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <FaLayerGroup /> {repair.category}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <FaLocationDot /> {repair.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                          repair.status === "Selesai"
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : repair.status === "Proses"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 border-dashed"
                              : "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300"
                        }`}
                      >
                        {repair.status === "Selesai" ? (
                          <FaCheck />
                        ) : repair.status === "Proses" ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <FaClockRotateLeft />
                        )}
                        {repair.status}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                          repair.priority === "Tinggi"
                            ? "bg-rose-500/10 text-rose-400"
                            : repair.priority === "Sedang"
                              ? "bg-orange-500/10 text-orange-400"
                              : "bg-slate-500/10 text-slate-400 dark:text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <FaFlag /> Prioritas {repair.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {paginatedRepairs.length === 0 && (
            <div className="py-10 text-center text-slate-400 dark:text-slate-600 dark:text-slate-400">
              Tidak ada perbaikan yang sesuai dengan filter.
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
      </MaintenanceLayout>

      <AddRepairModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRepair}
      />
    </React.Fragment>
  );
}
