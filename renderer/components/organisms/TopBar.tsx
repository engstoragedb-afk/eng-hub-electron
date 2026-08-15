import { FaExpand, FaSun, FaMoon, FaDownload, FaSync } from "react-icons/fa";
import { useUIStore } from "@/store/uiStore";
// import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function TopBar() {
  const { setFullscreen } = useUIStore();
  // const router = useRouter();
  // const basePath = router.pathname.startsWith("/admin") ? "/admin" : "/maintenance";
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"none" | "checking" | "available" | "downloading" | "downloaded" | "error" | "up-to-date">("none");
  const [updateProgress, setUpdateProgress] = useState(0);

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
    if (updateStatus === "up-to-date" || updateStatus === "error") {
      const timer = setTimeout(() => {
        setUpdateStatus("none");
      }, 3000);
      return () => clearTimeout(timer);
    }
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
      {/* <button className="h-10 w-10 overflow-hidden rounded-full border-2 border-sky-500/50 transition hover:border-sky-400 cursor-pointer">
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=0284c7"
          alt="Profile Avatar"
          className="h-full w-full object-cover"
        />
      </button> */}
    </header>
  );
}
