import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  FaTruck,
  FaTachometerAlt,
  FaSignOutAlt,
  FaUserCog,
  FaChevronLeft,
  FaChevronRight,
  FaTools,
  // FaList,
} from "react-icons/fa";
import { useUIStore } from "@/store/uiStore";
import { useAuth } from "@/components/providers/AuthProvider";

const navGroups = [
  {
    title: "Admin",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        icon: <FaTachometerAlt />,
        activeBase: "/admin/dashboard",
      },
    ],
  },
  {
    title: "Maintenance",
    items: [
      {
        href: "/maintenance/dashboard",
        label: "Dashboard",
        icon: <FaTachometerAlt />,
        activeBase: "/maintenance/dashboard",
      },
      {
        href: "/maintenance/unit",
        label: "Unit",
        icon: <FaTruck />,
        activeBase: "/maintenance/unit",
      },
      {
        href: "/maintenance/operator",
        label: "Operator",
        icon: <FaUserCog />,
        activeBase: "/maintenance/operator",
      },
      {
        href: "/maintenance/servis",
        label: "Servis",
        icon: <FaTools />,
        activeBase: "/maintenance/servis",
      },
      // {
      //   href: "/maintenance/perbaikan",
      //   label: "Breakdown",
      //   icon: <FaList />,
      //   activeBase: "/maintenance/perbaikan",
      // },
    ],
  },
];

type SidebarProps = {
  heading?: string;
};

export default function Sidebar({ heading = "Admin" }: SidebarProps) {
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { logout } = useAuth();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    router.replace("/home");
  };

  const groupsToShow = navGroups.filter((g) => g.title === heading);

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-full flex-col border-r border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/95 backdrop-blur-xl transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none ${
        isSidebarOpen ? "w-[260px]" : "w-20 items-center"
      }`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute -right-3.5 top-12 flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs text-slate-500 shadow-sm hover:text-sky-500 hover:scale-110 transition-all z-50"
      >
        {isSidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      {/* Header / Logo Area */}
      <div className={`p-6 mb-2 flex items-center gap-4 ${!isSidebarOpen && "px-0 justify-center"}`}>
        <div className="flex shrink-0 h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-slate-950 shadow-sm border border-slate-200/60 dark:border-white/5 p-1">
          <Image
            src="/images/icon.png"
            alt="ENG Group"
            width={40}
            height={40}
            className="rounded-lg object-contain h-full w-full"
          />
        </div>
        {isSidebarOpen && (
          <div className="overflow-hidden whitespace-nowrap transition-all duration-300 flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-sky-500 mb-0.5">
              ENG HUB
            </span>
            <h1 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-none">{heading}</h1>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 w-full px-4 space-y-8 overflow-y-auto overflow-x-hidden sidebar-scroll">
        {groupsToShow.map((group) => (
          <div key={group.title} className="w-full">
            {isSidebarOpen && (
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                Menu Utama
              </p>
            )}
            <nav className="space-y-1.5 w-full">
              {group.items.map((item) => {
                const isActive = router.pathname.startsWith(item.activeBase);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    title={!isSidebarOpen ? item.label : undefined}
                    onClick={() => {
                      if (item.href === "/maintenance/operator") {
                        sessionStorage.removeItem("operator_filters");
                      }
                    }}
                    className={`relative flex items-center gap-3 rounded-xl transition-all duration-200 overflow-hidden whitespace-nowrap group ${
                      isActive
                        ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm border border-slate-200/50 dark:border-white/5 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 font-medium border border-transparent"
                    } ${isSidebarOpen ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}`}
                  >
                    {isActive && isSidebarOpen && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-500 rounded-r-full"></div>
                    )}
                    <span className={`text-[1.1rem] shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {item.icon}
                    </span>
                    {isSidebarOpen && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Area */}
      <div className="p-4 w-full mt-auto border-t border-slate-200/80 dark:border-white/5 bg-slate-100/30 dark:bg-slate-900/50">
        
        {isSidebarOpen && (
          <div className="flex items-center gap-3 mb-4 px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 shadow-sm border border-slate-200/50 dark:border-transparent">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-inner shrink-0">
              AD
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none mb-1 truncate">Admin Maintenance</span>
              <span className="text-[10px] text-slate-400 truncate">admin@enghub.com</span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={!isSidebarOpen ? "Keluar" : undefined}
          className={`flex items-center gap-3 rounded-xl transition-colors text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 overflow-hidden whitespace-nowrap font-medium ${
            isSidebarOpen ? "px-3 py-2.5 w-full" : "p-3 justify-center"
          }`}
        >
          <FaSignOutAlt className="text-lg shrink-0" />
          {isSidebarOpen && <span className="text-sm">Keluar Aplikasi</span>}
        </button>

        {isSidebarOpen && (
          <div className="text-center mt-3 text-[9px] text-slate-400 dark:text-slate-600 uppercase tracking-widest font-mono">
            v{process.env.NEXT_PUBLIC_APP_VERSION || "1.1.8"}
          </div>
        )}
      </div>
    </aside>
  );
}
