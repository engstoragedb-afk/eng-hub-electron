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
      // {
      //   href: "/maintenance/perbaikan",
      //   label: "Breakdown",
      //   icon: <FaList />,
      //   activeBase: "/maintenance/perbaikan",
      // },
      {
        href: "/maintenance/operator",
        label: "Operator",
        icon: <FaUserCog />,
        activeBase: "/maintenance/operator",
      },
      // {
      //   href: "/maintenance/mechanic",
      //   label: "Mechanic",
      //   icon: <FaWrench />,
      //   activeBase: "/maintenance/mechanic",
      // },
      // {
      //   href: "/maintenance/jadwal",
      //   label: "Jadwal",
      //   icon: <FaCalendarCheck />,
      //   activeBase: "/maintenance/jadwal",
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

  // Show only the nav group that matches the heading prop
  const groupsToShow = navGroups.filter((g) => g.title === heading);

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-full flex-col border-r border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/90 backdrop-blur transition-all duration-300 ${
        isSidebarOpen ? "w-72 p-6" : "w-20 p-4 items-center"
      }`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-10 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs text-white shadow hover:bg-sky-400 transition-colors"
      >
        {isSidebarOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </button>

      <div className={`mb-10 flex items-center gap-3 ${!isSidebarOpen && "justify-center mt-2"}`}>
        <div className="flex shrink-0 h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-950/70 p-1">
          <Image
            src="/images/icon.png"
            alt="ENG Group"
            width={64}
            height={64}
            className="rounded-xl object-contain h-full w-full"
          />
        </div>
        {isSidebarOpen && (
          <div className="overflow-hidden whitespace-nowrap transition-all duration-300">
            <p className="text-xs uppercase tracking-[0.3em] text-sky-600 dark:text-sky-300">
              ENG HUB
            </p>
            <h1 className="text-lg font-bold">{heading}</h1>
          </div>
        )}
      </div>

      <div className="space-y-6 text-sm w-full">
        {groupsToShow.map((group) => (
          <div key={group.title} className="w-full">
            {isSidebarOpen && (
              <p className="mb-3 px-4 text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400 overflow-hidden whitespace-nowrap">
                {group.title}
              </p>
            )}
            <nav className="space-y-2 w-full">
              {group.items.map((item) => {
                const isActive = router.pathname === item.activeBase;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={`flex items-center gap-3 rounded-2xl transition overflow-hidden whitespace-nowrap ${
                      isActive
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-white/5"
                    } ${isSidebarOpen ? "px-4 py-3" : "px-0 py-3 justify-center"}`}
                  >
                    <span className="text-xl shrink-0">{item.icon}</span>
                    {isSidebarOpen && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6 w-full flex flex-col items-center justify-center gap-4">
        <button
          onClick={handleLogout}
          title={!isSidebarOpen ? "Keluar" : undefined}
          className={`flex items-center gap-3 rounded-2xl transition-colors text-rose-400 hover:bg-rose-500/10 overflow-hidden whitespace-nowrap ${
            isSidebarOpen ? "px-4 py-3 w-full" : "p-3"
          }`}
        >
          <FaSignOutAlt className="text-xl shrink-0" />
          {isSidebarOpen && <span>Keluar</span>}
        </button>
        
        {isSidebarOpen && (
          <div className="text-[10px] text-slate-400 dark:text-slate-500 tracking-widest font-mono">
            v{process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}
          </div>
        )}
      </div>
    </aside>
  );
}
