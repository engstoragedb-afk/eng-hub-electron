import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Badge from "@/components/atoms/Badge";
import { ACTIONS } from "@/common/utils/action";
import { auditLogService } from "@/services";

type GpsLogDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  unitId?: string;
};

export default function GpsLogDrawer({ isOpen, onClose, unitId }: GpsLogDrawerProps) {
  const [activeTab, setActiveTab] = useState<'HM' | 'ERROR'>('HM');
  const [gpsLogs, setGpsLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const limit = 10;

  useEffect(() => {
    if (!isOpen || !unitId) return;

    const action = activeTab === 'HM' ? ACTIONS.CRON_UPDATE_GPS_HM_HOURS : ACTIONS.CRON_FETCH_GPS_ERROR;
    
    setIsFetching(true);
    auditLogService.getAllLogs({
      action,
      search: unitId,
      page: page,
      limit: limit
    })
      .then(res => {
        setGpsLogs(res.data || []);
        setTotal(res.totalRow || 0);
      })
      .catch(console.error)
      .finally(() => setIsFetching(false));
  }, [isOpen, activeTab, page, unitId]);

  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />
      <div 
        className={`absolute inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">HISTORY GPS</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition">
            <FaTimes />
          </button>
        </div>
        <div className="flex px-6 pt-4 gap-4 border-b border-slate-200 dark:border-white/10">
          <button
            onClick={() => { setActiveTab('HM'); setPage(1); }}
            className={`pb-3 text-sm font-semibold transition border-b-2 ${activeTab === 'HM' ? 'border-sky-500 text-sky-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Update HM / Jam
          </button>
          <button
            onClick={() => { setActiveTab('ERROR'); setPage(1); }}
            className={`pb-3 text-sm font-semibold transition border-b-2 ${activeTab === 'ERROR' ? 'border-sky-500 text-sky-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Error GPS
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isFetching ? (
            <div className="flex justify-center items-center h-32">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500 dark:border-white/10 dark:border-t-sky-500" />
            </div>
          ) : gpsLogs.length === 0 ? (
            <div className="text-center text-slate-500 py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              Tidak ada log ditemukan.
            </div>
          ) : (
            <>
            {gpsLogs.map(log => {
              let parsedOld = {};
              let parsedNew = {};
              try {
                if (log.old_data) parsedOld = JSON.parse(log.old_data);
                if (log.new_data) parsedNew = JSON.parse(log.new_data);
              } catch (e) {}
              
              const logDate = new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
              
              return (
                <div key={log.id} className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-slate-400">{logDate}</span>
                    <Badge tone="neutral">{log.user_agent || "Sistem"}</Badge>
                  </div>
                  {activeTab === 'HM' ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">HM:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{(parsedOld as any).hm?.toFixed(2)} → <span className="text-emerald-500">{(parsedNew as any).hm?.toFixed(2)}</span></span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Jam:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{(parsedOld as any).hours?.toFixed(2)} → <span className="text-emerald-500">{(parsedNew as any).hours?.toFixed(2)}</span></span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <p className="font-medium text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-3 rounded-xl border border-rose-100 dark:border-rose-500/20">
                        {(parsedNew as any).error || "Error tidak diketahui"}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            </>
          )}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 disabled:opacity-50 transition hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Sebelumnya
          </button>
          <span className="text-xs font-medium text-slate-500">
            Hal {page} dari {Math.max(1, Math.ceil(total / limit))}
          </span>
          <button 
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 disabled:opacity-50 transition hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
