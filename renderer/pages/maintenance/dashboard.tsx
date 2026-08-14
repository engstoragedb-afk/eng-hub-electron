import { useRouter } from "next/router";
import { FaTruck, FaList, FaUserCog, FaWrench } from "react-icons/fa";
import { dashboardService } from "@/services";

import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import StatCard from "@/components/molecules/StatCard";
import SectionHeading from "@/components/atoms/SectionHeading";
import dynamic from 'next/dynamic';

const TrenPerbaikanChart = dynamic(() => import("../../components/organisms/MaintenanceCharts").then(mod => mod.TrenPerbaikanChart), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[250px] animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">Memuat Grafik...</div>
});

const KomposisiUnitChart = dynamic(() => import("../../components/organisms/MaintenanceCharts").then(mod => mod.KomposisiUnitChart), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[250px] animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">Memuat Grafik...</div>
});
import React, { useState, useEffect } from "react";
import { auditLogService } from "@/services/audit-log-service";
import { ACTIONS } from "@/common/utils/action";
import Link from "next/link";

const iconMapping = {
  truck: <FaTruck />,
  list: <FaList />,
  "user-gear": <FaUserCog />,
  "screwdriver-wrench": <FaWrench />,
};

export default function MaintenanceDashboard() {
  const router = useRouter();
  const [chartFilter, setChartFilter] = useState<any>("5 minggu");
  const [stats, setStats] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    dashboardService.getStats()
      .then((data) => {
        if (data) {
          setStats(data);
        }
      })
      .catch((err) => console.error("Failed to fetch dashboard stats:", err));

    auditLogService.getLatestLogs(5, ACTIONS.CRON_APL_WARNING)
      .then((data) => {
        setAuditLogs(data || []);
      })
      .catch((err) => console.error("Failed to fetch audit logs:", err));
  }, []);


  return (
    <React.Fragment>
      <MaintenanceLayout
        title="Dashboard Maintenance"
        subtitle="Pantau pekerjaan dan ketersediaan tim"
      >
        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const isUnit = stat.title.includes("Unit");
            const isBreakdown = stat.title.includes("Breakdown");
            const href = isUnit ? "/maintenance/unit" : isBreakdown ? "/maintenance/perbaikan" : undefined;
            
            const card = (
              <StatCard
                title={stat.title}
                value={stat.value}
                description={stat.description}
                tone={stat.tone as any}
                icon={iconMapping[stat.icon as keyof typeof iconMapping]}
              />
            );

            return href ? (
              <Link href={href} key={stat.title} className="block transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-500/10 rounded-3xl cursor-pointer">
                {card}
              </Link>
            ) : (
              <div key={stat.title}>{card}</div>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5 flex flex-col">
            <TrenPerbaikanChart filter={chartFilter} setFilter={setChartFilter} />
          </div>
          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5 flex flex-col">
            <KomposisiUnitChart filter={chartFilter} />
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5">
            <SectionHeading
              title="Pekerjaan Prioritas"
              description="Perbaikan yang membutuhkan perhatian segera"
            />
            <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="rounded-2xl bg-white dark:bg-slate-900/60 px-4 py-4 text-center text-slate-400 dark:text-slate-500">
                Tidak ada pekerjaan prioritas saat ini.
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <SectionHeading
                title="Peringatan Servis"
                description="Notifikasi sparepart dan jadwal"
              />
              <Link 
                href="/maintenance/peringatan" 
                className="-mt-5 text-sm font-semibold text-sky-500 hover:text-sky-600 transition"
              >
                Lihat Semua
              </Link>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
              {auditLogs.length === 0 && (
                <div className="rounded-2xl bg-white dark:bg-slate-900/60 px-4 py-4 text-center text-slate-400 dark:text-slate-500">
                  Tidak ada peringatan saat ini.
                </div>
              )}
              {auditLogs.map((log) => {
                const oldData = JSON.parse(log.old_data || "{}");
                const newData = JSON.parse(log.new_data || "{}");
                const isCritical = newData.level === "CRITICAL";
                return (
                  <div 
                    key={log.id} 
                    onClick={() => oldData.unit_id && router.push(`/maintenance/detail-unit?id=${oldData.unit_id}`)}
                    className="flex items-center justify-between rounded-2xl bg-white dark:bg-slate-900/60 px-4 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-sky-100 dark:bg-sky-500/20 px-2.5 py-1 text-xs font-bold tracking-wide text-sky-600 dark:text-sky-400">
                        {oldData.unit_name}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {oldData.name}
                      </span>
                    </div>
                    <span className={`text-sm font-bold ${isCritical ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400'}`}>
                      {isCritical ? 'Critical' : 'Warning'} • Sisa {newData.input} jam
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </MaintenanceLayout>
    </React.Fragment>
  );
}
