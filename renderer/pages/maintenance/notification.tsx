import React from "react";
import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import SectionHeading from "@/components/atoms/SectionHeading";
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function NotificationPage() {
  const notifications: any = [];
  // const notifications = [
  //   {
  //     id: 1,
  //     type: "warning",
  //     title: "Laporan Breakdown Baru",
  //     message: "Operator melaporkan kerusakan pada DUMP TRUCK DT-005 di Area Tambang B.",
  //     time: "30 menit yang lalu",
  //     isRead: false,
  //   },
  //   {
  //     id: 2,
  //     type: "info",
  //     title: "Penugasan Servis",
  //     message: "Anda ditugaskan untuk melakukan servis berkala pada BULLDOZER BD-002 besok.",
  //     time: "2 jam yang lalu",
  //     isRead: false,
  //   },
  //   {
  //     id: 3,
  //     type: "success",
  //     title: "Status Perbaikan Diperbarui",
  //     message: "Status perbaikan EXCAVATOR EX-001 telah diubah menjadi Selesai.",
  //     time: "1 hari yang lalu",
  //     isRead: true,
  //   },
  // ];

  return (
    <React.Fragment>
      <MaintenanceLayout
        title="Pusat Notifikasi"
        subtitle="Pantau semua peringatan, laporan, dan tugas"
      >
        <div className="mb-6">
          <SectionHeading
            title="Daftar Notifikasi"
            description="Informasi pemeliharaan, jadwal, dan laporan kerusakan unit."
          />
        </div>

        <div className="space-y-4">
          {notifications.map((notif: any) => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 rounded-2xl border ${
                notif.isRead
                  ? "border-slate-200 dark:border-white/5 bg-slate-200/50 dark:bg-white/5"
                  : "border-sky-500/30 bg-sky-500/10"
              } p-5 transition hover:bg-slate-300/50 dark:bg-white/10`}
            >
              <div
                className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  notif.type === "info"
                    ? "bg-sky-500/20 text-sky-400"
                    : notif.type === "success"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                }`}
              >
                {notif.type === "info" ? (
                  <FaInfoCircle />
                ) : notif.type === "success" ? (
                  <FaCheckCircle />
                ) : (
                  <FaExclamationTriangle />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{notif.title}</h4>
                  <span className="text-xs text-slate-400 dark:text-slate-600 dark:text-slate-400">{notif.time}</span>
                </div>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{notif.message}</p>
              </div>
              {!notif.isRead && (
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]"></div>
              )}
            </div>
          ))}
        </div>
      </MaintenanceLayout>
    </React.Fragment>
  );
}
