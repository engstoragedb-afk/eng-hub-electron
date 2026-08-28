import { useRouter } from "next/router";
import { FaTruck, FaList, FaUserCog, FaWrench, FaExclamationTriangle, FaChevronRight } from "react-icons/fa";
import { dashboardService } from "@/services";
import { unitService } from "@/services/unit-service";

import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import StatCard from "@/components/molecules/StatCard";
import SectionHeading from "@/components/atoms/SectionHeading";
import dynamic from 'next/dynamic';
import React, { useState, useEffect } from "react";
import Link from "next/link";

const TrenPerbaikanChart = dynamic(() => import("../../components/organisms/MaintenanceCharts").then(mod => mod.TrenPerbaikanChart), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[250px] animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">Memuat Grafik...</div>
});

const StatusUnitChart = dynamic(() => import("../../components/organisms/MaintenanceCharts").then(mod => mod.StatusUnitChart), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[250px] animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">Memuat Grafik...</div>
});

const iconMapping = {
  truck: <FaTruck />,
  list: <FaList />,
  "user-gear": <FaUserCog />,
  "screwdriver-wrench": <FaWrench />,
};

const categoryImages: Record<string, string> = {
  EXCAVATOR: "/units/exavator.png",
  BULLDOZER: "/units/bulldozer.png",
  VIBRO: "/units/vibro.png",
  "MOTOR GRADER": "/units/motor-grader.png",
  TRUCK: "/units/truck.png",
};

export default function MaintenanceDashboard() {
  const router = useRouter();
  const [chartFilter, setChartFilter] = useState<any>("5 minggu");
  const [stats, setStats] = useState<any[]>([]);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [warningUnits, setWarningUnits] = useState<any[]>([]);
  const [isLoadingWarnings, setIsLoadingWarnings] = useState(true);

  useEffect(() => {
    dashboardService.getStats()
      .then((data) => {
        if (data) {
          setStats(data);
        }
      })
      .catch((err) => console.error("Failed to fetch dashboard stats:", err));

    setIsLoadingWarnings(true);
    unitService.getAllUnitsWithDetail()
      .then((data) => {
        const rawList = data || [];
        setAllUnits(rawList);

        const processed = rawList.map((unit: any) => {
          const rawHours = unit.hours !== undefined && unit.hours !== null ? unit.hours : unit.hm;
          const hoursNum = parseFloat(String(rawHours ?? 0).replace(/[^\d.-]/g, ''));
          const isZeroHours = isNaN(hoursNum) || hoursNum <= 0;

          const aplItems = (unit.aplData || []).map((apl: any) => {
            const input = apl.input ?? 0;
            const vault = apl.vault ?? 0;
            const isUnconfigured = (!apl.total || apl.total === 0) && (!apl.vault || apl.vault === 0);
            let level: 'CRITICAL' | 'URGENT' | 'ATTENTION' | 'NORMAL' = 'NORMAL';
            let message = 'Dalam batas normal';

            if (!isZeroHours && vault > 0 && !isUnconfigured) {
              if (input < 0) {
                level = 'CRITICAL';
                message = 'Telah melewati batas rekomendasi';
              } else if (input > 0 && input <= 10) {
                level = 'URGENT';
                message = 'Sudah harus diganti';
              } else if (input > 10 && input < 50) {
                level = 'ATTENTION';
                message = 'Mendekati jadwal pemeliharaan';
              } else {
                level = 'NORMAL';
                message = 'Dalam batas normal';
              }
            }

            return {
              ...apl,
              level,
              message,
              input,
              vault,
              isUnconfigured
            };
          });

          // Determine most severe item and unit status
          let mostSevereLevel: 'CRITICAL' | 'URGENT' | 'ATTENTION' | 'NORMAL' = 'NORMAL';
          let mostSevereItem = aplItems.find((i: any) => !i.isUnconfigured && (i.vault ?? 0) > 0) || aplItems[0] || null;

          if (!isZeroHours) {
            const criticalItems = aplItems.filter((i: any) => !i.isUnconfigured && (i.vault ?? 0) > 0 && i.level === 'CRITICAL');
            const urgentItems = aplItems.filter((i: any) => !i.isUnconfigured && (i.vault ?? 0) > 0 && i.level === 'URGENT');
            const attentionItems = aplItems.filter((i: any) => !i.isUnconfigured && (i.vault ?? 0) > 0 && i.level === 'ATTENTION');

            if (criticalItems.length > 0) {
              mostSevereLevel = 'CRITICAL';
              mostSevereItem = criticalItems.sort((a: any, b: any) => a.input - b.input)[0];
            } else if (urgentItems.length > 0) {
              mostSevereLevel = 'URGENT';
              mostSevereItem = urgentItems.sort((a: any, b: any) => a.input - b.input)[0];
            } else if (attentionItems.length > 0) {
              mostSevereLevel = 'ATTENTION';
              mostSevereItem = attentionItems.sort((a: any, b: any) => a.input - b.input)[0];
            } else {
              mostSevereLevel = 'NORMAL';
              mostSevereItem = aplItems.find((i: any) => !i.isUnconfigured && (i.vault ?? 0) > 0) || aplItems[0] || null;
            }
          } else {
            mostSevereLevel = 'NORMAL';
            mostSevereItem = aplItems.find((i: any) => !i.isUnconfigured && (i.vault ?? 0) > 0) || aplItems[0] || null;
          }

          const priorityOrder: Record<string, number> = {
            CRITICAL: 1,
            URGENT: 2,
            ATTENTION: 3,
            NORMAL: 4
          };

          const categoryName = unit.category?.name || (typeof unit.category === 'string' ? unit.category : '');
          const imageUrl = unit.image || (categoryName ? categoryImages[categoryName] : '');

          let calculatedService = 'NORMAL';
          if (!isZeroHours && mostSevereLevel !== 'NORMAL' && mostSevereItem?.vault) {
            calculatedService = String(mostSevereItem.vault);
          }

          return {
            id: unit.id,
            unit_name: unit.code || unit.name || 'Unknown Unit',
            category: categoryName,
            type: unit.type?.name || (typeof unit.type === 'string' ? unit.type : ''),
            image: imageUrl,
            service: (isZeroHours || mostSevereLevel === 'NORMAL') ? 'NORMAL' : calculatedService,
            hours: unit.hours,
            mostSevereLevel,
            priority: priorityOrder[mostSevereLevel] || 5,
            targetItem: mostSevereItem,
            dueCount: isZeroHours ? 0 : aplItems.filter((i: any) => !i.isUnconfigured && (i.vault ?? 0) > 0 && (i.input < 0 || (i.input > 0 && i.input < 50))).length
          };
        });

        // Urutkan berdasarkan prioritas status (CRITICAL -> URGENT -> ATTENTION -> NORMAL) dan sisa jam terendah
        const sorted = processed.sort((a: any, b: any) => {
          if (a.priority !== b.priority) return a.priority - b.priority;
          const inputA = a.targetItem ? a.targetItem.input : 9999;
          const inputB = b.targetItem ? b.targetItem.input : 9999;
          return inputA - inputB;
        });

        // Ambil 5 data teratas untuk widget
        setWarningUnits(sorted.slice(0, 5));
      })
      .catch((err) => console.error("Failed to fetch units for dashboard warning:", err))
      .finally(() => setIsLoadingWarnings(false));
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
            const href = isUnit ? "/maintenance/unit" : undefined;
            
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
            <StatusUnitChart units={allUnits} />
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          {/* Pekerjaan Prioritas */}
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

          {/* Peringatan Servis Widget */}
          <div className="rounded-3xl border border-slate-300 dark:border-white/10 bg-slate-200/50 dark:bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <SectionHeading
                title="Peringatan Servis"
                description="Top unit berdasarkan tingkat urgensi servis"
              />
              <Link 
                href="/maintenance/peringatan" 
                className="-mt-5 text-xs font-bold text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 transition"
              >
                Lihat Semua →
              </Link>
            </div>
            
            <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
              {isLoadingWarnings ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
                  <p className="text-xs text-slate-400">Memuat peringatan unit...</p>
                </div>
              ) : warningUnits.length === 0 ? (
                <div className="rounded-2xl bg-white dark:bg-slate-900/60 px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                  Tidak ada peringatan saat ini.
                </div>
              ) : (
                warningUnits.map((unit) => {
                  const isCritical = unit.mostSevereLevel === "CRITICAL";
                  const isUrgent = unit.mostSevereLevel === "URGENT";
                  const isAttention = unit.mostSevereLevel === "ATTENTION";

                  let barColor = "bg-emerald-500";
                  let badgeColor = "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20";
                  let timeColor = "text-emerald-600 dark:text-emerald-400";
                  let iconBg = "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10";

                  if (isCritical) {
                    barColor = "bg-rose-500";
                    badgeColor = "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20";
                    timeColor = "text-rose-600 dark:text-rose-400";
                    iconBg = "bg-rose-50 text-rose-500 dark:bg-rose-500/10";
                  } else if (isUrgent) {
                    barColor = "bg-amber-500";
                    badgeColor = "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20";
                    timeColor = "text-amber-600 dark:text-amber-400";
                    iconBg = "bg-amber-50 text-amber-500 dark:bg-amber-500/10";
                  } else if (isAttention) {
                    barColor = "bg-sky-500";
                    badgeColor = "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/20";
                    timeColor = "text-sky-600 dark:text-sky-400";
                    iconBg = "bg-sky-50 text-sky-500 dark:bg-sky-500/10";
                  }

                  const unitImage = unit.image;

                  return (
                    <div 
                      key={unit.id} 
                      onClick={() => router.push(`/maintenance/detail-unit?id=${unit.id}`)}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-white/5 shadow-xs relative overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    >
                      {/* Left Accent Bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${barColor}`}></div>

                      <div className="flex items-center gap-3 ml-2 min-w-0">
                        {/* Unit Image / Avatar */}
                        <div className="relative w-10 h-10 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/5 flex items-center justify-center overflow-hidden p-1 shadow-2xs">
                          {unitImage ? (
                            <img 
                              src={unitImage} 
                              alt={unit.unit_name} 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className={`w-full h-full rounded-lg flex items-center justify-center ${iconBg}`}>
                              {isCritical ? <FaExclamationTriangle size={14} /> : <FaWrench size={14} />}
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-slate-900 dark:text-white text-xs font-black uppercase tracking-wide">
                              {unit.unit_name}
                            </span>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-full uppercase border ${badgeColor}`}>
                              {unit.mostSevereLevel}
                            </span>
                            {unit.service && unit.service !== "NORMAL" && (
                              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/5">
                                PS {unit.service}
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 font-semibold text-xs truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {unit.targetItem ? unit.targetItem.name : "Kondisi Normal"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-4 ml-14 sm:ml-0 mt-2 sm:mt-0 shrink-0">
                        {/* Sisa Waktu */}
                        <div className="flex flex-col items-start sm:items-end">
                          <span className="text-slate-400 dark:text-slate-500 text-[8px] font-extrabold tracking-widest uppercase">
                            SISA BATAS
                          </span>
                          <span className={`font-black text-xs ${timeColor}`}>
                            {unit.targetItem ? `${unit.targetItem.input} Jam` : "Aman"}
                          </span>
                        </div>
                        
                        {/* Button */}
                        <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                          <FaChevronRight size={9} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </MaintenanceLayout>
    </React.Fragment>
  );
}
