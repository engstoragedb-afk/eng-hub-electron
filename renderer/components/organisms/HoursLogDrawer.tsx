import { useState, useEffect, useMemo } from "react";
import { FaTimes, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaUndo } from "react-icons/fa";
import { ACTIONS } from "@/common/utils/action";
import { auditLogService } from "@/services";

type HoursLogDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  unitId?: string;
  unitCode?: string;
};

type FilterType = "ALL" | "7_DAYS" | "1_MONTH" | "CUSTOM";

export default function HoursLogDrawer({ isOpen, onClose, unitId, unitCode }: HoursLogDrawerProps) {
  const [hoursLogs, setHoursLogs] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [showCalendar, setShowCalendar] = useState(false);

  // Custom Calendar Range States
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const datesPerPage = 10;

  useEffect(() => {
    if (!isOpen || !unitId) return;

    setIsFetching(true);
    setPage(1);

    auditLogService.getAllLogs({
      action: ACTIONS.UPDATE_HOURS_UNIT,
      unit: unitId,
      page: 1,
      limit: 1000
    })
      .then(res => {
        setHoursLogs(res.data || []);
      })
      .catch(console.error)
      .finally(() => setIsFetching(false));
  }, [isOpen, unitId]);

  // Global mouseup to stop drag selection
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (startDate && hoverDate) {
          if (hoverDate < startDate) {
            setStartDate(hoverDate);
            setEndDate(startDate);
          } else {
            setEndDate(hoverDate);
          }
        }
      }
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [isDragging, startDate, hoverDate]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    return hoursLogs.reduce((acc, log) => {
      let parsedOld: any = {};
      let parsedNew: any = {};
      try {
        if (log.old_data) parsedOld = JSON.parse(log.old_data);
        if (log.new_data) parsedNew = JSON.parse(log.new_data);
      } catch (e) {}

      const dateObj = new Date(log.created_at);
      const dateStr = dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const timeStr = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          dateObj: new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()),
          timestamp: dateObj.getTime(),
          totalHoursAdded: 0,
          logs: []
        };
      }

      const oldH = Number(parsedOld.hours ?? parsedOld.hm ?? 0);
      const newH = Number(parsedNew.hours ?? parsedNew.hm ?? 0);
      const delta = newH - oldH;

      if (delta > 0) {
        acc[dateStr].totalHoursAdded += delta;
      }

      acc[dateStr].logs.push({
        ...log,
        timeStr,
        parsedOld,
        parsedNew,
        delta
      });

      return acc;
    }, {} as Record<string, any>);
  }, [hoursLogs]);

  // Filter grouped logs
  const filteredGroupedLogs = useMemo(() => {
    const allGroups: any[] = Object.values(groupedLogs);
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    let filtered = allGroups;

    if (filterType === "7_DAYS") {
      const sevenDaysAgo = todayMidnight - 7 * 24 * 60 * 60 * 1000;
      filtered = allGroups.filter(g => g.dateObj.getTime() >= sevenDaysAgo && g.dateObj.getTime() <= todayMidnight + 86400000);
    } else if (filterType === "1_MONTH") {
      const oneMonthAgo = todayMidnight - 30 * 24 * 60 * 60 * 1000;
      filtered = allGroups.filter(g => g.dateObj.getTime() >= oneMonthAgo && g.dateObj.getTime() <= todayMidnight + 86400000);
    } else if (filterType === "CUSTOM") {
      if (startDate && endDate) {
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
        const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
        const minT = Math.min(start, end);
        const maxT = Math.max(start, end);
        filtered = allGroups.filter(g => g.dateObj.getTime() >= minT && g.dateObj.getTime() <= maxT);
      } else if (startDate) {
        const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
        filtered = allGroups.filter(g => g.dateObj.getTime() === start);
      }
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [groupedLogs, filterType, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredGroupedLogs.length / datesPerPage));
  const paginatedGroups = filteredGroupedLogs.slice((page - 1) * datesPerPage, page * datesPerPage);

  // Calendar calculations
  const calYear = currentCalendarDate.getFullYear();
  const calMonth = currentCalendarDate.getMonth();

  const calendarDays = useMemo(() => {
    const days = [];
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prevMonthDays = new Date(calYear, calMonth, 0).getDate();

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(calYear, calMonth - 1, prevMonthDays - i);
      days.push({ date: d, dayNum: prevMonthDays - i, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(calYear, calMonth, i);
      days.push({ date: d, dayNum: i, isCurrentMonth: true });
    }

    // Next month trailing days to complete 35 or 42 cells
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(calYear, calMonth + 1, i);
      days.push({ date: d, dayNum: i, isCurrentMonth: false });
    }

    return days;
  }, [calYear, calMonth]);

  // Calendar Day Selection Handlers (Click and Drag)
  const handleDayMouseDown = (dayDate: Date) => {
    setStartDate(dayDate);
    setEndDate(null);
    setHoverDate(dayDate);
    setIsDragging(true);
    setFilterType("CUSTOM");
    setPage(1);
  };

  const handleDayMouseEnter = (dayDate: Date) => {
    if (isDragging) {
      setHoverDate(dayDate);
    }
  };

  const handleDayClick = (dayDate: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(dayDate);
      setEndDate(null);
      setHoverDate(dayDate);
    } else if (startDate && !endDate) {
      if (dayDate < startDate) {
        setEndDate(startDate);
        setStartDate(dayDate);
      } else {
        setEndDate(dayDate);
      }
    }
    setFilterType("CUSTOM");
    setPage(1);
  };

  const isDateSelected = (dayDate: Date) => {
    const t = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()).getTime();

    let start = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime() : null;
    let end = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime() : null;

    if (isDragging && startDate && hoverDate) {
      const hoverT = new Date(hoverDate.getFullYear(), hoverDate.getMonth(), hoverDate.getDate()).getTime();
      const minT = Math.min(start!, hoverT);
      const maxT = Math.max(start!, hoverT);
      return {
        isStart: t === minT,
        isEnd: t === maxT,
        isInRange: t >= minT && t <= maxT
      };
    }

    if (start && end) {
      const minT = Math.min(start, end);
      const maxT = Math.max(start, end);
      return {
        isStart: t === minT,
        isEnd: t === maxT,
        isInRange: t >= minT && t <= maxT
      };
    }

    if (start && !end) {
      return {
        isStart: t === start,
        isEnd: t === start,
        isInRange: t === start
      };
    }

    return { isStart: false, isEnd: false, isInRange: false };
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div 
        className={`absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">HISTORY HOURS</h3>
            {unitCode && (
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Unit: <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">{unitCode}</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer">
            <FaTimes size={16} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-200 dark:border-white/10 shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 border border-slate-300/60 dark:border-white/5">
            <button
              onClick={() => { setFilterType("ALL"); setShowCalendar(false); setPage(1); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                filterType === "ALL" 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => { setFilterType("7_DAYS"); setShowCalendar(false); setPage(1); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                filterType === "7_DAYS" 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => { setFilterType("1_MONTH"); setShowCalendar(false); setPage(1); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                filterType === "1_MONTH" 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              1 Bulan
            </button>
            <button
              onClick={() => { 
                setFilterType("CUSTOM"); 
                setShowCalendar(prev => !prev);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                filterType === "CUSTOM" 
                  ? "bg-sky-500 text-white shadow-xs shadow-sky-500/25" 
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <FaCalendarAlt size={11} />
              Custom
            </button>
          </div>

          {/* Range Selection Label */}
          {filterType === "CUSTOM" && (startDate || endDate) && (
            <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>
                Rentang: <strong className="text-sky-600 dark:text-sky-400">
                  {startDate?.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                  {endDate && ` - ${endDate?.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
                </strong>
              </span>
              <button
                onClick={() => { setStartDate(null); setEndDate(null); setHoverDate(null); }}
                className="text-[10px] text-rose-500 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <FaUndo size={9} /> Reset
              </button>
            </div>
          )}
        </div>

        {/* Interactive Drag & Select Calendar (Appears when Custom is active) */}
        {showCalendar && (
          <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shrink-0 select-none animate-in fade-in duration-200">
            {/* Calendar Header Navigation */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                {monthNames[calMonth]} {calYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentCalendarDate(new Date(calYear, calMonth - 1, 1))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                >
                  <FaChevronLeft size={10} />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentCalendarDate(new Date(calYear, calMonth + 1, 1))}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                >
                  <FaChevronRight size={10} />
                </button>
              </div>
            </div>

            {/* Calendar Day Labels */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d, i) => (
                <div key={i} className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {calendarDays.map((item, idx) => {
                const { isStart, isEnd, isInRange } = isDateSelected(item.date);

                let cellBg = "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300";
                let roundedClass = "rounded-xl";

                if (isStart && isEnd) {
                  cellBg = "bg-sky-500 text-white font-black shadow-xs";
                  roundedClass = "rounded-xl";
                } else if (isStart) {
                  cellBg = "bg-sky-500 text-white font-black";
                  roundedClass = "rounded-l-xl";
                } else if (isEnd) {
                  cellBg = "bg-sky-500 text-white font-black";
                  roundedClass = "rounded-r-xl";
                } else if (isInRange) {
                  cellBg = "bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 font-bold";
                  roundedClass = "rounded-none";
                } else if (!item.isCurrentMonth) {
                  cellBg = "text-slate-300 dark:text-slate-600 opacity-50";
                }

                return (
                  <div
                    key={idx}
                    onMouseDown={() => handleDayMouseDown(item.date)}
                    onMouseEnter={() => handleDayMouseEnter(item.date)}
                    onClick={() => handleDayClick(item.date)}
                    className={`h-7 flex items-center justify-center text-xs transition-colors cursor-pointer select-none ${cellBg} ${roundedClass}`}
                  >
                    {item.dayNum}
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] text-center text-slate-400 dark:text-slate-500">
              💡 Klik atau tahan & tarik mouse untuk memilih rentang tanggal
            </p>
          </div>
        )}

        {/* Content List: Date Rows */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isFetching ? (
            <div className="flex justify-center items-center h-32">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500 dark:border-white/10 dark:border-t-sky-500" />
            </div>
          ) : paginatedGroups.length === 0 ? (
            <div className="text-center text-slate-400 dark:text-slate-500 py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-xs font-semibold">
              Tidak ada history hours pada rentang waktu ini.
            </div>
          ) : (
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
          )}
        </div>

        {/* Drawer Pagination Footer */}
        {filteredGroupedLogs.length > datesPerPage && (
          <div className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 shrink-0">
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
