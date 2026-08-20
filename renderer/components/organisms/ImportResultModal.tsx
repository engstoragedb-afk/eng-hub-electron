import { FaTimes, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

interface ImportResultModalProps {
  importResult: {
    notUpdated: Array<{
      codeUnit?: string;
      sheet?: string;
      reason: string;
    }>;
  };
  onClose: () => void;
}

export default function ImportResultModal({ importResult, onClose }: ImportResultModalProps) {
  if (!importResult) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${importResult.notUpdated.length === 0
              ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500'
              : 'bg-amber-100 dark:bg-amber-500/10 text-amber-500'
              }`}>
              {importResult.notUpdated.length === 0 ? <FaCheckCircle size={18} /> : <FaExclamationTriangle size={18} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hasil Import Excel</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {importResult.notUpdated.length === 0
                  ? 'Semua unit berhasil diperbarui!'
                  : `${importResult.notUpdated.length} unit tidak dapat diperbarui`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {importResult.notUpdated.length > 0 && (
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs font-semibold uppercase text-slate-400 mb-3">Unit yang tidak berhasil diperbarui:</p>
            <div className="flex flex-col gap-2">
              {importResult.notUpdated.map((item, i) => (
                <div key={i} className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3">
                  {item.codeUnit ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{item.codeUnit}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{item.sheet}</span>
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">{item.reason}</p>
                    </>
                  ) : (
                    <p className="text-sm text-rose-600 dark:text-rose-400">{item.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-200 dark:border-white/10">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
