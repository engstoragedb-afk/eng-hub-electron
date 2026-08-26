import React, { useState, useEffect } from "react";
import { FaTimes, FaHistory, FaCheckCircle, FaClock, FaSearchPlus, FaWrench, FaCalendarAlt } from "react-icons/fa";
import { aplHistoryService } from "@/services";
import { APLSTATUS } from "@/common/utils/status";
import toast from "react-hot-toast";

type UnitServiceHistoryDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  unit: any;
  setPreviewImageUrl: (url: string) => void;
};

export default function UnitServiceHistoryDrawer({
  isOpen,
  onClose,
  unit,
  setPreviewImageUrl,
}: UnitServiceHistoryDrawerProps) {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !unit?.id) return;

    const fetchServiceHistory = async () => {
      setIsLoading(true);
      try {
        const data = await aplHistoryService.findAllNoPaginate({
          unit_id: unit.id,
          status: APLSTATUS.SERVICE,
        });
        setHistoryList(data || []);
      } catch (err) {
        console.error("Gagal memuat riwayat servis:", err);
        toast.error("Gagal memuat riwayat servis");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceHistory();
  }, [isOpen, unit?.id]);

  if (!isOpen) return null;

  // Helper to get component name by apl_id
  const getComponentName = (aplId: string) => {
    if (!unit?.aplData || !Array.isArray(unit.aplData)) return "Komponen Servis";
    const found = unit.aplData.find(
      (item: any) => item.id === aplId || item.category_apl_id === aplId
    );
    return found?.name || "Komponen Servis";
  };

  return (
    <>
      {/* Drawer Overlay (Tanpa Backdrop Blur) */}
      <div
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div
        className={`fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-white/10 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ willChange: "transform", contain: "strict" }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <FaHistory size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Riwayat Servis Unit
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Unit: <strong className="text-slate-800 dark:text-slate-200">{unit?.code || unit?.unit_name || unit?.name}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-500 cursor-pointer"
            >
              <FaTimes />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/20">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-48 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                <p className="text-xs text-slate-400">Memuat riwayat servis...</p>
              </div>
            ) : historyList.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <FaHistory size={26} />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Riwayat Servis</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Riwayat akan tercatat secara otomatis saat tindakan servis selesai dikonfirmasi.
                </p>
              </div>
            ) : (
              <div className="relative space-y-6 pt-2 pb-8">
                {historyList.map((history, idx) => {
                  let validImages: string[] = [];
                  try {
                    if (Array.isArray(history.images)) {
                      validImages = history.images.filter(
                        (img: any) =>
                          typeof img === "string" &&
                          img.trim() !== "" &&
                          img !== "null" &&
                          img !== "undefined" &&
                          !img.includes("undefined") &&
                          !img.includes("null")
                      );
                    }
                  } catch (e) {}

                  const compName = getComponentName(history.apl_id);
                  const serviceDateTime = history.last_time || history.created_at;

                  return (
                    <div key={idx} className="relative flex gap-4">
                      {/* Stepper Column */}
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 z-10 relative shadow-sm ring-4 ring-slate-50/50 dark:ring-slate-900/50">
                          <FaCheckCircle size={15} />
                        </div>
                        {idx !== historyList.length - 1 && (
                          <div className="w-0.5 bg-slate-200 dark:bg-slate-700 flex-1 my-2 rounded-full"></div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="flex-1 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm transition hover:shadow-md mb-2">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                                {history.status || "SERVICE"}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1.5">
                              <FaWrench size={12} className="text-emerald-500" />
                              <span>{compName}</span>
                            </h4>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 justify-end">
                              <FaCalendarAlt size={10} className="text-slate-400" />
                              {serviceDateTime
                                ? new Date(serviceDateTime).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "-"}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 justify-end">
                              <FaClock size={9} />
                              {serviceDateTime
                                ? new Date(serviceDateTime).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </p>
                          </div>
                        </div>

                        {/* Stat Cards 3 Kolom */}
                        <div className="grid grid-cols-3 gap-2 my-3">
                          <div className="bg-sky-50 dark:bg-sky-500/10 p-2.5 rounded-xl border border-sky-100 dark:border-sky-500/20 text-center">
                            <p className="text-[9px] text-sky-600 dark:text-sky-400 uppercase font-bold tracking-wider mb-0.5 truncate">
                              Manual Baru
                            </p>
                            <p className="text-base font-black text-sky-700 dark:text-sky-300">
                              {history.last_total ?? history.input_total ?? "-"}
                            </p>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center">
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5 truncate">
                              HM Servis
                            </p>
                            <p className="text-base font-black text-slate-700 dark:text-slate-200">
                              {history.last_hm ?? "-"}
                            </p>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-center">
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-0.5 truncate">
                              Sisa Jam
                            </p>
                            <p className="text-base font-black text-slate-700 dark:text-slate-200">
                              {history.remaining_hours ?? "-"}
                            </p>
                          </div>
                        </div>

                        {/* Foto Bukti Grid */}
                        {validImages.length > 0 && (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
                            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                              Foto Bukti Servis ({validImages.length})
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                              {validImages.map((img: string, imgIdx: number) => (
                                <div
                                  key={imgIdx}
                                  onClick={() => setPreviewImageUrl(img)}
                                  className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer group relative shadow-2xs"
                                >
                                  <img
                                    src={img}
                                    alt={`Bukti Servis ${imgIdx + 1}`}
                                    className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition duration-300 flex items-center justify-center">
                                    <FaSearchPlus
                                      className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md"
                                      size={14}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
