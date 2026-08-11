import React, { useState, useMemo, useEffect } from "react";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import {
  FaChevronLeft,
  FaChevronRight,
  FaScrewdriverWrench,
  FaUserGear,
  FaFireBurner,
  FaTruckFast,
  FaXmark,
} from "react-icons/fa6";
import toast from "react-hot-toast";

// ----- STATIC DATA -----
const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const initialScheduleData: Record<string, any[]> = {
  "2026-7-4": [
    { unit: "PC01", type: "Excavator", image: "/units/exavator.png", name: "Agus P.", role: "mechanic", status: "working", startTime: "08:00", endTime: "12:00" },
    { unit: "DT15", type: "Dump Truck", image: "/units/truck.png", name: "Rian", role: "operator", status: "working", startTime: "07:00", endTime: "16:00" }
  ],
  "2026-7-12": [
    { unit: "DT15", type: "Dump Truck", image: "/units/truck.png", name: "Doni W.", role: "delivery", status: "pending", startTime: "10:00", endTime: "14:00" }
  ],
  "2026-7-18": [
    { unit: "BD02", type: "Bulldozer", image: "/units/bulldozer.png", name: "Kiki S.", role: "welder", status: "working", startTime: "09:00", endTime: "15:00" },
    { unit: "GR05", type: "Grader", image: "/units/motor-grader.png", name: "Bambang P.", role: "mechanic", status: "working", startTime: "13:00", endTime: "17:00" }
  ],
  "2026-7-25": [
    { unit: "PC200", type: "Excavator", image: "/units/exavator.png", name: "Rizky F.", role: "welder", status: "working", startTime: "08:00", endTime: "16:00" }
  ]
};

const WELDER_JOBS = ["Weld / Gouging - Kecil (20 pts)", "Weld - Besar (40 pts)"];
const MECHANIC_JOBS = [
  "Adjust (60 pts)", "Flushing (15 pts)", "Inspection (5 pts)",
  "Install - Remove / Besar (40 pts)", "Minor Overhaul (40 pts)",
  "Repair - Besar (30 pts)", "Repair - Ringan (10 pts)",
  "Troubleshooting (35 pts)"
];
const unitOperatorMap: Record<string, string> = {
  "PC07": "Budi Santoso", "BD02": "Rudi Hartono", "DT15": "Joko Anwar",
  "GR05": "Tono Haryanto", "PC200-7": "Hendra", "D85ESS": "Bagas"
};


export default function MaintenanceJadwalPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // Start at Aug 2026
  const [scheduleData, setScheduleData] = useState(initialScheduleData);
  
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [filterCode, setFilterCode] = useState("Semua");

  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [selectedDateRaw, setSelectedDateRaw] = useState(""); // YYYY-MM-DD for form
  const [selectedRole, setSelectedRole] = useState<"MECHANIC"|"WELDER"|"DELIVERY">("MECHANIC");
  
  // Assign Form state
  const [assignUser, setAssignUser] = useState("");
  const [assignUnit, setAssignUnit] = useState("");
  const [assignLocation, setAssignLocation] = useState("");
  const [assignStartTime, setAssignStartTime] = useState("");
  const [assignEndTime, setAssignEndTime] = useState("");
  const [assignTypeJob, setAssignTypeJob] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignStatus, setAssignStatus] = useState("RFU (Selesai)");
  const [assignRemark, setAssignRemark] = useState("");
  const [assignOperatorName, setAssignOperatorName] = useState("");

  useEffect(() => {
    if (isRoleModalOpen || isAssignModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isRoleModalOpen, isAssignModalOpen]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Generate Calendar Days
  const days = useMemo(() => {
    const calendarDays = [];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      let lookupYear = year;
      let lookupMonth = month - 1;
      if (lookupMonth < 0) { lookupMonth = 11; lookupYear--; }
      calendarDays.push({ day: prevMonthDays - i, isFaded: true, lookupYear, lookupMonth });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({ day: i, isFaded: false, lookupYear: year, lookupMonth: month });
    }

    // Next month leading days (to fill 42 grid cells)
    const totalCells = firstDay + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      let lookupYear = year;
      let lookupMonth = month + 1;
      if (lookupMonth > 11) { lookupMonth = 0; lookupYear++; }
      calendarDays.push({ day: i, isFaded: true, lookupYear, lookupMonth });
    }

    return calendarDays;
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (lookupYear: number, lookupMonth: number, day: number) => {
    const dateKey = `${lookupYear}-${lookupMonth}-${day}`; // For lookup data (M is 0-11)
    const mm = String(lookupMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const formDate = `${lookupYear}-${mm}-${dd}`;
    
    setSelectedDateStr(dateKey);
    setSelectedDateRaw(formDate);
    setIsRoleModalOpen(true);
  };

  const openAssignModal = (role: "MECHANIC"|"WELDER"|"DELIVERY") => {
    setSelectedRole(role);
    setIsRoleModalOpen(false);
    
    // Reset form
    setAssignUser("");
    setAssignUnit("");
    setAssignLocation("");
    setAssignStartTime("");
    setAssignEndTime("");
    setAssignTypeJob("");
    setAssignDesc("");
    setAssignStatus("RFU (Selesai)");
    setAssignRemark("");
    setAssignOperatorName("");
    
    setIsAssignModalOpen(true);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim().toUpperCase();
    setAssignUnit(e.target.value);
    if (selectedRole === "DELIVERY") {
      setAssignOperatorName(unitOperatorMap[val] || "Tidak ada operator terdaftar");
    }
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new event object
    const newEvent = {
      unit: assignUnit || "N/A",
      type: "Baru", // Fallback, could be mapped based on unit prefix
      image: "/units/exavator.png", // Fallback
      name: assignUser,
      role: selectedRole.toLowerCase(),
      status: assignStatus === "RFU (Selesai)" ? "working" : "pending",
      startTime: assignStartTime || "00:00",
      endTime: assignEndTime || "00:00",
    };

    setScheduleData(prev => {
      const existing = prev[selectedDateStr] || [];
      return {
        ...prev,
        [selectedDateStr]: [...existing, newEvent]
      };
    });

    toast.success("Penugasan baru berhasil ditambahkan!");
    setIsAssignModalOpen(false);
  };

  const todayStr = `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`;

  return (
    <React.Fragment>
      <MaintenanceLayout title="Jadwal Perbaikan" subtitle="Manajemen Waktu">
        <div className="flex flex-col h-[calc(100vh-80px)]">
          {/* Header */}
          <div className="mb-6 flex items-center justify-end gap-4">
            <div className="flex items-center gap-4">
              <button onClick={handlePrevMonth} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition hover:bg-slate-200/50 dark:bg-white/5">
                <FaChevronLeft />
              </button>
              <div className="text-lg font-bold w-40 text-center text-slate-900 dark:text-slate-100">
                {monthNames[month]} {year}
              </div>
              <button onClick={handleNextMonth} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition hover:bg-slate-200/50 dark:bg-white/5">
                <FaChevronRight />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/50 p-4">
            <label className="flex items-center gap-3 text-sm">
              <span className="text-slate-400 dark:text-slate-600 dark:text-slate-400">Kategori:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Excavator">Excavator</option>
                <option value="Dump Truck">Dump Truck</option>
                <option value="Bulldozer">Bulldozer</option>
                <option value="Grader">Grader</option>
              </select>
            </label>
            <label className="flex items-center gap-3 text-sm">
              <span className="text-slate-400 dark:text-slate-600 dark:text-slate-400">Kode Unit:</span>
              <select
                value={filterCode}
                onChange={(e) => setFilterCode(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
              >
                <option value="Semua">Semua Unit</option>
                <option value="PC01">PC01</option>
                <option value="PC200">PC200</option>
                <option value="DT15">DT15</option>
                <option value="BD02">BD02</option>
                <option value="GR05">GR05</option>
              </select>
            </label>
          </div>

          {/* Calendar Grid Container */}
          <div className="flex-1 flex flex-col rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/50 overflow-hidden shadow-2xl backdrop-blur-sm min-h-0">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 shrink-0">
              {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((d, i) => (
                <div key={d} className={`py-3 text-center text-sm font-semibold ${i === 0 ? "text-rose-400" : "text-slate-700 dark:text-slate-300"}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Scrollable Calendar Body */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900/20 custom-scrollbar">
              <div className="grid grid-cols-7 grid-rows-6 gap-px bg-slate-200/50 dark:bg-white/5 min-h-[700px] h-full">
                {days.map((d, idx) => {
                  const dateKey = `${d.lookupYear}-${d.lookupMonth}-${d.day}`;
                  const isToday = dateKey === todayStr;
                  const dayEvents = scheduleData[dateKey] || [];

                  // Apply filters
                  const filteredEvents = dayEvents.filter((job) => {
                    if (filterCategory !== "Semua" && job.type !== filterCategory) return false;
                    if (filterCode !== "Semua" && job.unit !== filterCode) return false;
                    return true;
                  });

                  return (
                    <div
                      key={idx}
                      onClick={() => handleDayClick(d.lookupYear, d.lookupMonth, d.day)}
                      className={`bg-slate-50 dark:bg-slate-950 p-2 relative overflow-hidden transition hover:bg-slate-50 dark:hover:bg-slate-900 group cursor-pointer ${
                        d.isFaded ? "text-slate-400 dark:text-slate-600" : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                          isToday ? "bg-amber-500 text-slate-950" : ""
                        }`}
                      >
                        {d.day}
                      </div>

                      {filteredEvents.length > 0 && (
                        <div className="mt-2 space-y-1 overflow-y-auto max-h-[85px] pr-1 custom-scrollbar">
                          {filteredEvents.map((job, jIdx) => {
                            const isWorking = job.status === "working";
                            const statusColor = isWorking ? "text-amber-400" : "text-slate-400 dark:text-slate-600 dark:text-slate-400";
                            const iconAnim = isWorking ? "animate-pulse" : "";

                            let roleIcon = <FaScrewdriverWrench />;
                            let roleTitle = "Mechanic";
                            if (job.role === "operator") {
                              roleIcon = <FaUserGear />;
                              roleTitle = "Operator";
                            } else if (job.role === "welder") {
                              roleIcon = <FaFireBurner />;
                              roleTitle = "Welder";
                            } else if (job.role === "delivery") {
                              roleIcon = <FaTruckFast />;
                              roleTitle = "Delivery";
                            }

                            return (
                              <div
                                key={jIdx}
                                className="relative flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/80 p-2 group-hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow"
                                onClick={(e) => e.stopPropagation()} // Prevent triggering cell click when clicking an event
                              >
                                <div className="flex items-center gap-2 max-w-[calc(100%-30px)]">
                                  <div className="h-8 w-8 overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-950 p-0.5 border border-slate-300 dark:border-white/10 shrink-0">
                                    <img src={job.image} alt={job.unit} className="h-full w-full object-contain" onError={(e) => e.currentTarget.src = "/units/exavator.png"} />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                                      {job.unit}
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-600 dark:text-slate-400 truncate leading-tight">
                                      {job.name}{" "}
                                      <span className="text-slate-500 dark:text-slate-400">
                                        ({job.startTime} - {job.endTime})
                                      </span>
                                    </p>
                                  </div>
                                </div>
                                <div className={`${statusColor} ${iconAnim} shrink-0`} title={`${roleTitle} ${isWorking ? "Bekerja" : "Menunggu"}`}>
                                  <div className="text-sm">{roleIcon}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </MaintenanceLayout>

      {/* Role Selection Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950/80 p-6 backdrop-blur-sm" onClick={() => setIsRoleModalOpen(false)}>
          <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/95 shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Pilih Jenis Penugasan</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => openAssignModal("MECHANIC")}
                className="flex items-center justify-center rounded-xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 py-3 font-semibold text-slate-800 dark:text-slate-200 hover:bg-amber-500/20 hover:text-amber-200 transition"
              >
                <FaScrewdriverWrench className="mr-2" /> Penugasan Mechanic
              </button>
              <button
                onClick={() => openAssignModal("WELDER")}
                className="flex items-center justify-center rounded-xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 py-3 font-semibold text-slate-800 dark:text-slate-200 hover:bg-amber-500/20 hover:text-amber-200 transition"
              >
                <FaFireBurner className="mr-2" /> Penugasan Welder
              </button>
              <button
                onClick={() => openAssignModal("DELIVERY")}
                className="flex items-center justify-center rounded-xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 py-3 font-semibold text-slate-800 dark:text-slate-200 hover:bg-amber-500/20 hover:text-amber-200 transition"
              >
                <FaTruckFast className="mr-2" /> Penugasan Delivery
              </button>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="mt-2 rounded-xl bg-slate-100 dark:bg-slate-800 py-3 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:bg-slate-700 transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950/80 p-6 backdrop-blur-sm">
          <div className="flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/95 shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-300 dark:border-white/10 px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Atur Penugasan ({selectedRole})</h3>
                <p className="text-sm text-slate-400 dark:text-slate-600 dark:text-slate-400">
                  Pilih unit dan lokasi untuk penugasan tanggal {selectedDateRaw}.
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 transition hover:bg-slate-200 dark:bg-slate-700"
              >
                <FaXmark />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="overflow-y-auto p-6 space-y-4">
              <label className="block space-y-1.5 text-xs mb-4">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Pilih Personel *</span>
                <select
                  value={assignUser}
                  onChange={(e) => setAssignUser(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                  required
                >
                  <option value="" disabled hidden>
                    Pilih Personel
                  </option>
                  {selectedRole === "MECHANIC" && (
                    <>
                      <option value="Agus Pratama">Agus Pratama (Mechanic)</option>
                      <option value="Doni Wijaya">Doni Wijaya (Mechanic)</option>
                    </>
                  )}
                  {selectedRole === "WELDER" && (
                    <>
                      <option value="Bambang Pamungkas">Bambang Pamungkas (Welder)</option>
                      <option value="Rizky Firmansyah">Rizky Firmansyah (Welder)</option>
                    </>
                  )}
                  {selectedRole === "DELIVERY" && (
                    <option value="Arif Sudarman">Arif Sudarman (Delivery)</option>
                  )}
                </select>
              </label>

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
                    value={selectedDateRaw}
                    readOnly
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50 opacity-80 cursor-not-allowed"
                    required
                  />
                </label>
                <label className="block space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Start Time</span>
                  <input
                    type="time"
                    value={assignStartTime}
                    onChange={(e) => setAssignStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                    style={{ colorScheme: "dark" }}
                  />
                </label>
              </div>

              {/* Operator Name (Delivery Only) */}
              {selectedRole === "DELIVERY" && (
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
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500/50"
                    style={{ colorScheme: "dark" }}
                  />
                </label>

                {/* Type Job (Mechanic and Welder) */}
                {selectedRole !== "DELIVERY" && (
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
                      {(selectedRole === "WELDER" ? WELDER_JOBS : MECHANIC_JOBS).map(
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

              {selectedRole !== "DELIVERY" && (
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
                  onClick={() => setIsAssignModalOpen(false)}
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
