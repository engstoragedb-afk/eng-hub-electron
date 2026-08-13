import React, { useState, useEffect } from "react";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import { mechanics } from "@/common/data/maintenanceData";
import { FaMagnifyingGlass, FaXmark, FaPenToSquare } from "react-icons/fa6";
import toast from "react-hot-toast";

// Constants
const WELDER_JOBS = [
  "Weld / Gouging - Kecil (20 pts)",
  "Weld - Besar (40 pts)",
];

const MECHANIC_JOBS = [
  "Adjust (60 pts)",
  "Delivery (20 pts)",
  "Flushing (15 pts)",
  "Inspection (5 pts)",
  "Install - Remove / Besar (40 pts)",
  "Install - Remove / Kecil (10 pts)",
  "Minor Overhaul (40 pts)",
  "Overhaul (70 pts)",
  "Repair - Besar (30 pts)",
  "Repair - Ringan (10 pts)",
  "Repair - Sedang (20 pts)",
  "Replace (20 pts)",
  "Retorque (18 pts)",
  "Service Schedule - PM 1000 Jam (30 pts)",
  "Service Schedule - PM 250 Jam (10 pts)",
  "Service Schedule - PM 300 Jam (10 pts)",
  "Service Schedule - PM 500 Jam (15 pts)",
  "Shimming (15 pts)",
  "Swap (25 pts)",
  "Troubleshooting - Electrical (35 pts)",
  "Troubleshooting - Mechanical (35 pts)",
];

const unitOperatorMap: Record<string, string> = {
  "PC07": "Budi Santoso",
  "BD02": "Rudi Hartono",
  "DT15": "Joko Anwar",
  "GR05": "Tono Haryanto",
  "PC200-7": "Hendra",
  "D85ESS": "Bagas",
};

// Helper to get initials
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

type TabType = "MECHANIC" | "WELDER" | "DELIVERY";

export default function MaintenanceMechanicPage() {
  const [localUsers, setLocalUsers] = useState(mechanics);
  const [activeTab, setActiveTab] = useState<TabType>("MECHANIC");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Semua");
  
  // Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Form state
  const [assignUnit, setAssignUnit] = useState("");
  const [assignLocation, setAssignLocation] = useState("");
  const [assignDate, setAssignDate] = useState("");
  const [assignStartTime, setAssignStartTime] = useState("");
  const [assignEndTime, setAssignEndTime] = useState("");
  const [assignTypeJob, setAssignTypeJob] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignStatus, setAssignStatus] = useState("RFU (Selesai)");
  const [assignRemark, setAssignRemark] = useState("");
  const [assignOperatorName, setAssignOperatorName] = useState("");

  useEffect(() => {
    if (isAssignModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAssignModalOpen]);

  const filteredUsers = localUsers.filter((user) => {
    if (user.role !== activeTab) return false;
    
    const matchSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.unit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "Semua" || user.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAssign = (user: any) => {
    setSelectedUser(user);
    setAssignUnit(user.unit !== "-" ? user.unit : "");
    setAssignLocation(user.location !== "-" ? user.location : "");
    setAssignDate("");
    setAssignStartTime("");
    setAssignEndTime("");
    setAssignTypeJob("");
    setAssignDesc("");
    setAssignStatus("RFU (Selesai)");
    setAssignRemark("");
    
    if (user.role === "DELIVERY") {
      const initialUnit = user.unit !== "-" ? user.unit : "";
      setAssignOperatorName(unitOperatorMap[initialUnit] || "");
    }
    
    setIsAssignModalOpen(true);
  };

  const handleCloseAssign = () => {
    setIsAssignModalOpen(false);
    setSelectedUser(null);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim().toUpperCase();
    setAssignUnit(e.target.value);
    if (selectedUser?.role === "DELIVERY") {
      setAssignOperatorName(unitOperatorMap[val] || "Tidak ada operator terdaftar");
    }
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      setLocalUsers(prev => prev.map(u => {
        if (u.id === selectedUser.id) {
          return {
            ...u,
            unit: assignUnit.trim() || "-",
            location: assignLocation.trim() || "-"
          };
        }
        return u;
      }));
      toast.success(`Penugasan ${selectedUser.name} diperbarui`);
    }
    handleCloseAssign();
  };

  return (
    <React.Fragment>
      <MaintenanceLayout title={activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} subtitle="Manajemen Personel">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-4">
            <div className="relative">
              <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama atau ID..."
                className="w-64 rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>

        <div className="mb-8 flex space-x-2 border-b border-slate-300 dark:border-white/10 pb-4">
          {(["MECHANIC", "WELDER", "DELIVERY"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <section className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.length === 0 && (
              <div className="col-span-full rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/70 p-5 text-slate-500 dark:text-slate-400 text-center">
                Tidak ada {activeTab.toLowerCase()} ditemukan.
              </div>
            )}
            
            {filteredUsers.map((item) => (
              <div
                key={item.id}
                className="flex flex-col rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/70 p-5 transition hover:border-amber-400/60 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950">
                      <span className="text-xl font-bold text-sky-400">
                        {getInitials(item.name)}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        {item.id}
                      </div>
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "Aktif"
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 dark:border-white/5 pt-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Unit Assignment</p>
                    <p
                      className={`font-medium ${
                        item.unit === "-" ? "text-slate-500 dark:text-slate-400" : "text-amber-400"
                      }`}
                    >
                      {item.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                    <p
                      className={`font-medium ${
                        item.location === "-" ? "text-slate-500 dark:text-slate-400" : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {item.location}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAssign(item)}
                  className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-slate-200/50 dark:bg-white/5 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-amber-500/20 hover:text-amber-300"
                >
                  <FaPenToSquare /> Atur Penugasan
                </button>
              </div>
            ))}
          </div>
        </section>
      </MaintenanceLayout>

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950/80 p-6">
          <div className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/95 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-300 dark:border-white/10 px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Atur Penugasan</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Pilih unit dan lokasi untuk <strong>{selectedUser?.name}</strong>.
                </p>
              </div>
              <button
                onClick={handleCloseAssign}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 transition hover:bg-slate-200 dark:bg-slate-700"
              >
                <FaXmark />
              </button>
            </div>
            
            <form onSubmit={handleSaveAssignment} className="overflow-y-auto p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Type Unit</span>
                  <input
                    type="text"
                    value={assignUnit}
                    onChange={handleUnitChange}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                    placeholder="Ex: PC200-7, D85ESS"
                  />
                </label>
                <label className="block space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Lokasi Kerja</span>
                  <input
                    type="text"
                    value={assignLocation}
                    onChange={(e) => setAssignLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                    placeholder="Workshop, Pit A, Pekanbaru"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Tanggal *</span>
                  <input
                    type="date"
                    value={assignDate}
                    onChange={(e) => setAssignDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50 [color-scheme:dark]"
                    required
                  />
                </label>
                <label className="block space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Start Time</span>
                  <input
                    type="time"
                    value={assignStartTime}
                    onChange={(e) => setAssignStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50 [color-scheme:dark]"
                  />
                </label>
              </div>

              {/* Operator Name (Delivery Only) */}
              {selectedUser?.role === "DELIVERY" && (
                <label className="block space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Nama Operator</span>
                  <input
                    type="text"
                    value={assignOperatorName}
                    readOnly
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50 opacity-80 cursor-not-allowed"
                    placeholder="Nama Operator"
                  />
                </label>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">End Time</span>
                  <input
                    type="time"
                    value={assignEndTime}
                    onChange={(e) => setAssignEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50 [color-scheme:dark]"
                  />
                </label>

                {/* Type Job (Mechanic and Welder) */}
                {selectedUser?.role !== "DELIVERY" && (
                  <label className="block space-y-1.5 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Type Job *</span>
                    <select
                      value={assignTypeJob}
                      onChange={(e) => setAssignTypeJob(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                      required
                    >
                      <option value="" disabled hidden>
                        Pilih Type Job
                      </option>
                      {(selectedUser?.role === "WELDER" ? WELDER_JOBS : MECHANIC_JOBS).map(
                        (job) => (
                          <option key={job} value={job}>
                            {job}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                )}
              </div>

              <label className="block space-y-1.5 text-xs">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Deskripsi Pekerjaan *</span>
                <textarea
                  rows={3}
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50 resize-none"
                  required
                ></textarea>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Status</span>
                  <select
                    value={assignStatus}
                    onChange={(e) => setAssignStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                  >
                    <option value="RFU (Selesai)">RFU (Selesai)</option>
                    <option value="CONTINUE (Lanjut Besok)">CONTINUE (Lanjut Besok)</option>
                    <option value="PENDING (Tunda)">PENDING (Tunda)</option>
                  </select>
                </label>
              </div>

              {selectedUser?.role !== "DELIVERY" && (
                <label className="block space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Remark / Catatan</span>
                  <textarea
                    rows={2}
                    value={assignRemark}
                    onChange={(e) => setAssignRemark(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50 resize-none"
                    placeholder="Alasan jika PENDING/CONTINUE..."
                  ></textarea>
                </label>
              )}
              
              <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-slate-300 dark:border-white/10 mt-2">
                <button
                  type="button"
                  onClick={handleCloseAssign}
                  className="rounded-xl border border-slate-700/70 bg-white dark:bg-slate-900/90 px-5 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 transition hover:border-amber-300/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                >
                  Simpan Penugasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
