import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
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
  const [isFetching, setIsFetching] = useState(false);
  const datesPerPage = 10;

  useEffect(() => {
    if (!isOpen || !unitId) return;

    const action = activeTab === 'HM' ? ACTIONS.CRON_UPDATE_GPS_HM_HOURS : ACTIONS.CRON_FETCH_GPS_ERROR;

    setIsFetching(true);
    // Fetch logs with sufficient limit to capture history across multiple previous dates
    auditLogService.getAllLogs({
      action,
      unit: unitId,
      page: 1,
      limit: 1000
    })
      .then(res => {
        setGpsLogs(res.data || []);
      })
      .catch(console.error)
      .finally(() => setIsFetching(false));
  }, [isOpen, activeTab, unitId]);

  // Group logs by date
  const groupedLogs = gpsLogs.reduce((acc, log) => {
    let parsedOld: any = {};
    let parsedNew: any = {};
    try {
      if (log.old_data) parsedOld = JSON.parse(log.old_data);
      if (log.new_data) parsedNew = JSON.parse(log.new_data);
    } catch (e) { }

    const dateObj = new Date(log.created_at);
    const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    if (!acc[dateStr]) {
      acc[dateStr] = {
        date: dateStr,
        timestamp: dateObj.getTime(),
        totalHoursAdded: 0,
        logs: []
      };
    }

    const hoursAdded = (parsedNew.hours || 0) - (parsedOld.hours || 0);
    if (hoursAdded > 0) acc[dateStr].totalHoursAdded += hoursAdded;

    acc[dateStr].logs.push({
      ...log,
      timeStr,
      parsedOld,
      parsedNew
    });

    return acc;
  }, {} as Record<string, any>);

  // Sort descending by date
  const groupedLogsArray: any[] = Object.values(groupedLogs).sort((a: any, b: any) => b.timestamp - a.timestamp);

  const totalPages = Math.max(1, Math.ceil(groupedLogsArray.length / datesPerPage));
  const paginatedGroups = groupedLogsArray.slice((page - 1) * datesPerPage, page * datesPerPage);

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
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer">
            <FaTimes />
          </button>
        </div>

        <div className="flex px-6 pt-4 gap-4 border-b border-slate-200 dark:border-white/10">
          <button
            onClick={() => { setActiveTab('HM'); setPage(1); }}
            className={`pb-3 text-sm font-semibold transition border-b-2 cursor-pointer ${activeTab === 'HM' ? 'border-sky-500 text-sky-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Update HM / Jam
          </button>
          <button
            onClick={() => { setActiveTab('ERROR'); setPage(1); }}
            className={`pb-3 text-sm font-semibold transition border-b-2 cursor-pointer ${activeTab === 'ERROR' ? 'border-sky-500 text-sky-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Error GPS
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isFetching ? (
            <div className="flex justify-center items-center h-32">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500 dark:border-white/10 dark:border-t-sky-500" />
            </div>
          ) : groupedLogsArray.length === 0 ? (
            <div className="text-center text-slate-500 py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              Tidak ada log ditemukan.
            </div>
          ) : activeTab === 'HM' ? (
            /* TAB UPDATE HM / JAM: Direct date rows only without child cards */
            <div className="space-y-3">
              {paginatedGroups.map((group: any) => (
                <div
                  key={group.date}
                  className="flex justify-between items-center py-3.5 px-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-2xs hover:shadow-xs transition"
                >
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                    {group.date}
                  </h4>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-wide">
                    + {group.totalHoursAdded.toFixed(2)} JAM
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* TAB ERROR GPS: Detailed error cards preserved */
            <div className="space-y-6">
              {paginatedGroups.map((group: any) => (
                <div key={group.date} className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{group.date}</h4>
                    <span className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-2.5 py-0.5 rounded-full">
                      {group.logs.length} Error
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {group.logs.map((log: any) => (
                      <div key={log.id} className="p-3.5 rounded-2xl border border-rose-100 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-500/5 shadow-2xs">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{log.timeStr}</span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-white/5">
                            {log.user_agent || "Sistem"}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          {log.parsedNew.error || "Error tidak diketahui"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {groupedLogsArray.length > datesPerPage && (
          <div className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 disabled:opacity-50 transition hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              Sebelumnya
            </button>
            <span className="text-xs font-medium text-slate-500">
              Hal {page} dari {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 disabled:opacity-50 transition hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
