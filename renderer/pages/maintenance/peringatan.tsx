import React, { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import SectionHeading from "@/components/atoms/SectionHeading";
import { unitService } from "@/services/unit-service";
import { useRouter } from "next/router";
import { FaExclamationTriangle, FaChevronRight, FaWrench, FaTools, FaUndo, FaSearch, FaTimes, FaCheckCircle } from "react-icons/fa";
import CompleteServiceModal from "@/components/organisms/CompleteServiceModal";

const categoryImages: Record<string, string> = {
  EXCAVATOR: "/units/exavator.png",
  BULLDOZER: "/units/bulldozer.png",
  VIBRO: "/units/vibro.png",
  "MOTOR GRADER": "/units/motor-grader.png",
  TRUCK: "/units/truck.png",
};

export default function PeringatanServisPage() {
  const router = useRouter();
  
  const [units, setUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Semua");
  const [activeLevelTab, setActiveLevelTab] = useState("Semua Level");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [servicingItem, setServicingItem] = useState<{ item: any; unit: any } | null>(null);

  const tabs = ["Semua", "350", "500", "1000", "2000", "4000", "5000", "NORMAL"];
  
  const fetchUnits = () => {
    setIsLoading(true);
    unitService.getAllUnitsWithDetail()
      .then((res) => {
        setUnits(res || []);
      })
      .catch((err) => {
        console.error("Failed to fetch units with details:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const mappedUnits = useMemo(() => {
    return units.map((unit: any) => {
      const rawHours = unit.hours !== undefined && unit.hours !== null ? unit.hours : unit.hm;
      const hoursNum = parseFloat(String(rawHours ?? 0).replace(/[^\d.-]/g, ''));
      const isZeroHours = isNaN(hoursNum) || hoursNum <= 0;

      const aplItems = (unit.aplData || []).map((apl: any) => {
        const input = apl.input ?? 0;
        const vault = apl.vault ?? 0;
        let level: 'CRITICAL' | 'URGENT' | 'ATTENTION' | 'NORMAL' = 'NORMAL';
        let message = 'Dalam batas normal';

        if (!isZeroHours && vault > 0) {
          if (input < 0) {
            level = 'CRITICAL';
            message = 'Telah melewati batas rekomendasi';
          } else if (input > 0 && input <= 10) {
            level = 'URGENT';
            message = 'Sudah harus diganti';
          } else if (input > 10 && input < 50) {
            level = 'ATTENTION';
            message = 'Mendekati jadwal pemeliharaan';
          } else {
            level = 'NORMAL';
            message = 'Dalam batas normal';
          }
        }

        return {
          ...apl,
          level,
          message,
          input,
          vault
        };
      });

      // Determine unit's most severe level
      let mostSevereLevel: 'CRITICAL' | 'URGENT' | 'ATTENTION' | 'NORMAL' = 'NORMAL';
      if (!isZeroHours) {
        if (aplItems.some((i: any) => i.level === 'CRITICAL')) {
          mostSevereLevel = 'CRITICAL';
        } else if (aplItems.some((i: any) => i.level === 'URGENT')) {
          mostSevereLevel = 'URGENT';
        } else if (aplItems.some((i: any) => i.level === 'ATTENTION')) {
          mostSevereLevel = 'ATTENTION';
        }
      }

      // Warning items are those with vault > 0 and (input < 0 or (input > 0 and input < 50)).
      const warningItems = isZeroHours 
        ? [] 
        : aplItems.filter((i: any) => (i.vault ?? 0) > 0 && (i.input < 0 || (i.input > 0 && i.input < 50)));

      const categoryName = unit.category?.name || (typeof unit.category === 'string' ? unit.category : '');
      const imageUrl = unit.image || (categoryName ? categoryImages[categoryName] : '');

      return {
        id: unit.id,
        unit_name: unit.code || unit.name || 'Unknown Unit',
        category: categoryName,
        type: unit.type?.name || (typeof unit.type === 'string' ? unit.type : ''),
        image: imageUrl,
        service: (isZeroHours || mostSevereLevel === 'NORMAL') ? 'NORMAL' : (unit.service || 'NORMAL'),
        hours: unit.hours,
        hm: unit.hm,
        status: unit.status,
        mostSevereLevel,
        warningItems,
        allItems: aplItems
      };
    });
  }, [units]);

  const selectedWarningUnit = useMemo(() => {
    if (!selectedUnitId) return null;
    return mappedUnits.find(u => u.id === selectedUnitId) || null;
  }, [mappedUnits, selectedUnitId]);

  useEffect(() => {
    if (selectedWarningUnit) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedWarningUnit]);

  const psCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: mappedUnits.length };
    tabs.forEach(tab => {
      if (tab === "Semua") return;
      counts[tab] = mappedUnits.filter(u => String(u.service) === String(tab)).length;
    });
    return counts;
  }, [mappedUnits]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { "Semua Level": mappedUnits.length };
    ["CRITICAL", "URGENT", "NORMAL", "ATTENTION"].forEach(lvl => {
      counts[lvl] = mappedUnits.filter(u => u.mostSevereLevel === lvl).length;
    });
    return counts;
  }, [mappedUnits]);

  const filteredArray = useMemo(() => {
    return mappedUnits.filter((unit: any) => {
      if (activeLevelTab !== "Semua Level" && unit.mostSevereLevel !== activeLevelTab) {
        return false;
      }
      if (activeTab !== "Semua" && String(unit.service) !== String(activeTab)) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const codeMatch = (unit.unit_name || "").toLowerCase().includes(query);
        const categoryMatch = (unit.category || "").toLowerCase().includes(query);
        const typeMatch = (unit.type || "").toLowerCase().includes(query);
        const serviceMatch = (unit.service || "").toLowerCase().includes(query);
        const itemMatch = (unit.allItems || []).some((item: any) => 
          (item.name || "").toLowerCase().includes(query)
        );

        if (!codeMatch && !categoryMatch && !typeMatch && !serviceMatch && !itemMatch) {
          return false;
        }
      }
      return true;
    });
  }, [mappedUnits, activeTab, activeLevelTab, searchTerm]);

  const isFilterActive = activeTab !== "Semua" || activeLevelTab !== "Semua Level" || searchTerm.trim() !== "";

  const handlePsTabClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === "NORMAL") {
      setActiveLevelTab("NORMAL");
    } else if (tab !== "Semua" && activeLevelTab === "NORMAL") {
      setActiveLevelTab("Semua Level");
    }
  };

  const handleLevelTabClick = (tab: string) => {
    setActiveLevelTab(tab);
    if (tab === "NORMAL" && activeTab !== "Semua" && activeTab !== "NORMAL") {
      setActiveTab("Semua");
    }
  };

  return (
    <React.Fragment>
      <Head>
        <title>Peringatan Servis - ENG HUB</title>
      </Head>
      <MaintenanceLayout
        title="Peringatan Servis"
        subtitle="Daftar lengkap notifikasi sparepart dan jadwal pemeliharaan unit"
      >
        <section className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-6 shadow-xl">
          {/* Header Controls: Subtitle + Search Input + Reset Filter */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SectionHeading
                title=""
                description="Menampilkan semua status peringatan dan jadwal servis unit secara real-time"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Search Input Bar */}
              <div className="relative flex-1 md:w-80">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FaSearch size={13} />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari kode unit atau tipe (mis: D51, PC17)..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition shadow-2xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>

              {isFilterActive && (
                <button
                  onClick={() => {
                    setActiveTab("Semua");
                    setActiveLevelTab("Semua Level");
                    setSearchTerm("");
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:border-rose-300 transition shadow-2xs shrink-0 cursor-pointer"
                >
                  <FaUndo size={11} /> Reset Filter
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filter */}
            <div className="w-full lg:w-72 shrink-0 flex flex-col gap-5">
              
              {/* Filter Periodic Service (PS) */}
              <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FaTools className="text-sky-500" /> Interval Servis (PS)
                  </span>
                  {activeTab !== "Semua" && (
                    <span className="text-[10px] font-bold text-sky-500 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded-full">
                      {activeTab === "NORMAL" ? "Normal" : `PS ${activeTab}`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {tabs.map(tab => {
                    const count = psCounts[tab] || 0;
                    const isSelected = activeTab === tab;
                    const label = tab === "Semua" ? "Semua PS" : (tab === "NORMAL" ? "PS Normal" : `PS ${tab} H`);

                    return (
                      <button
                        key={tab}
                        onClick={() => handlePsTabClick(tab)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all duration-200 outline-none cursor-pointer ${
                          tab === "Semua" ? "col-span-2" : ""
                        } ${
                          isSelected
                            ? "bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-[1.02]"
                            : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200/60 dark:border-white/5"
                        }`}
                      >
                        <span className="truncate">{label}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${
                          isSelected
                            ? "bg-white text-sky-600"
                            : count > 0 
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              : "bg-transparent text-slate-400 dark:text-slate-600"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Tingkat Urgensi */}
              <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FaExclamationTriangle className="text-amber-500" /> Tingkat Urgensi
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {["Semua Level", "CRITICAL", "URGENT", "NORMAL", "ATTENTION"].map(tab => {
                    const count = levelCounts[tab] || 0;
                    const isSelected = activeLevelTab === tab;
                    let dotColor = "bg-slate-300 dark:bg-slate-600";
                    let activeBg = "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md ring-1 ring-slate-200/50 dark:ring-white/10";
                    
                    if (tab === "CRITICAL") {
                      dotColor = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]";
                      if (isSelected) activeBg = "bg-rose-500 text-white shadow-md shadow-rose-500/25";
                    } else if (tab === "URGENT") {
                      dotColor = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]";
                      if (isSelected) activeBg = "bg-amber-500 text-white shadow-md shadow-amber-500/25";
                    } else if (tab === "ATTENTION") {
                      dotColor = "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]";
                      if (isSelected) activeBg = "bg-sky-500 text-white shadow-md shadow-sky-500/25";
                    } else if (tab === "NORMAL") {
                      dotColor = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]";
                      if (isSelected) activeBg = "bg-emerald-500 text-white shadow-md shadow-emerald-500/25";
                    }

                    return (
                      <button
                        key={tab}
                        onClick={() => handleLevelTabClick(tab)}
                        className={`group flex items-center justify-between w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 outline-none cursor-pointer ${
                          isSelected
                            ? `${activeBg} scale-[1.02]`
                            : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full transition-transform duration-300 ${isSelected && tab !== "Semua Level" ? "bg-white" : dotColor} ${isSelected ? "scale-125" : "group-hover:scale-125"}`}></span>
                          <span>{tab}</span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${
                          isSelected
                            ? (tab === "Semua Level" ? "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white" : "bg-white/25 text-white")
                            : count > 0 
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              : "bg-transparent text-slate-400 dark:text-slate-600"
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grid Kartu Unit */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {isLoading ? (
                  <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500 dark:border-white/10 dark:border-t-sky-500" />
                    <p className="text-xs font-semibold text-slate-400">Memuat data unit...</p>
                  </div>
                ) : filteredArray.length === 0 ? (
                  <div className="col-span-full rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-950/70 p-12 text-center text-slate-400 dark:text-slate-600 dark:text-slate-400">
                    Tidak ada data unit yang cocok dengan filter atau pencarian.
                  </div>
                ) : (
                  filteredArray.map((unit: any) => {
                    const isCritical = unit.mostSevereLevel === "CRITICAL";
                    let badgeColor = "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-white/5";
                    let barColor = "bg-slate-300";
                    let iconBg = "bg-slate-50 text-slate-500 dark:bg-slate-800";

                    if (unit.mostSevereLevel === "CRITICAL") {
                      badgeColor = "bg-rose-50 text-rose-500 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20";
                      barColor = "bg-rose-500";
                      iconBg = "bg-rose-50 text-rose-500 dark:bg-rose-500/10";
                    } else if (unit.mostSevereLevel === "URGENT") {
                      badgeColor = "bg-amber-50 text-amber-500 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20";
                      barColor = "bg-amber-500";
                      iconBg = "bg-amber-50 text-amber-500 dark:bg-amber-500/10";
                    } else if (unit.mostSevereLevel === "ATTENTION") {
                      badgeColor = "bg-sky-50 text-sky-500 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20";
                      barColor = "bg-sky-500";
                      iconBg = "bg-sky-50 text-sky-500 dark:bg-sky-500/10";
                    } else if (unit.mostSevereLevel === "NORMAL") {
                      badgeColor = "bg-emerald-50 text-emerald-500 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20";
                      barColor = "bg-emerald-500";
                      iconBg = "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10";
                    }

                    const unitImage = unit.image;

                    return (
                      <div 
                        key={unit.id} 
                        onClick={() => setSelectedUnitId(unit.id)}
                        className="group flex flex-col p-4 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${barColor}`}></div>

                        <div className="flex items-center gap-3.5 ml-1">
                          {/* Unit Image / Avatar */}
                          <div className="relative w-13 h-13 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                            {unitImage ? (
                              <img 
                                src={unitImage} 
                                alt={unit.unit_name} 
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className={`w-full h-full rounded-xl flex items-center justify-center ${iconBg}`}>
                                {isCritical ? <FaExclamationTriangle size={18} /> : <FaWrench size={18} />}
                              </div>
                            )}
                            
                            {/* Floating mini badge on image */}
                            <div className={`absolute bottom-0.5 right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs border border-white dark:border-slate-900 ${
                              isCritical ? 'bg-rose-500 text-white' : 
                              unit.mostSevereLevel === 'URGENT' ? 'bg-amber-500 text-white' :
                              unit.mostSevereLevel === 'ATTENTION' ? 'bg-sky-500 text-white' :
                              'bg-emerald-500 text-white'
                            }`}>
                              {isCritical ? <FaExclamationTriangle size={7} /> : <FaWrench size={7} />}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${badgeColor}`}>
                                  {unit.mostSevereLevel}
                                </span>
                                {unit.service && unit.service !== "NORMAL" && unit.service !== "Normal" && (
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/5">
                                    PS {unit.service}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between mt-0.5">
                                <h3 className="text-slate-800 dark:text-slate-100 font-black text-lg uppercase tracking-wide group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                                  {unit.unit_name}
                                </h3>
                                <div className="w-6 h-6 shrink-0 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                                  <FaChevronRight size={10} className="ml-0.5" />
                                </div>
                              </div>

                              <span className="text-slate-400 dark:text-slate-500 text-[9px] flex items-center gap-1 font-semibold tracking-wide truncate">
                                {unit.category || unit.type || "Unit"} • {unit.hours ? `${unit.hours} Hours` : "0 Hours"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Modal Tindakan Servis Diperlukan */}
          {selectedWarningUnit && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className={`p-6 border-b ${
                  selectedWarningUnit.mostSevereLevel === 'NORMAL'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20'
                    : 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedWarningUnit.image && (
                        <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-white/10 shadow-xs shrink-0 flex items-center justify-center">
                          <img src={selectedWarningUnit.image} alt={selectedWarningUnit.unit_name} className="w-full h-full object-contain" />
                        </div>
                      )}
                      <h3 className={`text-xl font-bold ${
                        selectedWarningUnit.mostSevereLevel === 'NORMAL'
                          ? 'text-emerald-900 dark:text-emerald-400'
                          : 'text-amber-900 dark:text-amber-400'
                      }`}>
                        {selectedWarningUnit.mostSevereLevel === 'NORMAL' ? 'Status Servis Unit' : 'Tindakan Servis Diperlukan'}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setSelectedUnitId(null)}
                      className={`p-2 rounded-xl transition cursor-pointer ${
                        selectedWarningUnit.mostSevereLevel === 'NORMAL'
                          ? 'text-emerald-700 hover:bg-emerald-200/50 dark:text-emerald-500 dark:hover:bg-emerald-500/20'
                          : 'text-amber-700 hover:bg-amber-200/50 dark:text-amber-500 dark:hover:bg-amber-500/20'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                  <p className={`mt-2 text-sm ${
                    selectedWarningUnit.mostSevereLevel === 'NORMAL'
                      ? 'text-emerald-800 dark:text-emerald-500/80'
                      : 'text-amber-800 dark:text-amber-500/80'
                  }`}>
                    {selectedWarningUnit.mostSevereLevel === 'NORMAL' ? (
                      <>Unit <strong>{selectedWarningUnit.unit_name}</strong> dalam kondisi normal dan siap operasi:</>
                    ) : (
                      <>Unit <strong>{selectedWarningUnit.unit_name}</strong> memerlukan perbaikan untuk item berikut:</>
                    )}
                  </p>
                </div>
                
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
                  {(selectedWarningUnit.warningItems && selectedWarningUnit.warningItems.length > 0 
                    ? selectedWarningUnit.warningItems 
                    : selectedWarningUnit.allItems
                  ).map((item: any, i: number) => {
                    let textColor = "text-emerald-600 dark:text-emerald-400";
                    if (item.level === 'CRITICAL') textColor = "text-rose-500 dark:text-rose-400";
                    else if (item.level === 'URGENT') textColor = "text-amber-600 dark:text-amber-400";
                    else if (item.level === 'ATTENTION') textColor = "text-sky-600 dark:text-sky-400";

                    return (
                      <div key={i} className="flex flex-col gap-1 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 transition shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wide">
                            {item.name}
                          </div>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                            item.level === 'CRITICAL' ? 'bg-rose-50 text-rose-500 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20' :
                            item.level === 'URGENT' ? 'bg-amber-50 text-amber-500 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20' :
                            item.level === 'ATTENTION' ? 'bg-sky-50 text-sky-500 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20' :
                            'bg-emerald-50 text-emerald-500 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                          }`}>
                            {item.level}
                          </span>
                        </div>
                        <div className={`text-sm font-semibold ${textColor}`}>
                          {item.message}
                        </div>
                        
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-2">
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Sisa waktu / batas: <span className="font-bold text-slate-700 dark:text-slate-300">{item.input} H</span>
                          </div>
                          {(item.level === 'CRITICAL' || item.level === 'URGENT' || item.level === 'ATTENTION') && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setServicingItem({ item, unit: selectedWarningUnit });
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-[11px] font-bold shadow-xs shadow-emerald-500/20 transition cursor-pointer"
                            >
                              <FaCheckCircle size={11} />
                              <span>SUDAH DI GANTI</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {(!selectedWarningUnit.allItems || selectedWarningUnit.allItems.length === 0) && (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-6 text-sm italic bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                      Tidak ada detail komponen yang tersedia.
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                  <button
                    onClick={() => router.push(`/maintenance/detail-unit?id=${selectedWarningUnit.id}`)}
                    className="px-4 py-2 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    Buka Detail Unit →
                  </button>
                  <button
                    onClick={() => setSelectedUnitId(null)}
                    className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Form Konfirmasi Sudah Di Servis */}
          {servicingItem && (
            <CompleteServiceModal
              isOpen={!!servicingItem}
              onClose={() => setServicingItem(null)}
              item={servicingItem.item}
              unit={servicingItem.unit}
              onSuccess={fetchUnits}
            />
          )}
        </section>
      </MaintenanceLayout>
    </React.Fragment>
  );
}
