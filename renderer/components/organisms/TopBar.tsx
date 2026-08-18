import { FaExpand, FaSun, FaMoon, FaDownload, FaSync, FaQuestionCircle, FaTimes, FaKeyboard } from "react-icons/fa";
import { useUIStore } from "@/store/uiStore";
// import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function TopBar() {
  const { setFullscreen } = useUIStore();
  // const router = useRouter();
  // const basePath = router.pathname.startsWith("/admin") ? "/admin" : "/maintenance";
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"none" | "checking" | "available" | "downloading" | "downloaded" | "error" | "up-to-date">("none");
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Scroll lock when modal is open
  useEffect(() => {
    if (isShortcutsOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflowY = 'scroll';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflowY = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflowY = '';
    };
  }, [isShortcutsOpen]);

  useEffect(() => {
    setMounted(true);
    
    let removeStatusListener: (() => void) | undefined;

    if (typeof window !== "undefined" && window.ipc) {
      removeStatusListener = window.ipc.on("update-status", (data: any) => {
        if (data.status) setUpdateStatus(data.status);
        if (data.percent !== undefined) setUpdateProgress(data.percent);
      });
      
      // Optionally ping for status or trigger a check
      // window.ipc.invoke("check-for-updates");
    }
    
    return () => {
      if (removeStatusListener) removeStatusListener();
    };
  }, []);

  const handleUpdateClick = () => {
    if (typeof window === "undefined" || !window.ipc) return;
    
    if (updateStatus === "none" || updateStatus === "error") {
      window.ipc.invoke("check-for-updates");
      setUpdateStatus("checking");
    } else if (updateStatus === "available") {
      window.ipc.invoke("download-update");
      setUpdateStatus("downloading");
    } else if (updateStatus === "downloaded") {
      window.ipc.invoke("install-update");
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (updateStatus === "up-to-date" || updateStatus === "error") {
      timer = setTimeout(() => {
        setUpdateStatus("none");
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [updateStatus]);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-end gap-5 bg-slate-50/80 dark:bg-slate-950/80 px-8 py-4 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shadow-sm">
      <button 
        onClick={handleUpdateClick}
        disabled={updateStatus === "checking" || updateStatus === "downloading" || updateStatus === "up-to-date"}
        className={`relative flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition border shadow-sm ${
          updateStatus === "downloaded" 
            ? "bg-sky-500 text-white hover:bg-sky-600 border-sky-600" 
            : updateStatus === "available"
            ? "bg-amber-500 text-white hover:bg-amber-600 border-amber-600 shadow-amber-500/20"
            : updateStatus === "checking" || updateStatus === "downloading"
            ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 cursor-wait"
            : updateStatus === "up-to-date"
            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-white/5"
        }`}
        title={
          updateStatus === "downloaded" ? "Install Update & Restart" : 
          updateStatus === "available" ? "Download Update" : 
          updateStatus === "checking" ? "Checking for updates..." :
          updateStatus === "downloading" ? "Downloading Update..." :
          updateStatus === "up-to-date" ? "App is up to date" :
          "Check for Updates"
        }
      >
        {updateStatus === "downloaded" ? (
          <>
            <FaSync className="mr-2 text-xs" />
            Restart to Update
          </>
        ) : updateStatus === "available" ? (
          <>
            <FaDownload className="mr-2 text-xs" />
            Update Available
          </>
        ) : updateStatus === "checking" ? (
          <>
            <FaSync className="mr-2 text-xs animate-spin" />
            Checking...
          </>
        ) : updateStatus === "downloading" ? (
          <>
            <FaDownload className="mr-2 text-xs animate-bounce" />
            Downloading {updateProgress}%
          </>
        ) : updateStatus === "up-to-date" ? (
          <>
            <FaSync className="mr-2 text-xs" />
            Up to Date
          </>
        ) : (
          <>
            <FaSync className="mr-2 text-xs" />
            Check Update
          </>
        )}
      </button>

      <button 
        onClick={() => setFullscreen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:bg-slate-700 hover:text-sky-500 border border-slate-200 dark:border-white/5 shadow-sm"
        title="Perbesar Tampilan (Tekan ESC untuk kembali)"
      >
        <FaExpand className="text-sm" />
      </button>
      <button 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:bg-slate-700 hover:text-amber-500 border border-slate-200 dark:border-white/5 shadow-sm"
        title="Ganti Tema (Gelap/Terang)"
      >
        {mounted && (theme === 'dark' ? <FaSun className="text-sm" /> : <FaMoon className="text-sm" />)}
      </button>

      <button 
        onClick={() => setIsShortcutsOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:bg-slate-700 hover:text-sky-500 border border-slate-200 dark:border-white/5 shadow-sm"
        title="Panduan Keyboard Shortcut"
      >
        <FaQuestionCircle className="text-sm" />
      </button>

      {/* Keyboard Shortcuts Modal */}
      {isShortcutsOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-500 flex items-center justify-center">
                  <FaKeyboard size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Panduan Keyboard Shortcut</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Jalan pintas untuk mempermudah navigasi aplikasi</p>
                </div>
              </div>
              <button 
                onClick={() => setIsShortcutsOpen(false)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-500"
              >
                <FaTimes size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Global / Semua Halaman</h4>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                  <div className="font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-center font-bold text-slate-700 dark:text-slate-300 justify-self-end">ESC</div>
                  <div className="text-slate-600 dark:text-slate-300 flex items-center">Keluar dari layar penuh atau keluar dari aplikasi.</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Halaman Servis Unit</h4>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                  <div className="font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-center font-bold text-slate-700 dark:text-slate-300 justify-self-end">CTRL/CMD + F</div>
                  <div className="text-slate-600 dark:text-slate-300 flex items-center">Membuka fitur pencarian tabel (mengambang).</div>
                  <div className="font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-center font-bold text-slate-700 dark:text-slate-300 justify-self-end">ESC</div>
                  <div className="text-slate-600 dark:text-slate-300 flex items-center">Menutup fitur pencarian tabel.</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Halaman Unit Kategori & Operator</h4>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                  <div className="font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-center font-bold text-slate-700 dark:text-slate-300 justify-self-end">← / →</div>
                  <div className="text-slate-600 dark:text-slate-300 flex items-center">Pindah ke halaman (pagination) sebelumnya / selanjutnya.</div>
                  <div className="font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-center font-bold text-slate-700 dark:text-slate-300 justify-self-end">↑ / ↓</div>
                  <div className="text-slate-600 dark:text-slate-300 flex items-center">Pindah ke tab kategori unit sebelumnya / selanjutnya.</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Halaman Detail Unit</h4>
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                  <div className="font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-center font-bold text-slate-700 dark:text-slate-300 justify-self-end">Q</div>
                  <div className="text-slate-600 dark:text-slate-300 flex items-center">Batal mengedit nilai (lepas fokus kursor) saat mode edit grafik riwayat pemeliharaan.</div>
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
