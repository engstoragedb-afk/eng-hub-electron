import { useState, useEffect } from "react";
import { FaTimes, FaHistory, FaCheckCircle, FaClock, FaSearchPlus } from "react-icons/fa";
import { aplHistoryService } from "@/services";
import toast from "react-hot-toast";

type HistoryReplacementDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  historyAplItem: any;
  setPreviewImageUrl: (url: string) => void;
};

export default function HistoryReplacementDrawer({ isOpen, onClose, historyAplItem, setPreviewImageUrl }: HistoryReplacementDrawerProps) {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        if (historyAplItem?.id) {
           const data = await aplHistoryService.findAllNoPaginate({ apl_id: historyAplItem.id });
           setHistoryData(data || []);
        } else {
           setHistoryData([]);
        }
      } catch (err) {
        toast.error("Gagal memuat riwayat");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, historyAplItem?.id]);

  return (
    <>
      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60]"
          onClick={onClose}
        />
      )}

      {/* Drawer History */}
      <div 
        className={`fixed inset-y-0 right-0 z-[70] w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-white/10 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ willChange: 'transform', contain: 'strict' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Riwayat Penggantian</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{historyAplItem?.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-500"
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/20">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
              </div>
            ) : historyData.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <FaHistory className="text-slate-400 text-2xl" />
                </div>
                <p className="text-slate-500 font-medium">Belum ada riwayat penggantian</p>
                {!historyAplItem?.id && <p className="text-xs text-rose-500 mt-2">Data ini belum tersinkronisasi penuh (ID tidak ditemukan)</p>}
              </div>
            ) : (
              <div className="relative space-y-6 pt-2 pb-8">
                {historyData.map((history, idx) => {
                  let validImages: string[] = [];
                  try {
                    if (Array.isArray(history.images)) {
                      validImages = history.images.filter((img: any) => 
                        typeof img === 'string' && 
                        img.trim() !== '' && 
                        img !== 'null' && 
                        img !== 'undefined' &&
                        !img.includes('undefined') &&
                        !img.includes('null')
                      );
                    }
                  } catch (e) {}
                  
                  return (
                  <div key={idx} className="relative flex gap-4">
                    {/* Stepper Column */}
                    <div className="flex flex-col items-center">
                       <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-500 flex items-center justify-center shrink-0 z-10 relative shadow-sm ring-4 ring-slate-50/50 dark:ring-slate-900/50">
                          <FaCheckCircle size={16} />
                       </div>
                       {idx !== historyData.length - 1 && (
                          <div className="w-0.5 bg-slate-200 dark:bg-slate-700 flex-1 my-2 rounded-full"></div>
                       )}
                    </div>
                    
                    {/* Card Content */}
                    <div className="flex-1 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm transition hover:shadow-md mb-2">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {new Date(history.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium flex items-center gap-1.5">
                            <FaClock size={10} />
                            {new Date(history.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2.5 mb-4">
                        <div className="bg-sky-50 dark:bg-sky-500/10 p-3 rounded-xl border border-sky-100 dark:border-sky-500/20">
                          <p className="text-[10px] text-sky-600 dark:text-sky-400 uppercase font-bold tracking-wider mb-1">Input Manual</p>
                          <p className="text-xl font-extrabold text-sky-700 dark:text-sky-300">
                            {history.input_total}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Sisa Jam</p>
                            <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">
                              {history.remaining_hours}
                            </p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">HM Terakhir</p>
                            <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">{history.last_hm}</p>
                          </div>
                        </div>
                      </div>

                      {validImages.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Foto Bukti</p>
                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                            {validImages.map((img: string, imgIdx: number) => (
                              <div 
                                key={imgIdx} 
                                onClick={() => setPreviewImageUrl(img)}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer group relative"
                              >
                                <img src={img} alt="Bukti" className="w-full h-full object-cover transition duration-300 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition duration-300 flex items-center justify-center">
                                  <FaSearchPlus className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" size={12} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
