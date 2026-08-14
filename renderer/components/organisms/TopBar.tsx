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
    
    if (updateStatus === "available") {
      window.ipc.invoke("download-update");
      setUpdateStatus("downloading");
    } else if (updateStatus === "downloaded") {
      window.ipc.invoke("install-update");
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-end gap-5 bg-slate-50/80 dark:bg-slate-950/80 px-8 py-4 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shadow-sm">
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
      
      {updateStatus !== "none" && updateStatus !== "checking" && updateStatus !== "up-to-date" && updateStatus !== "error" && (
        <button 
          onClick={handleUpdateClick}
          disabled={updateStatus === "downloading"}
          className={`relative flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition border shadow-sm ${
            updateStatus === "downloaded" 
              ? "bg-sky-500 text-white hover:bg-sky-600 border-sky-600" 
              : updateStatus === "available"
              ? "bg-amber-500 text-white hover:bg-amber-600 border-amber-600 shadow-amber-500/20"
              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 cursor-wait"
          }`}
          title={
            updateStatus === "downloaded" ? "Install Update & Restart" : 
            updateStatus === "available" ? "Download Update" : 
            "Downloading Update..."
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
          ) : (
            <>
              <FaDownload className="mr-2 text-xs animate-bounce" />
              Downloading {updateProgress}%
            </>
          )}
        </button>
      )}
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
