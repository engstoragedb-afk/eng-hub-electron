import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import { 
  FaSearch, 
  FaTimes, 
  FaTruck, 
  FaMapMarkerAlt, 
  FaUser, 
  FaClock, 
  FaArrowRight, 
  FaWrench, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaShieldAlt
} from "react-icons/fa";
import { unitService } from "@/services";
import { useUIStore } from "@/store/uiStore";

const categoryImages: Record<string, string> = {
  EXCAVATOR: "/units/exavator.png",
  BULLDOZER: "/units/bulldozer.png",
  VIBRO: "/units/vibro.png",
  MOTOR_GRADER: "/units/motor_grader.png",
  "MOTOR GRADER": "/units/motor_grader.png",
  DUMP_TRUCK: "/units/dumptruck.png",
  "DUMP TRUCK": "/units/dumptruck.png",
  TRUCK: "/units/dumptruck.png",
  WHEEL_LOADER: "/units/wheel_loader.png",
  "WHEEL LOADER": "/units/wheel_loader.png",
};

export default function GlobalUnitSearchModal() {
  const router = useRouter();
  const { isUnitSearchOpen, setUnitSearchOpen } = useUIStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [units, setUnits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Fetch all units when search modal is opened
  useEffect(() => {
    if (!isUnitSearchOpen) return;

    // Reset query & focus
    setSearchQuery("");
    setSelectedIndex(0);

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);

    // Load units
    setIsLoading(true);
    unitService.getAllUnitsWithDetail()
      .then((data) => {
        if (Array.isArray(data)) {
          setUnits(data);
        } else {
          setUnits([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load units for global search:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => clearTimeout(timer);
  }, [isUnitSearchOpen]);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isUnitSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isUnitSearchOpen]);

  const hasSearched = searchQuery.trim().length > 0;

  // Filter units
  const filteredUnits = useMemo(() => {
    if (!hasSearched) return [];

    const q = searchQuery.toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);

    return units.filter((unit) => {
      const code = String(unit.code || unit.name || "").toLowerCase();
      const catName = String(unit.category?.name || (typeof unit.category === "string" ? unit.category : "")).toLowerCase();
      const typeName = String(unit.type?.name || (typeof unit.type === "string" ? unit.type : "")).toLowerCase();
      const locName = String(unit.location?.name || (typeof unit.location === "string" ? unit.location : "")).toLowerCase();
      const opName = String(unit.operator?.full_name || unit.operator?.name || "").toLowerCase();
      const picName = String(unit.pic || "").toLowerCase();
      const brandName = String(unit.brand || "").toLowerCase();
      const modelName = String(unit.model || "").toLowerCase();
      const serialNumber = String(unit.serial_number || "").toLowerCase();
      const statusName = String(unit.status || "").toLowerCase();

      if (words.length === 0) return true;

      const fullSearchable = `${code} ${catName} ${typeName} ${locName} ${opName} ${picName} ${brandName} ${modelName} ${serialNumber} ${statusName}`;
      return words.every((word) => fullSearchable.includes(word));
    });
  }, [units, searchQuery, hasSearched]);

  // Reset selectedIndex if filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Scroll active item into view
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }, [selectedIndex]);

  // Navigate to unit detail
  const handleSelectUnit = (unit: any) => {
    if (!unit) return;
    const unitCode = unit.code || unit.name || "";
    const unitId = unit.id || "";
    setUnitSearchOpen(false);
    router.push(`/maintenance/detail-unit?code=${encodeURIComponent(unitCode)}&id=${encodeURIComponent(unitId)}`);
  };

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredUnits.length > 0 ? (prev + 1) % filteredUnits.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredUnits.length > 0 ? (prev - 1 + filteredUnits.length) % filteredUnits.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredUnits[selectedIndex]) {
        handleSelectUnit(filteredUnits[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setUnitSearchOpen(false);
    }
  };

  if (!isUnitSearchOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 animate-in fade-in duration-150"
      onClick={() => setUnitSearchOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all transform scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-500 flex items-center justify-center shrink-0">
              <FaSearch size={16} />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode unit, kategori, lokasi, PIC, operator... (CTRL+F)"
              className="flex-1 bg-transparent text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
            />

            <button
              type="button"
              onClick={() => setUnitSearchOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
              title="Tutup (ESC)"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* Results List Body */}
        <div 
          ref={listRef}
          className="max-h-[55vh] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 p-2"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <div className="w-8 h-8 rounded-full border-3 border-sky-500 border-t-transparent animate-spin mb-3" />
              <p className="text-sm font-medium">Memuat data unit...</p>
            </div>
          ) : !hasSearched ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center mb-3">
                <FaSearch size={20} />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Ketik untuk mencari unit
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                Cari berdasarkan kode unit (misal: <strong>PCM38</strong>, <strong>PC02</strong>), lokasi, operator, atau pilih kategori di atas.
              </p>
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                <FaTruck size={22} />
              </div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                Tidak ada unit yang sesuai
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Tidak ditemukan unit dengan kata kunci &quot;<span className="text-sky-500 font-semibold">{searchQuery}</span>&quot;.
              </p>
            </div>
          ) : (
            filteredUnits.map((unit, idx) => {
              const unitCode = unit.code || unit.name || "Unknown";
              const catName = unit.category?.name || (typeof unit.category === "string" ? unit.category : "-");
              const typeName = unit.type?.name || (typeof unit.type === "string" ? unit.type : "");
              const locName = unit.location?.name || (typeof unit.location === "string" ? unit.location : "-");
              const opName = unit.operator?.full_name || unit.operator?.name || "";
              const picName = unit.pic || "";
              const hoursVal = unit.hours !== undefined && unit.hours !== null ? unit.hours : (unit.hm || 0);
              const statusVal = unit.status || "Siap";
              const serviceVal = unit.service || "NORMAL";
              const unitImg = unit.image || categoryImages[catName.toUpperCase()] || categoryImages[catName] || null;
              const isSelected = selectedIndex === idx;

              return (
                <button
                  key={unit.id || unitCode}
                  ref={(el) => { itemRefs.current[idx] = el; }}
                  type="button"
                  onClick={() => handleSelectUnit(unit)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all duration-150 cursor-pointer ${
                    isSelected 
                      ? "bg-sky-50 dark:bg-sky-500/15 border border-sky-300 dark:border-sky-500/30 shadow-xs" 
                      : "hover:bg-slate-100/70 dark:hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Unit Thumbnail */}
                    <div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden p-1 ${
                        isSelected 
                          ? "bg-white dark:bg-slate-800 border-sky-400/50 dark:border-sky-500/40" 
                          : "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-white/5"
                      }`}
                    >
                      {unitImg ? (
                        <img 
                          src={unitImg} 
                          alt={unitCode} 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <FaTruck className="text-slate-400 text-lg" />
                      )}
                    </div>

                    {/* Unit Info */}
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-base font-black tracking-tight ${
                          isSelected ? "text-sky-600 dark:text-sky-400" : "text-slate-900 dark:text-slate-100"
                        }`}>
                          {unitCode}
                        </span>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          {catName}
                        </span>

                        {typeName && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                            {typeName}
                          </span>
                        )}

                        {picName && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <FaShieldAlt size={9} />
                            {picName}
                          </span>
                        )}
                      </div>

                      {/* Details row: Location, Operator, Hours */}
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <FaMapMarkerAlt size={10} className="text-rose-500 shrink-0" />
                          <span className="truncate max-w-[120px]">{locName}</span>
                        </span>

                        {opName && (
                          <span className="flex items-center gap-1">
                            <FaUser size={10} className="text-sky-500 shrink-0" />
                            <span className="truncate max-w-[130px]">{opName}</span>
                          </span>
                        )}

                        <span className="flex items-center gap-1 font-mono">
                          <FaClock size={10} className="text-amber-500 shrink-0" />
                          <span>{hoursVal} H</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status & Action Arrow */}
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {/* Status Badge */}
                    {serviceVal && serviceVal !== "NORMAL" ? (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                        <FaWrench size={10} />
                        PS {serviceVal} H
                      </span>
                    ) : statusVal === "Breakdown" || statusVal === "Perbaikan" ? (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/50">
                        <FaExclamationTriangle size={10} />
                        Breakdown
                      </span>
                    ) : (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50">
                        <FaCheckCircle size={10} />
                        Siap
                      </span>
                    )}

                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                      isSelected 
                        ? "bg-sky-500 text-white shadow-xs scale-105" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}>
                      <FaArrowRight size={12} />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer / Keyboard Shortcuts Info */}
        <div className="p-3 sm:px-5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[10px]">↓</kbd>
              <span>Pilih</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold text-[10px]">↵ Enter</kbd>
              <span>Buka Detail</span>
            </span>
          </div>

          <div className="font-semibold text-slate-600 dark:text-slate-400">
            {hasSearched ? `${filteredUnits.length} unit ditemukan` : `${units.length} unit tersedia`}
          </div>
        </div>
      </div>
    </div>
  );
}
