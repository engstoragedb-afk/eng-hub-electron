import { FaBell, FaExpand, FaSun, FaMoon, FaDownload, FaSync } from "react-icons/fa";
import { useUIStore } from "@/store/uiStore";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function TopBar() {
  const { setFullscreen } = useUIStore();
  const router = useRouter();
  const basePath = router.pathname.startsWith("/admin") ? "/admin" : "/maintenance";
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"checking" | "available" | "downloaded" | "none">("none");

  useEffect(() => {
    setMounted(true);
    
    let removeAvailableListener: (() => void) | undefined;
    let removeDownloadedListener: (() => void) | undefined;

    if (typeof window !== "undefined" && window.ipc) {
      removeAvailableListener = window.ipc.on("update-available", () => {
        setUpdateStatus("available");
      });
      removeDownloadedListener = window.ipc.on("update-downloaded", () => {
        setUpdateStatus("downloaded");
      });
    }
    
    return () => {
      if (removeAvailableListener) removeAvailableListener();
      if (removeDownloadedListener) removeDownloadedListener();
    };
  }, []);

  const handleUpdateClick = () => {
    if (updateStatus === "downloaded" && typeof window !== "undefined" && window.ipc) {
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
      {/* <Link href={`${basePath}/notification`} className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:bg-slate-700 hover:text-sky-500 border border-slate-200 dark:border-white/5 shadow-sm">
        <FaBell className="text-base" />
        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
      </Link> */}
      
      {updateStatus !== "none" && (
        <button 
          onClick={handleUpdateClick}
          disabled={updateStatus === "available"}
          className={`relative flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition border shadow-sm ${
            updateStatus === "downloaded" 
              ? "bg-sky-500 text-white hover:bg-sky-600 border-sky-600" 
              : "bg-amber-500/10 text-amber-500 border-amber-500/30 cursor-wait"
          }`}
          title={updateStatus === "downloaded" ? "Install Update & Restart" : "Downloading Update..."}
        >
          {updateStatus === "downloaded" ? (
            <>
              <FaSync className="mr-2 text-xs" />
              Restart to Update
            </>
          ) : (
            <>
              <FaDownload className="mr-2 text-xs animate-bounce" />
              Downloading...
            </>
          )}
        </button>
      )}
      <button className="h-10 w-10 overflow-hidden rounded-full border-2 border-sky-500/50 transition hover:border-sky-400 cursor-pointer">
        <img
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=0284c7"
          alt="Profile Avatar"
          className="h-full w-full object-cover"
        />
      </button>
    </header>
  );
}
